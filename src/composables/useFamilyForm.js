// File: src/composables/useFamilyForm.js

import { ref } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

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

  // For quick text entry -> push to arrays
  const tempSonName = ref("");
  const tempDaughterName = ref("");

  // Local array manipulation
  function addSonLocally() {
    if (!tempSonName.value) return;
    newSons.value.push({ name: tempSonName.value, gender: "male" });
    tempSonName.value = "";
  }
  function removeSonLocally(index) {
    newSons.value.splice(index, 1);
  }

  function addDaughterLocally() {
    if (!tempDaughterName.value) return;
    newDaughters.value.push({ name: tempDaughterName.value, gender: "female" });
    tempDaughterName.value = "";
  }
  function removeDaughterLocally(index) {
    newDaughters.value.splice(index, 1);
  }

  // Create an immediate family from a single "person"
  function createImmediateFamily(person) {
    if (!person) return;

    // (1) Create the family node & push to store
    let familyId = `family-${familyTreeStore.families.length + 1}`;
    familyTreeStore.families.push({
      id: familyId,
      members: [person.id],
      husbandId: null,
      wifeId: null,
      sons: [],
      daughters: [],
    });
    familyTreeStore.nodes.push({
      data: { id: familyId, label: "Family", isFamily: true },
    });

    const alreadyLinked = familyTreeStore.edges.some(
      (e) => e.data.source === person.id && e.data.target === familyId
    );

    if (!alreadyLinked) {
      // If he’s male, label the edge "Husband" (or "Father" once kids exist)
      // If she’s female, label "Wife"/"Mother"
      const label = person.gender === "male" ? "Husband" : "Wife";
      familyTreeStore.edges.push({
        data: { source: person.id, target: familyId, label },
      });
    }

    // (2) If spouseName is given, add spouse with label “Husband” or “Wife”
    let spouseId = null;
    if (spouseName.value) {
      spouseId = `person-${familyTreeStore.persons.length + 1}`;
      const spouseGender = person.gender === "male" ? "female" : "male";
      const spouseRelation = person.gender === "male" ? "Wife" : "Husband";

      familyTreeStore.persons.push({
        id: spouseId,
        name: spouseName.value,
        gender: spouseGender,
      });
      familyTreeStore.nodes.push({
        data: { id: spouseId, label: spouseName.value, gender: spouseGender },
      });
      familyTreeStore.edges.push({
        data: { source: spouseId, target: familyId, label: spouseRelation },
      });
    }

    // (3) Update husband/wife IDs
    const family = familyTreeStore.families.find((f) => f.id === familyId);
    if (person.gender === "male") {
      family.husbandId = person.id;
      if (spouseId) family.wifeId = spouseId;
    } else {
      family.wifeId = person.id;
      if (spouseId) family.husbandId = spouseId;
    }

    // (4) Add new sons and daughters
    newSons.value.forEach((son) => {
      familyTreeStore.addPerson({
        ...son,
        relation: "Son",
        linkedFamilyId: familyId,
      });
    });
    newDaughters.value.forEach((daughter) => {
      familyTreeStore.addPerson({
        ...daughter,
        relation: "Daughter",
        linkedFamilyId: familyId,
      });
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

    // If fatherName was typed, create father
    if (fatherName.value) {
      fatherId = `person-${familyTreeStore.persons.length + 1}`;
      familyTreeStore.persons.push({
        id: fatherId,
        name: fatherName.value,
        gender: "male",
      });
      familyTreeStore.nodes.push({
        data: { id: fatherId, label: fatherName.value, gender: "male" },
      });
    }
    // If motherName was typed, create mother
    if (motherName.value) {
      motherId = `person-${familyTreeStore.persons.length + 1}`;
      familyTreeStore.persons.push({
        id: motherId,
        name: motherName.value,
        gender: "female",
      });
      familyTreeStore.nodes.push({
        data: { id: motherId, label: motherName.value, gender: "female" },
      });
    }

    // Create a new family
    const newFamilyId = `family-${familyTreeStore.families.length + 1}`;
    familyTreeStore.families.push({
      id: newFamilyId,
      members: [],
      husbandId: fatherId,
      wifeId: motherId,
      sons: [],
      daughters: [],
    });
    familyTreeStore.nodes.push({
      data: { id: newFamilyId, label: "Family", isFamily: true },
    });

    // Add father and mother to the family members
    if (fatherId)
      familyTreeStore.families
        .find((f) => f.id === newFamilyId)
        .members.push(fatherId);
    if (motherId)
      familyTreeStore.families
        .find((f) => f.id === newFamilyId)
        .members.push(motherId);

    // Add the person to the family members
    if (
      !familyTreeStore.families
        .find((f) => f.id === newFamilyId)
        .members.includes(person.id)
    ) {
      familyTreeStore.families
        .find((f) => f.id === newFamilyId)
        .members.push(person.id);
    }

    // Link the person as "Son" or "Daughter" from that family
    const relation = person.gender === "male" ? "Son" : "Daughter";
    familyTreeStore.edges.push({
      data: {
        source: newFamilyId,
        target: person.id,
        label: relation,
      },
    });

    // Add edges for father and mother if they exist
    if (fatherId) {
      familyTreeStore.edges.push({
        data: {
          source: fatherId,
          target: newFamilyId,
          label: "Father",
        },
      });
    }
    if (motherId) {
      familyTreeStore.edges.push({
        data: {
          source: motherId,
          target: newFamilyId,
          label: "Mother",
        },
      });
    }

    // Update family node label
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

    addSonLocally,
    removeSonLocally,
    addDaughterLocally,
    removeDaughterLocally,

    createImmediateFamily,
    createAncestralFamily,
    resetForm,
  };
}
