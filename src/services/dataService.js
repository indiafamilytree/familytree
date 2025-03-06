// src/services/dataService.js
import { generateClient } from "aws-amplify/data";
import md5 from "md5";

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */
const client = generateClient({
  authMode: "oidc",
});

// ----- Create Functions -----

// Create a Person record.
export async function createPerson(personData) {
  const { errors, data } = await client.models.Persons.create({
    id: personData.personId || personData.id, // Unique ID for the person
    personId: personData.personId || personData.id,
    name: personData.name,
    gender: personData.gender,
  });
  return { errors, data };
}

// Create a Family record.
export async function createFamily(familyData) {
  const { errors, data } = await client.models.Families.create({
    id: familyData.familyId || familyData.id, // Unique ID for the family
    familyId: familyData.familyId || familyData.id,
    familySignature: familyData.familySignature,
    members: familyData.members,
  });
  return { errors, data };
}

// ----- Update Functions -----

// Update a Person record.
export async function updatePerson(personData) {
  const { errors, data } = await client.models.Persons.update({
    id: personData.personId || personData.id, // Primary key
    personId: personData.personId || personData.id,
    name: personData.name,
    gender: personData.gender,
  });
  return { errors, data };
}

// Update a Family record.
export async function updateFamily(familyData) {
  const { errors, data } = await client.models.Families.update({
    id: familyData.familyId || familyData.id, // Primary key
    familyId: familyData.familyId || familyData.id,
    familySignature: familyData.familySignature,
    members: familyData.members,
  });
  return { errors, data };
}

// ----- Hash Function -----
function hashString(str) {
  let md5hash = md5(str);
  return md5hash;
}

// ----- Per-Record Hash Storage -----
// These objects store the last known hash for each record by its unique ID.
let lastPersonHashes = {};
let lastFamilyHashes = {};

// ----- Batch Upsert Functions -----

/**
 * Batch upsert for Persons.
 * For each person record, compute a hash based on key fields.
 * - If no hash exists (new record), call createPerson.
 * - If the hash exists and is unchanged, skip updating.
 * - If the hash exists but has changed, call updatePerson.
 */
export async function batchUpsertPersons(persons) {
  for (const person of persons) {
    console.log("working on person", person);
    let personstr = JSON.stringify({
      id: person.personId || person.id,
      personId: person.personId || person.id,
      name: person.name,
      gender: person.gender,
    });
    const newHash = hashString(personstr);

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
          // Optionally, add the computed hash to the record so it can be saved in S3.
          person.hash = newHash;
        }
      } catch (error) {
        console.error(`Error creating person ${person.id}:`, error);
      }
      continue;
    }

    // If the hash hasn't changed, skip the update.
    if (lastPersonHashes[person.id] === newHash) {
      console.log(`No change for person , skipping upsert.`, person);
      continue;
    }

    console.log(`old hash and new hash`, lastPersonHashes[person.id], newHash);
    // Otherwise, record has changed; update it.
    console.log(`Change detected for person , updating...`, person);
    try {
      const { errors, data } = await updatePerson(person);
      if (errors && errors.length > 0) {
        console.error(`Error updating person :`, person, errors);
      } else {
        console.log(`Updated person `, person);
        lastPersonHashes[person.id] = newHash;
        person.hash = newHash;
      }
    } catch (error) {
      console.error(`Error updating person :`, person, error);
    }
  }
}

/**
 * Batch upsert for Families.
 * For each family record, compute a hash based on key fields.
 * - If no hash exists (new record), call createFamily.
 * - If the hash exists and is unchanged, skip updating.
 * - If the hash exists but has changed, call updateFamily.
 */
export async function batchUpsertFamilies(families) {
  for (const family of families) {
    let familyStr = JSON.stringify({
      id: family.id,
      familyId: family.id,
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

/**
 * Load hashes from S3-loaded data.
 * When you load your data from S3, if each record already has a 'hash' field,
 * you can populate the corresponding lastPersonHashes and lastFamilyHashes objects.
 * This avoids recomputing the hash for every record on initial load.
 */
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
