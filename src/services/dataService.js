// src/services/dataService.js
import { generateClient } from "aws-amplify/data";

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */
const client = generateClient({
  authMode: "oidc",
});

// Function to create a Person record.
export async function createPerson(personData) {
  const { errors, data } = await client.models.Persons.create({
    id: personData.personId, // Unique ID for the person
    personId: personData.personId, // Unique ID for the person
    firstName: personData.firstName,
    gender: personData.gender,
  });
  return { errors, data };
}

// Function to create a Family record.
export async function createFamily(familyData) {
  const { errors, data } = await client.models.Families.create({
    id: familyData.familyId, // Unique ID for the family
    familyId: familyData.familyId, // Unique ID for the family
    familySignature: familyData.familySignature, // A signature/description
    members: familyData.members, // Object or array of member data (depending on your schema)
  });
  return { errors, data };
}

export async function updatePerson(personData) {
  // Assumes your GraphQL API supports an update mutation for Persons
  const { errors, data } = await client.models.Persons.update({
    id: personData.personId, // assuming "id" is the primary key
    personId: personData.personId,
    firstName: personData.firstName,
    gender: personData.gender,
  });
  return { errors, data };
}

export async function updateFamily(familyData) {
  const { errors, data } = await client.models.Families.update({
    id: familyData.familyId,
    familyId: familyData.familyId,
    familySignature: familyData.familySignature,
    // If your schema stores members as a JSON string:
    members: familyData.members,
  });
  return { errors, data };
}
