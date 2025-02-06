<!-- ./components/FamilyNodeForm.vue -->
<template>
  <div class="form-container">
    <h3 class="form-title">Family Details</h3>
    <div v-if="familyData" class="form-body">
      <div class="form-group">
        <label class="form-label">Husband:</label>
        <div class="input-button-group">
          <input
            v-model="localHusbandName"
            :disabled="!isEditing"
            class="form-input"
          />
          <BaseButton
            v-if="isEditing"
            @click="saveHusband"
            variant="primary"
            class="save-button"
          >
            Save
          </BaseButton>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Wife:</label>
        <div class="input-button-group">
          <input
            v-model="localWifeName"
            :disabled="!isEditing"
            class="form-input"
          />
          <BaseButton
            v-if="isEditing"
            @click="saveWife"
            variant="primary"
            class="save-button"
          >
            Save
          </BaseButton>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Sons:</label>
        <ul class="list">
          <li v-for="son in localSons" :key="son.id" class="list-item">
            <input
              v-if="isEditing"
              v-model="son.name"
              class="form-input list-input"
            />
            <span v-else class="list-text">{{ son.name }}</span>
            <div class="button-group">
              <BaseButton
                v-if="isEditing"
                @click="saveSon(son)"
                variant="primary"
                class="save-button"
              >
                Save
              </BaseButton>
              <BaseButton
                @click="removeSon(son.id)"
                variant="danger"
                class="remove-button"
              >
                Remove
              </BaseButton>
            </div>
          </li>
        </ul>
        <div v-if="isEditing" class="add-input-group">
          <input
            type="text"
            v-model="tempSonName"
            placeholder="New Son"
            class="form-input"
          />
          <BaseButton @click="addNewSon" variant="primary" class="add-button">
            Add
          </BaseButton>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Daughters:</label>
        <ul class="list">
          <li
            v-for="daughter in localDaughters"
            :key="daughter.id"
            class="list-item"
          >
            <input
              v-if="isEditing"
              v-model="daughter.name"
              class="form-input list-input"
            />
            <span v-else class="list-text">{{ daughter.name }}</span>
            <div class="button-group">
              <BaseButton
                v-if="isEditing"
                @click="removeDaughter(daughter.id)"
                variant="danger"
                class="remove-button"
              >
                Remove
              </BaseButton>
            </div>
          </li>
        </ul>
        <div v-if="isEditing" class="add-input-group">
          <input
            type="text"
            v-model="tempDaughterName"
            placeholder="New Daughter"
            class="form-input"
          />
          <BaseButton
            @click="addNewDaughter"
            variant="primary"
            class="add-button"
          >
            Add
          </BaseButton>
        </div>
      </div>

      <div class="form-actions">
        <BaseButton
          v-if="!isEditing"
          @click="isEditing = true"
          variant="secondary"
          class="edit-button"
        >
          Edit
        </BaseButton>
        <BaseButton
          v-if="isEditing"
          @click="saveChanges"
          variant="primary"
          class="save-button"
        >
          Save
        </BaseButton>
        <BaseButton
          v-if="isEditing"
          @click="cancelEdit"
          variant="danger"
          class="cancel-button"
        >
          Cancel
        </BaseButton>
      </div>
    </div>
    <div v-else>
      <p>No family selected.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

const props = defineProps({
  familyData: { type: Object, required: false },
});
const emit = defineEmits(["close"]);

const store = useFamilyTreeStore();

const isEditing = ref(false);
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
  console.log(fam);
  // Load husband and wife names using their IDs
  localHusbandName.value = fam.husbandId
    ? store.persons.find((p) => p.id === fam.husbandId)?.name || ""
    : "";
  localWifeName.value = fam.wifeId
    ? store.persons.find((p) => p.id === fam.wifeId)?.name || ""
    : "";

  // For children, look up each ID in the sons/daughters arrays.
  localSons.value = fam.sons
    .map((id) => store.persons.find((p) => p.id === id))
    .filter(Boolean);

  localDaughters.value = fam.daughters
    .map((id) => store.persons.find((p) => p.id === id))
    .filter(Boolean);
}

