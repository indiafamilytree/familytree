// stores/family-tree-store/actions/addFamilyMembers.js

import { addPerson } from "./addPerson.js";

export function addFamilyMembers(
  familyId,
  newFamilyMembers,
  enableLogging = false
) {
  if (enableLogging) {
    console.log("addFamilyMembers called with:", {
      familyId,
      newFamilyMembers,
    });
  }

  // Add husband
  if (newFamilyMembers.husband.name) {
    addPerson.call(
      this,
      {
        ...newFamilyMembers.husband,
        relation: "Husband",
        linkedFamilyId: familyId,
      },
      enableLogging
    );
  }

  // Add wife
  if (newFamilyMembers.wife.name) {
    addPerson.call(
      this,
      {
        ...newFamilyMembers.wife,
        relation: "Wife",
        linkedFamilyId: familyId,
      },
      enableLogging
    );
  }

  // Add sons
  newFamilyMembers.sons.forEach((son) => {
    console.log("Adding son:", son); // Log before adding a son
    addPerson.call(
      this,
      {
        ...son,
        relation: "Son", // Corrected relation to "Son"
        linkedFamilyId: familyId,
      },
      enableLogging
    );
  });

  // Add daughters
  newFamilyMembers.daughters.forEach((daughter) => {
    console.log("Adding daughter:", daughter); // Log before adding a daughter
    addPerson.call(
      this,
      {
        ...daughter,
        relation: "Daughter", // Corrected relation to "Daughter"
        linkedFamilyId: familyId,
      },
      enableLogging
    );
  });
}
