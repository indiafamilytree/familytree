<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

const props = defineProps({
  familyData: { type: Object, required: false },
});
const emit = defineEmits(["close"]);

const store = useFamilyTreeStore();

const isEditing = ref(false);

// Ephemeral fields for editing
const localHusbandName = ref("");
const localWifeName = ref("");
const localSons = ref([]);
const localDaughters = ref([]);

const tempSonName = ref("");
const tempDaughterName = ref("");

watch(
  () => props.familyData,
  (val) => {
    if (val && val.id) {
      loadFamily(val.id);
    }
  },
  { immediate: true }
);

function loadFamily(familyId) {
  const fam = store.families.find((f) => f.id === familyId);
  if (!fam) return;
  console.log("Loading family data for:", fam);

  // Load husband data
  localHusbandName.value = fam.husbandId
    ? store.persons.find((p) => p.id === fam.husbandId)?.name || ""
    : "";

  // Load wife data
  localWifeName.value = fam.wifeId
    ? store.persons.find((p) => p.id === fam.wifeId)?.name || ""
    : "";

  // Load sons, excluding husband and wife
  localSons.value = fam.members
    .filter(
      (id) =>
        id !== fam.husbandId &&
        id !== fam.wifeId &&
        store.persons.find((p) => p.id === id && p.gender === "male")
    )
    .map((id) => ({
      ...store.persons.find((p) => p.id === id),
    }));
  console.log("Local sons loaded:", localSons.value);

  // Load daughters, excluding husband and wife
  localDaughters.value = fam.members
    .filter(
      (id) =>
        id !== fam.husbandId &&
        id !== fam.wifeId &&
        store.persons.find((p) => p.id === id && p.gender === "female")
    )
    .map((id) => ({
      ...store.persons.find((p) => p.id === id),
    }));
  console.log("Local daughters loaded:", localDaughters.value);
}

function addNewSon() {
  if (tempSonName.value) {
    const newSon = {
      id: `temp-son-${localSons.value.length + 1}`, // Temporary ID
      name: tempSonName.value,
      gender: "male",
    };
    localSons.value.push(newSon);
    tempSonName.value = "";
  }
}

function addNewDaughter() {
  if (tempDaughterName.value) {
    const newDaughter = {
      id: `temp-daughter-${localDaughters.value.length + 1}`, // Temporary ID
      name: tempDaughterName.value,
      gender: "female",
    };
    localDaughters.value.push(newDaughter);
    tempDaughterName.value = "";
  }
}

function removeSon(sonId) {
  localSons.value = localSons.value.filter((son) => son.id !== sonId);
}

function removeDaughter(daughterId) {
  localDaughters.value = localDaughters.value.filter(
    (daughter) => daughter.id !== daughterId
  );
}

function saveChanges() {
  if (!props.familyData) return;

  const fam = store.families.find((f) => f.id === props.familyData.id);
  if (!fam) return;

  // Update husband
  updateHusband(fam);

  // Update wife
  updateWife(fam);

  // Update or add sons
  localSons.value.forEach((son) => {
    if (son.id.startsWith("temp-")) {
      // New son
      addNewPersonToFamily(fam, son.name, "Son", "male");
    } else {
      // Existing son
      updatePersonName(son.id, son.name);
    }
  });

  // Update or add daughters
  localDaughters.value.forEach((daughter) => {
    if (daughter.id.startsWith("temp-")) {
      // New daughter
      addNewPersonToFamily(fam, daughter.name, "Daughter", "female");
    } else {
      // Existing daughter
      updatePersonName(daughter.id, daughter.name);
    }
  });

  // Remove non-existent sons and daughters from family members
  fam.members = fam.members.filter(
    (id) =>
      localSons.value.some((son) => son.id === id) ||
      localDaughters.value.some((daughter) => daughter.id === id) ||
      id === fam.husbandId ||
      id === fam.wifeId
  );

  isEditing.value = false;
  loadFamily(props.familyData.id);
}

