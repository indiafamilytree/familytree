// src/services/neo4jService.js
import { generateClient } from "aws-amplify/api";

// Create a typed API client for your custom schema
const client = generateClient({
  authMode: "oidc",
});

/**
 * A generic function to call the custom neo4jOperation query.
 *
 * @param {string} fieldName - The operation to perform (e.g. "createPerson", "updateFamily", etc.)
 * @param {Object} inputObj - The parameters for the operation.
 * @returns {Promise<any>} - The response from your Lambda function.
 */
export async function neo4jOperation(fieldName, inputObj) {
  try {
    // Convert the input object to a JSON string as required by the schema.
    const input = JSON.stringify(inputObj);
    const response = await client.queries.neo4jOperation({
      fieldName,
      input,
    });
    console.log("neo4jOperation response:", response);
    return response;
  } catch (error) {
    console.error("Error performing neo4jOperation:", error);
    throw error;
  }
}

/**
 * Convenience functions for common operations.
 */
export async function createNeo4jPerson({ personId, name, gender }) {
  return neo4jOperation("createPerson", { personId, name, gender });
}

export async function updateNeo4jPerson({ personId, name, gender }) {
  return neo4jOperation("updatePerson", { personId, name, gender });
}

export async function deleteNeo4jPerson({ personId }) {
  return neo4jOperation("deletePerson", { personId });
}

export async function createNeo4jFamily({
  familyId,
  familySignature,
  members,
}) {
  return neo4jOperation("createFamily", { familyId, familySignature, members });
}

export async function updateNeo4jFamily({
  familyId,
  familySignature,
  members,
}) {
  return neo4jOperation("updateFamily", { familyId, familySignature, members });
}

export async function deleteNeo4jFamily({ familyId }) {
  return neo4jOperation("deleteFamily", { familyId });
}
