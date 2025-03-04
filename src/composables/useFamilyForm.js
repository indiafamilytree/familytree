// File: src/composables/useFamilyForm.js

import { ref } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import { useArrayManipulation } from "@/utils/arrayUtils";

/**
 * useFamilyForm: ephemeral fields + methods to create or update families
 *
 * - spouseName, fatherName, motherName
 * - newSons, newDaughters arrays
 * - createImmediateFamily(person), createAncestralFamily(person)
 */
export function useFamilyForm() {
  const familyTreeStore = useFamilyTreeStore();

  // Local ephemeral form data
  const spouseName = ref("");
  const fatherName = ref("");
  const motherName = ref("");
  const newSons = ref([]);
  const newDaughters = ref([]);

  // Use array manipulation utility
  const {
    tempName: tempSonName,
    addItemLocally: addSonLocally,
    removeItemLocally: removeSonLocally,
  } = useArrayManipulation();

  const {
    tempName: tempDaughterName,
    addItemLocally: addDaughterLocally,
    removeItemLocally: removeDaughterLocally,
  } = useArrayManipulation();

  // Create an immediate family from a single "person"
  function createImmediateFamily(person) {
    if (!person) return;

    // Generate a new family id using the store method.
    let familyId = familyTreeStore.getNewFamilyId();
    familyTreeStore.families.push({
      id: familyId,
      husbandId: null,
      wifeId: null,
      sons: [],
      daughters: [],
    });
    familyTreeStore.nodes.push({
      data: { id: familyId, label: "Family", isFamily: true },
    });

    // Link the person to the family node.
    // The label depends on the person's gender: if male, treat him as Husband; if female, as Wife.
    const role = person.gender === "male" ? "Husband" : "Wife";
    const alreadyLinked = familyTreeStore.edges.some(
      (e) => e.data.source === person.id && e.data.target === familyId
    );
    if (!alreadyLinked) {
      familyTreeStore.edges.push({
        data: { source: person.id, target: familyId, label: role },
      });
    }

    // (2) If spouseName is given, add spouse with label “Husband” or “Wife”
    let spouseId = null;
    if (spouseName.value) {
      spouseId = familyTreeStore.getNewPersonId();
      const spouseGender = person.gender === "male" ? "female" : "male";
      const spouseRelation = person.gender === "male" ? "Wife" : "Husband";

      familyTreeStore.persons.push({
        id: spouseId,
        name: spouseName.value,
        gender: spouseGender,
        familyLinks: [], // assuming persons use a familyLinks property if needed
      });
      familyTreeStore.nodes.push({
        data: { id: spouseId, label: spouseName.value, gender: spouseGender },
      });
      familyTreeStore.edges.push({
        data: { source: spouseId, target: familyId, label: spouseRelation },
      });
    }

    // (3) Update husband/wife IDs explicitly
    const family = familyTreeStore.families.find((f) => f.id === familyId);
    if (person.gender === "male") {
      family.husbandId = person.id;
      if (spouseId) family.wifeId = spouseId;
    } else {
      family.wifeId = person.id;
      if (spouseId) family.husbandId = spouseId;
    }

    // (4) Add new sons and daughters.
    // For each child entered in the form, call addPerson and then update the family's explicit arrays.
    newSons.value.forEach((son) => {
      familyTreeStore.addPerson({
        ...son,
        relation: "Son",
        linkedFamilyId: familyId,
        familyLinks: [], // person starts with no familyLinks; they can be updated later if needed
      });
      // Assume the new person is appended at the end of the persons array.
      let newSonId =
        familyTreeStore.persons[familyTreeStore.persons.length - 1].id;
      family.sons.push(newSonId);
    });
    newDaughters.value.forEach((daughter) => {
      familyTreeStore.addPerson({
        ...daughter,
        relation: "Daughter",
        linkedFamilyId: familyId,
        familyLinks: [],
      });
      let newDaughterId =
        familyTreeStore.persons[familyTreeStore.persons.length - 1].id;
      family.daughters.push(newDaughterId);
    });

    // (5) If we actually have children, rename Husband → Father / Wife → Mother
    if (newSons.value.length > 0 || newDaughters.value.length > 0) {
      if (family.husbandId) {
        const husbandEdge = familyTreeStore.edges.find(
          (e) =>
            e.data.source === family.husbandId &&
            e.data.target === familyId &&
            e.data.label === "Husband"
        );
        if (husbandEdge) {
          husbandEdge.data.label = "Father";
        }
      }
      if (family.wifeId) {
        const wifeEdge = familyTreeStore.edges.find(
          (e) =>
            e.data.source === family.wifeId &&
            e.data.target === familyId &&
            e.data.label === "Wife"
        );
        if (wifeEdge) {
          wifeEdge.data.label = "Mother";
        }
      }
    }
  }

  // Create an ancestral family for a single "person" => father & mother
  function createAncestralFamily(person) {
    if (!person) return;

    let fatherId = null;
    let motherId = null;

    // If fatherName was provided, create a father
    if (fatherName.value) {
      fatherId = familyTreeStore.getNewPersonId();
      familyTreeStore.persons.push({
        id: fatherId,
        name: fatherName.value,
        gender: "male",
        familyLinks: [],
      });
      familyTreeStore.nodes.push({
        data: { id: fatherId, label: fatherName.value, gender: "male" },
      });
    }
    // If motherName was provided, create a mother
    if (motherName.value) {
      motherId = familyTreeStore.getNewPersonId();
      familyTreeStore.persons.push({
        id: motherId,
        name: motherName.value,
        gender: "female",
        familyLinks: [],
      });
      familyTreeStore.nodes.push({
        data: { id: motherId, label: motherName.value, gender: "female" },
      });
    }

    // Create a new family with explicit fields and default members array.
    const newFamilyId = familyTreeStore.getNewFamilyId();
    const newFamily = {
      id: newFamilyId,
      husbandId: fatherId,
      wifeId: motherId,
      sons: [],
      daughters: [],
      members: [], // added default members property
    };
    familyTreeStore.families.push(newFamily);
    familyTreeStore.nodes.push({
      data: { id: newFamilyId, label: "Family", isFamily: true },
    });

    // Add father and mother to the members array if they exist.
    if (fatherId) {
      newFamily.members.push({ personId: fatherId, relationship: "parent" });
    }
    if (motherId) {
      newFamily.members.push({ personId: motherId, relationship: "parent" });
    }

    // Add the person as a child to this ancestral family.
    if (person.gender === "male") {
      newFamily.sons.push(person.id);
    } else {
      newFamily.daughters.push(person.id);
    }
    newFamily.members.push({
      personId: person.id,
      relationship: "child",
    });

    // Create the child edge with reversed direction:
    // For ancestral families, the edge goes from the family node to the person.
    familyTreeStore.edges.push({
      data: {
        source: newFamilyId, // from family node
        target: person.id, // to person node
        label: person.gender === "male" ? "Son" : "Daughter",
      },
    });

    // Create edges for the father and mother if they exist.
    if (fatherId) {
      familyTreeStore.edges.push({
        data: { source: fatherId, target: newFamilyId, label: "Father" },
      });
    }
    if (motherId) {
      familyTreeStore.edges.push({
        data: { source: motherId, target: newFamilyId, label: "Mother" },
      });
    }

    // Update the family node label to display parent names.
    const familyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === newFamilyId
    );
    if (familyNode) {
      familyNode.data.label =
        (fatherName.value ? fatherName.value : "") +
        (motherName.value ? `\n${motherName.value}` : "");
    }
  }

  // Reset ephemeral fields
  function resetForm() {
    spouseName.value = "";
    fatherName.value = "";
    motherName.value = "";
    newSons.value = [];
    newDaughters.value = [];
    tempSonName.value = "";
    tempDaughterName.value = "";
  }

  return {
    spouseName,
    fatherName,
    motherName,
    newSons,
    newDaughters,
    tempSonName,
    tempDaughterName,
    addSonLocally: () => addSonLocally(newSons, "male"),
    removeSonLocally: (index) => removeSonLocally(newSons, index),
    addDaughterLocally: () => addDaughterLocally(newDaughters, "female"),
    removeDaughterLocally: (index) =>
      removeDaughterLocally(newDaughters, index),
    createImmediateFamily,
    createAncestralFamily,
    resetForm,
  };
}
