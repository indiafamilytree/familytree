// ./src/composables/useFamilyForm.js
import { ref } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import { useArrayManipulation } from "@/utils/arrayUtils";

export function useFamilyForm() {
  const familyTreeStore = useFamilyTreeStore();

  // Local ephemeral form data
  const spouseName = ref("");
  const fatherName = ref("");
  const motherName = ref("");
  const newSons = ref([]);
  const newDaughters = ref([]);

  // Array manipulation utility
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

  // -------------------------------
  // Immediate Family Creation
  // -------------------------------
  // This function creates a family record using the given person as a parent.
  // It creates the spouse (if provided) and then creates children directly.
  async function createImmediateFamily(person) {
    if (!person) return;

    // Generate a new family ID and create a family record locally.
    const familyId = familyTreeStore.getNewFamilyId();
    const familyRecord = {
      id: familyId,
      husbandId: null,
      wifeId: null,
      sons: [],
      daughters: [],
      members: [], // initialize as an empty array
    };
    familyTreeStore.families.push(familyRecord);
    familyTreeStore.nodes.push({
      data: { id: familyId, label: "Family", isFamily: true },
    });

    // Link the given person to the family.
    const role = person.gender === "male" ? "Husband" : "Wife";
    if (
      !familyTreeStore.edges.some(
        (e) => e.data.source === person.id && e.data.target === familyId
      )
    ) {
      familyTreeStore.edges.push({
        data: { source: person.id, target: familyId, label: role },
      });
    }

    // (2) If a spouse name is provided, create and persist the spouse.
    let spouseId = null;
    if (spouseName.value) {
      spouseId = familyTreeStore.getNewPersonId();
      const spouseGender = person.gender === "male" ? "female" : "male";
      const spouseRelation = person.gender === "male" ? "Wife" : "Husband";

      const spouseObj = {
        id: spouseId,
        name: spouseName.value,
        gender: spouseGender,
        familyLinks: [],
      };
      familyTreeStore.persons.push(spouseObj);
      familyTreeStore.nodes.push({
        data: { id: spouseId, label: spouseName.value, gender: spouseGender },
      });
      familyTreeStore.edges.push({
        data: { source: spouseId, target: familyId, label: spouseRelation },
      });
    }

    // (3) Update family parent's IDs and add them to members.
    if (person.gender === "male") {
      familyRecord.husbandId = person.id;
      familyRecord.members.push({
        personId: person.id,
        relationship: "parent",
      });
      if (spouseId) {
        familyRecord.wifeId = spouseId;
        familyRecord.members.push({
          personId: spouseId,
          relationship: "parent",
        });
      }
    } else {
      familyRecord.wifeId = person.id;
      familyRecord.members.push({
        personId: person.id,
        relationship: "parent",
      });
      if (spouseId) {
        familyRecord.husbandId = spouseId;
        familyRecord.members.push({
          personId: spouseId,
          relationship: "parent",
        });
      }
    }

    // (4) Create children directly.
    // For each son in newSons, create a child record.
    for (const son of newSons.value) {
      const childId = familyTreeStore.getNewPersonId();
      const child = { id: childId, name: son.name, gender: son.gender };
      familyTreeStore.persons.push(child);
      familyTreeStore.nodes.push({
        data: { id: childId, label: child.name, gender: child.gender },
      });

      familyRecord.sons.push(childId);
      familyRecord.members.push({ personId: childId, relationship: "child" });
      familyTreeStore.edges.push({
        data: {
          source: familyId,
          target: childId,
          label: "Son",
        },
      });
    }
    // For each daughter in newDaughters, create a child record.
    for (const daughter of newDaughters.value) {
      const childId = familyTreeStore.getNewPersonId();
      const child = {
        id: childId,
        name: daughter.name,
        gender: daughter.gender,
      };
      familyTreeStore.persons.push(child);
      familyTreeStore.nodes.push({
        data: { id: childId, label: child.name, gender: child.gender },
      });
      familyRecord.daughters.push(childId);
      familyRecord.members.push({ personId: childId, relationship: "child" });
      familyTreeStore.edges.push({
        data: {
          source: familyId,
          target: childId,
          label: "Daughter",
        },
      });
    }

    // (5) If children exist, update edge labels from "Husband"/"Wife" to "Father"/"Mother".
    if (newSons.value.length > 0 || newDaughters.value.length > 0) {
      if (familyRecord.husbandId) {
        const husbandEdge = familyTreeStore.edges.find(
          (e) =>
            e.data.source === familyRecord.husbandId &&
            e.data.target === familyId &&
            e.data.label === "Husband"
        );
        if (husbandEdge) {
          husbandEdge.data.label = "Father";
        }
      }
      if (familyRecord.wifeId) {
        const wifeEdge = familyTreeStore.edges.find(
          (e) =>
            e.data.source === familyRecord.wifeId &&
            e.data.target === familyId &&
            e.data.label === "Wife"
        );
        if (wifeEdge) {
          wifeEdge.data.label = "Mother";
        }
      }
    }
  }

  // -------------------------------
  // Ancestral Family Creation
  // -------------------------------
  // Creates a family using provided father and mother names and the given person as a child.
  async function createAncestralFamily(person) {
    if (!person) return;

    console.log("Creating ancestral family:", {
      fatherName: fatherName.value,
      motherName: motherName.value,
    });

    let fatherId = null;
    let motherId = null;

    if (fatherName.value && fatherName.value.trim() !== "") {
      fatherId = familyTreeStore.getNewPersonId();
      const fatherObj = {
        id: fatherId,
        name: fatherName.value,
        gender: "male",
        familyLinks: [],
      };
      familyTreeStore.persons.push(fatherObj);
      familyTreeStore.nodes.push({
        data: { id: fatherId, label: fatherName.value, gender: "male" },
      });
    }

    console.log("processing motherName:", motherName.value);

    if (motherName.value && motherName.value.trim() !== "") {
      console.log("Entering mother branch, motherName:", motherName.value);
      motherId = familyTreeStore.getNewPersonId();
      const motherObj = {
        id: motherId,
        name: motherName.value,
        gender: "female",
        familyLinks: [],
      };
      familyTreeStore.persons.push(motherObj);
      familyTreeStore.nodes.push({
        data: { id: motherId, label: motherName.value, gender: "female" },
      });
    }

    // Create the family record.
    const newFamilyId = familyTreeStore.getNewFamilyId();
    const newFamily = {
      id: newFamilyId,
      husbandId: fatherId,
      wifeId: motherId,
      sons: [],
      daughters: [],
      members: [],
    };
    familyTreeStore.families.push(newFamily);
    familyTreeStore.nodes.push({
      data: { id: newFamilyId, label: "Family", isFamily: true },
    });

    if (fatherId) {
      newFamily.members.push({ personId: fatherId, relationship: "parent" });
    }
    if (motherId) {
      newFamily.members.push({ personId: motherId, relationship: "parent" });
    }

    if (person.gender === "male") {
      newFamily.sons.push(person.id);
    } else {
      newFamily.daughters.push(person.id);
    }
    newFamily.members.push({ personId: person.id, relationship: "child" });

    familyTreeStore.edges.push({
      data: {
        source: newFamilyId,
        target: person.id,
        label: person.gender === "male" ? "Son" : "Daughter",
      },
    });
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

    const familyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === newFamilyId
    );
    if (familyNode) {
      familyNode.data.label =
        (fatherName.value ? fatherName.value : "") +
        (motherName.value ? `\n${motherName.value}` : "");
    }
  }

  // -------------------------------
  // Reset Function
  // -------------------------------
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