function addNewSon() {
  if (tempSonName.value) {
    const newSon = {
      id: `temp-son-${localSons.value.length + 1}`,
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
      id: `temp-daughter-${localDaughters.value.length + 1}`,
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

  // Update spouse information
  updateHusband(fam); // should update fam.husbandId and the corresponding person record
  updateWife(fam); // should update fam.wifeId and the corresponding person record

  // Update sons and daughters arrays explicitly from your local form state.
  // Assuming localSons and localDaughters are arrays of person objects.
  fam.sons = localSons.value.map((son) => son.id);
  fam.daughters = localDaughters.value.map((daughter) => daughter.id);

  // If you still have any edge updates (or if you rebuild the chart), do them here.
  updateEdgeLabels(fam);

  isEditing.value = false;
  loadFamily(props.familyData.id); // reload the updated family details for the form
}

function updateEdgeLabels(fam) {
  // Update the spouse edges.
  // For the husband edge, assume the edge was created with:
  //   { source: fam.husbandId, target: fam.id, label: "Husband" }
  if (fam.husbandId) {
    const husbandEdge = this.edges.find(
      (e) => e.data.source === fam.husbandId && e.data.target === fam.id
    );
    if (husbandEdge) {
      // If there are children, change the label to "Father"
      if (
        (fam.sons && fam.sons.length > 0) ||
        (fam.daughters && fam.daughters.length > 0)
      ) {
        husbandEdge.data.label = "Father";
      } else {
        husbandEdge.data.label = "Husband";
      }
    }
  }

  // For the wife edge, assume the edge was created with:
  //   { source: fam.wifeId, target: fam.id, label: "Wife" }
  if (fam.wifeId) {
    const wifeEdge = this.edges.find(
      (e) => e.data.source === fam.wifeId && e.data.target === fam.id
    );
    if (wifeEdge) {
      if (
        (fam.sons && fam.sons.length > 0) ||
        (fam.daughters && fam.daughters.length > 0)
      ) {
        wifeEdge.data.label = "Mother";
      } else {
        wifeEdge.data.label = "Wife";
      }
    }
  }

  // Update the child edges.
  // For sons, assume the edge was created with:
  //   { source: fam.id, target: childId, label: "Son" }
  if (Array.isArray(fam.sons)) {
    fam.sons.forEach((childId) => {
      const sonEdge = this.edges.find(
        (e) => e.data.source === fam.id && e.data.target === childId
      );
      if (sonEdge) {
        sonEdge.data.label = "Son";
      }
    });
  }

  // For daughters, assume the edge was created with:
  //   { source: fam.id, target: childId, label: "Daughter" }
  if (Array.isArray(fam.daughters)) {
    fam.daughters.forEach((childId) => {
      const daughterEdge = this.edges.find(
        (e) => e.data.source === fam.id && e.data.target === childId
      );
      if (daughterEdge) {
        daughterEdge.data.label = "Daughter";
      }
    });
  }
}

function updateHusband(fam) {
  if (localHusbandName.value) {
    if (fam.husbandId) {
      const h = store.persons.find((p) => p.id === fam.husbandId);
      if (h) {
        h.name = localHusbandName.value;
        updateNodeLabel(h.id, h.name);
      }
    } else {
      addNewPersonToFamily(fam, localHusbandName.value, "Husband", "male");
    }
  } else if (fam.husbandId) {
    // Remove the husband by simply clearing the husbandId
    fam.husbandId = null;
  }
}

function updateWife(fam) {
  if (localWifeName.value) {
    if (fam.wifeId) {
      const w = store.persons.find((p) => p.id === fam.wifeId);
      if (w) {
        w.name = localWifeName.value;
        updateNodeLabel(w.id, w.name);
      }
    } else {
      addNewPersonToFamily(fam, localWifeName.value, "Wife", "female");
    }
  } else if (fam.wifeId) {
    // Simply clear the wifeId if no wife name is provided
    fam.wifeId = null;
  }
}

function saveHusband() {
  if (props.familyData && props.familyData.husbandId) {
    const husband = store.persons.find(
      (p) => p.id === props.familyData.husbandId
    );
    if (husband) {
      husband.name = localHusbandName.value;
      // Optionally update any graph node labels here.
      console.log("Husband updated:", husband);
    }
    isEditing.value = false;
  }
}

function saveWife() {
  if (props.familyData && props.familyData.wifeId) {
    const wife = store.persons.find((p) => p.id === props.familyData.wifeId);
    if (wife) {
      wife.name = localWifeName.value;
      console.log("Wife updated:", wife);
    }
    isEditing.value = false;
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

  if (relation === "Husband") {
    fam.husbandId = newPersonId;
  } else if (relation === "Wife") {
    fam.wifeId = newPersonId;
  } else if (relation === "Son") {
    if (!fam.sons) {
      fam.sons = [];
    }
    fam.sons.push(newPersonId);
  } else if (relation === "Daughter") {
    if (!fam.daughters) {
      fam.daughters = [];
    }
    fam.daughters.push(newPersonId);
  }

  // Determine edge direction:
  // For children, the edge is from the family node to the child.
  // For spouse relationships, the edge is from the new person to the family node.
  const isChild = relation === "Son" || relation === "Daughter";
  const edgeData = isChild
    ? { source: fam.id, target: newPersonId, label: relation }
    : { source: newPersonId, target: fam.id, label: relation };

  store.edges.push({ data: edgeData });
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
  font-family: sans-serif;
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
  white-space: nowrap;
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
.input-button-group {
  display: flex;
  align-items: center;
  gap: 5px;
}
.input-button-group .form-input {
  flex-grow: 1;
}
.form-actions {
  display: flex;
  margin-top: 10px;
  gap: 10px;
  justify-content: flex-end;
}
.form-actions button {
  width: auto;
  flex: none;
}
</style>