function updateHusband(fam) {
  if (localHusbandName.value) {
    if (fam.husbandId) {
      // Update existing husband
      const h = store.persons.find((p) => p.id === fam.husbandId);
      if (h) {
        h.name = localHusbandName.value;
        updateNodeLabel(h.id, h.name);
      }
    } else {
      // Add new husband
      addNewPersonToFamily(fam, localHusbandName.value, "Husband", "male");
    }
  } else if (fam.husbandId) {
    // Remove husband if name is cleared
    fam.members = fam.members.filter((id) => id !== fam.husbandId);
    fam.husbandId = null;
  }
}

function updateWife(fam) {
  if (localWifeName.value) {
    if (fam.wifeId) {
      // Update existing wife
      const w = store.persons.find((p) => p.id === fam.wifeId);
      if (w) {
        w.name = localWifeName.value;
        updateNodeLabel(w.id, w.name);
      }
    } else {
      // Add new wife
      addNewPersonToFamily(fam, localWifeName.value, "Wife", "female");
    }
  } else if (fam.wifeId) {
    // Remove wife if name is cleared
    fam.members = fam.members.filter((id) => id !== fam.wifeId);
    fam.wifefam.wifeId = null;
  }
}

function updatePersonName(personId, newName) {
  const person = store.persons.find((p) => p.id === personId);
  if (person) {
    person.name = newName;
    updateNodeLabel(person.id, newName);
  }
}

function addNewPersonToFamily(fam, name, relation, gender) {
  const newPersonId = `person-${store.persons.length + 1}`;
  const newPerson = {
    id: newPersonId,
    name,
    gender,
  };

  store.persons.push(newPerson);
  store.nodes.push({
    data: { id: newPersonId, label: newPerson.name, gender },
  });

  // Update family relationship
  if (relation === "Husband") {
    fam.husbandId = newPersonId;
  } else if (relation === "Wife") {
    fam.wifeId = newPersonId;
  }

  // Add to family members
  if (!fam.members.includes(newPersonId)) {
    fam.members.push(newPersonId);
  }

  // Create edge
  store.edges.push({
    data: {
      source: newPersonId,
      target: fam.id,
      label: relation,
    },
  });

  // Update family node label
  updateFamilyNodeLabel(fam);
}

function updateNodeLabel(personId, newName) {
  const nodeRef = store.nodes.find((n) => n.data.id === personId);
  if (nodeRef) nodeRef.data.label = newName;
}

function updateFamilyNodeLabel(fam) {
  const familyNode = store.nodes.find((n) => n.data.id === fam.id);
  if (familyNode) {
    const husbandLabel = localHusbandName.value
      ? `${localHusbandName.value}\n`
      : "";
    const wifeLabel = localWifeName.value;
    familyNode.data.label = husbandLabel + wifeLabel;
  }
}

function cancelEdit() {
  isEditing.value = false;
  if (props.familyData) loadFamily(props.familyData.id);
}
</script>

<style scoped>
.form-container {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.form-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 600;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.form-label {
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.list {
  margin-top: 5px;
  list-style: none;
  padding: 0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
}

.list-input {
  flex-grow: 1;
  margin-right: 5px;
}

.list-text {
  margin-right: 5px;
  flex-grow: 1;
}

.button-group {
  display: flex;
  gap: 5px;
}

.form-button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap; /* Prevent text wrapping */
}

.save-button {
  background-color: #28a745;
  color: white;
}

.remove-button {
  background-color: #dc3545;
  color: white;
}

.add-button {
  background-color: #007bff;
  color: white;
}

.edit-button {
  background-color: #ffc107;
  color: white;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.add-input-group {
  display: flex;
  gap: 5px;
}

.add-input-group .form-input {
  flex-grow: 1;
}
.input-button-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.input-button-group .form-input {
  flex-grow: 1;
}

.input-button-group .form-button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  background-color: #28a745;
  color: white;
}
.form-actions {
  display: flex;
  margin-top: 10px;
  gap: 10px;
  justify-content: flex-end;
}
.form-actions button {
  width: auto; /* Let buttons take their natural width */
  flex: none; /* Prevent buttons from growing */
}
</style>
