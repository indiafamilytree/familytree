import type { Handler } from "aws-lambda";
import neo4j from "neo4j-driver";

export const handler: Handler = async (event, context) => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!, // e.g., "bolt://<your-neo4j-instance>:7687"
    neo4j.auth.basic(process.env.NEO4J_USER_ID!, process.env.NEO4J_SECRET!)
  );

  const session = driver.session();
  try {
    // Read the operation and input from arguments.
    const fieldName = event.arguments.fieldName;
    console.log("fieldNameA: ", fieldName);
    // Parse the JSON string passed as "input" to get an object
    const input = JSON.parse(event.arguments.input);
    console.log("input: ", input);

    // CREATE operations
    if (fieldName === "createPerson") {
      const { personId, name, gender } = input;
      await session.run(
        "CREATE (p:Person {personId: $personId, name: $name, gender: $gender})",
        { personId, name, gender }
      );
    } else if (fieldName === "createFamily") {
      const { familyId, members } = input;
      await session.run("CREATE (f:Family {familyId: $familyId})", {
        familyId,
      });

      // Expecting members as a JSON string representing an array of objects,
      // e.g. '[{"personId": "p1", "relationship": "parent"}, ...]'
      const memberList =
        typeof members === "string" ? JSON.parse(members) : members;
      for (const member of memberList) {
        const { personId, relationship } = member;
        await session.run(
          `
          MATCH (p:Person {personId: $personId})
          MATCH (f:Family {familyId: $familyId})
          MERGE (p)-[r:BELONGS_TO]->(f)
          SET r.relationship = $relationship
          `,
          { personId, familyId, relationship }
        );
      }
    }
    // UPDATE operations
    else if (fieldName === "updatePerson") {
      const { personId, name, gender } = input;
      await session.run(
        `
        MATCH (p:Person {personId: $personId})
        SET p.name = $name, p.gender = $gender
        `,
        { personId, name, gender }
      );
    } else if (fieldName === "updateFamily") {
      const { familyId, members } = input;
      /*  await session.run(
        `
        MATCH (f:Family {familyId: $familyId})
        SET f.familySignature = $familySignature
        `,
        { familyId, familySignature }
      ); */
      await session.run(
        `
        MATCH (p:Person)-[r:BELONGS_TO]->(f:Family {familyId: $familyId})
        DELETE r
        `,
        { familyId }
      );
      const memberList =
        typeof members === "string" ? JSON.parse(members) : members;
      for (const member of memberList) {
        const { personId, relationship } = member;
        await session.run(
          `
          MATCH (p:Person {personId: $personId})
          MATCH (f:Family {familyId: $familyId})
          MERGE (p)-[r:BELONGS_TO]->(f)
          SET r.relationship = $relationship
          `,
          { personId, familyId, relationship }
        );
      }
    }
    // DELETE operations
    else if (fieldName === "deletePerson") {
      const { personId } = input;
      await session.run(
        `
        MATCH (p:Person {personId: $personId})
        DETACH DELETE p
        `,
        { personId }
      );
    } else if (fieldName === "deleteFamily") {
      const { familyId } = input;
      await session.run(
        `
        MATCH (f:Family {familyId: $familyId})
        DETACH DELETE f
        `,
        { familyId }
      );
    }

    // Return a success message (you can customize the response as needed)
    return {
      success: true,
      message: `Operation ${fieldName} executed successfully.`,
      inputReceived: input,
    };
  } catch (error) {
    console.error("Neo4j write error:", error);
    throw new Error("Error writing to Neo4j");
  } finally {
    await session.close();
    await driver.close();
  }
};
