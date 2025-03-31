// src/services/dataService.js
import { generateClient } from "aws-amplify/data";
import md5 from "md5";

// Import neo4j service functions
import {
  createNeo4jPerson,
  updateNeo4jPerson,
  createNeo4jFamily,
  updateNeo4jFamily,
} from "@/services/neo4jService";

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */
const client = generateClient({
  authMode: "oidc",
});

// ----- Create Functions -----

// Create a Person record.
export async function createPerson(personData) {
  let tempPerson = {
    id: personData.personId || personData.id, // Unique ID for the person
    personId: personData.personId || personData.id,
    name: personData.name,
    gender: personData.gender,
  };
  const { errors, data } = await client.models.Persons.create(tempPerson);
  if (!errors || errors.length === 0) {
    try {
      // Also create the Person node in Neo4j
      await createNeo4jPerson(tempPerson);
    } catch (neoErr) {
      console.error("Error creating person in Neo4j:", neoErr);
      // Optionally, you could add rollback or additional error handling here.
    }
  }
  return { errors, data };
}

// Create a Family record.
export async function createFamily(familyData) {
  let tempFamily = {
    id: familyData.familyId || familyData.id, // Unique ID for the family
    familyId: familyData.familyId || familyData.id,
    familySignature: familyData.familySignature,
    members: familyData.members,
  };
  const { errors, data } = await client.models.Families.create(tempFamily);
  if (!errors || errors.length === 0) {
    try {
      // Also create the Family node in Neo4j
      await createNeo4jFamily(tempFamily);
    } catch (neoErr) {
      console.error("Error creating family in Neo4j:", neoErr);
    }
  }
  return { errors, data };
}

// ----- Update Functions -----

// Update a Person record.
export async function updatePerson(personData) {
  let tempPerson = {
    id: personData.personId || personData.id, // Unique ID for the person
    personId: personData.personId || personData.id,
    name: personData.name,
    gender: personData.gender,
  };
  const { errors, data } = await client.models.Persons.update(tempPerson);
  if (!errors || errors.length === 0) {
    try {
      // Also update the Person node in Neo4j
      await updateNeo4jPerson(tempPerson);
    } catch (neoErr) {
      console.error("Error updating person in Neo4j:", neoErr);
    }
  }
  return { errors, data };
}

// Update a Family record.
export async function updateFamily(familyData) {
  let tempFamily = {
    id: familyData.familyId || familyData.id, // Unique ID for the family
    familyId: familyData.familyId || familyData.id,
    familySignature: familyData.familySignature,
    members: familyData.members,
  };
  const { errors, data } = await client.models.Families.update(tempFamily);
  if (!errors || errors.length === 0) {
    try {
      // Also update the Family node in Neo4j
      await updateNeo4jFamily(tempFamily);
    } catch (neoErr) {
      console.error("Error updating family in Neo4j:", neoErr);
    }
  }
  return { errors, data };
}

// ----- Hash Function -----
function hashString(str) {
  return md5(str);
}

// ----- Per-Record Hash Storage -----
let lastPersonHashes = {};
let lastFamilyHashes = {};

// ----- Batch Upsert Functions -----

export async function batchUpsertPersons(persons) {
  for (const person of persons) {
    console.log("working on person", person);
    const personStr = JSON.stringify({
      id: person.personId || person.id,
      personId: person.personId || person.id,
      name: person.name,
      gender: person.gender,
    });
    const newHash = hashString(personStr);

    console.log("hashes", lastPersonHashes, lastFamilyHashes);
    // If no stored hash, assume it's a new record.
    if (lastPersonHashes[person.id] === undefined) {
      console.log(`New record for person, creating...`, person);
      try {
        const { errors, data } = await createPerson(person);
        if (errors && errors.length > 0) {
          console.error(`Error creating person ${person.id}:`, errors);
        } else {
          console.log(`Created person `, person);
          lastPersonHashes[person.id] = newHash;
          person.hash = newHash;
        }
      } catch (error) {
        console.error(`Error creating person ${person.id}:`, error);
      }
      continue;
    }

    // If the hash hasn't changed, skip the update.
    if (lastPersonHashes[person.id] === newHash) {
      console.log(`No change for person, skipping upsert.`, person);
      continue;
    }

    console.log(`old hash and new hash`, lastPersonHashes[person.id], newHash);
    console.log(`Change detected for person, updating...`, person);
    try {
      const { errors, data } = await updatePerson(person);
      if (errors && errors.length > 0) {
        console.error(`Error updating person:`, person, errors);
      } else {
        console.log(`Updated person `, person);
        lastPersonHashes[person.id] = newHash;
        person.hash = newHash;
      }
    } catch (error) {
      console.error(`Error updating person:`, person, error);
    }
  }
}

export async function batchUpsertFamilies(families) {
  for (const family of families) {
    const familyStr = JSON.stringify({
      id: family.familyId || family.id,
      familyId: family.familyId || family.id,
      familySignature: family.familySignature || "",
      members: JSON.stringify(family.members),
    });
    const newHash = hashString(familyStr);

    if (!lastFamilyHashes[family.id]) {
      console.log(`New record for family ${family.id}, creating...`);
      try {
        const { errors, data } = await createFamily(family);
        if (errors && errors.length > 0) {
          console.error(`Error creating family ${family.id}:`, errors);
        } else {
          console.log(`Created family ${family.id}`);
          lastFamilyHashes[family.id] = newHash;
          family.hash = newHash;
        }
      } catch (error) {
        console.error(`Error creating family ${family.id}:`, error);
      }
      continue;
    }

    if (lastFamilyHashes[family.id] === newHash) {
      console.log(`No change for family ${family.id}, skipping upsert.`);
      continue;
    }

    console.log(`Change detected for family ${family.id}, updating...`, family);
    try {
      const { errors, data } = await updateFamily(family);
      if (errors && errors.length > 0) {
        console.error(`Error updating family ${family.id}:`, errors);
      } else {
        console.log(`Updated family ${family.id}`);
        lastFamilyHashes[family.id] = newHash;
        family.hash = newHash;
      }
    } catch (error) {
      console.error(`Error updating family ${family.id}:`, error);
    }
  }
}

export function loadHashesFromS3(amplifyData) {
  if (amplifyData.Persons) {
    for (const p of amplifyData.Persons) {
      if (p.hash) {
        lastPersonHashes[p.personId] = p.hash;
      } else {
        const computedHash = hashString(
          JSON.stringify({
            id: p.personId || p.id,
            personId: p.personId || p.id,
            name: p.name,
            gender: p.gender,
          })
        );
        lastPersonHashes[p.personId || p.id] = computedHash;
        p.hash = computedHash;
      }
    }
  }
  if (amplifyData.Families) {
    for (const f of amplifyData.Families) {
      if (f.hash) {
        lastFamilyHashes[f.familyId] = f.hash;
      } else {
        const computedHash = hashString(
          JSON.stringify({
            id: f.familyId || f.id,
            familyId: f.familyId || f.id,
            familySignature: f.familySignature,
            members: f.members,
          })
        );
        lastFamilyHashes[f.familyId || f.id] = computedHash;
        f.hash = computedHash;
      }
    }
  }
}
