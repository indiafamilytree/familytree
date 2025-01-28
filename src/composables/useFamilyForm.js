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
  // If the person is male => that person is "husband"; female => "wife".
  // If spouseName is provided, we create the spouse as well.
  // Then we add any newSons/newDaughters to that family.
  function createImmediateFamily(person) {
    if (!person) return;

    let husbandId = null;
    let wifeId = null;

    if (person.gender === "male") {
      husbandId = person.id;
      if (spouseName.value) {
        const newWifeId = `person-${familyTreeStore.persons.length + 1}`;
        familyTreeStore.persons.push({
          id: newWifeId,
          name: spouseName.value,
          gender: "female",
        });
        familyTreeStore.nodes.push({
          data: { id: newWifeId, label: spouseName.value, gender: "female" },
        });
        wifeId = newWifeId;
      }
    } else {
      wifeId = person.id;
      if (spouseName.value) {
        const newHusbandId = `person-${familyTreeStore.persons.length + 1}`;
        familyTreeStore.persons.push({
          id: newHusbandId,
          name: spouseName.value,
          gender: "male",
        });
        familyTreeStore.nodes.push({
          data: { id: newHusbandId, label: spouseName.value, gender: "male" },
        });
        husbandId = newHusbandId;
      }
    }

    // Create a new family
    const newFamily = familyTreeStore.createFamily(husbandId, wifeId);

    // Add ephemeral kids
    newSons.value.forEach((son) => {
      familyTreeStore.addSon(newFamily.id, son.name);
    });
    newDaughters.value.forEach((daughter) => {
      familyTreeStore.addDaughter(newFamily.id, daughter.name);
    });
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

    // Create a family with fatherId=husbandId, motherId=wifeId
    const newFamily = familyTreeStore.createFamily(fatherId, motherId);

    // Link the person as "Son" or "Daughter" from that family
    if (person.gender === "male") {
      // store-level approach: we can just call addSon, but we want the same "person" object
      // We'll do a direct push
      newFamily.sons.push(person.id);
      familyTreeStore.edges.push({
        data: {
          source: newFamily.id,
          target: person.id,
          label: "Son",
        },
      });
      familyTreeStore.updateSpouseEdges(newFamily);
    } else {
      newFamily.daughters.push(person.id);
      familyTreeStore.edges.push({
        data: {
          source: newFamily.id,
          target: person.id,
          label: "Daughter",
        },
      });
      familyTreeStore.updateSpouseEdges(newFamily);
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
