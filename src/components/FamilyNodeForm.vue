<!-- ./components/FamilyNodeForm.vue -->
<template>
  <div class="form-container">
    <h3 class="form-title">Family Details</h3>
    <div v-if="familyData" class="form-body">
      <!-- Husband -->
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
            ✓
          </BaseButton>
        </div>
      </div>

      <!-- Wife -->
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
            ✓
          </BaseButton>
        </div>
      </div>

      <!-- Sons list -->
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
            <div class="button-group" v-if="isEditing">
              <BaseButton
                @click="saveSon(son)"
                variant="primary"
                class="save-button"
              >
                ✓
              </BaseButton>
              <!-- Remove button now shows "X" -->
              <BaseButton
                @click="removeSon(son.id)"
                variant="danger"
                class="remove-button"
              >
                X
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
            +
          </BaseButton>
        </div>
      </div>

      <!-- Daughters list -->
      <div class="form-group">
        <label class="form-label">Daughters:</label>
        <ul class="list">
          <li
            v-for="(daughter, i) in localDaughters"
            :key="daughter.id"
            class="list-item"
          >
            <input
              v-if="isEditing"
              v-model="daughter.name"
              class="form-input list-input"
            />
            <span v-else class="list-text">{{ daughter.name }}</span>
            <div class="button-group" v-if="isEditing">
              <BaseButton
                @click="saveDaughter(daughter)"
                variant="primary"
                class="save-button"
              >
                ✓
              </BaseButton>
              <BaseButton
                @click="removeDaughter(daughter.id)"
                variant="danger"
                class="remove-button"
              >
                X
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
            +
          </BaseButton>
        </div>
      </div>

      <!-- Form Actions -->
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
  // Remove from the local list
  localSons.value = localSons.value.filter((son) => son.id !== sonId);
  // Remove the person from the store
  store.persons = store.persons.filter((p) => p.id !== sonId);
  // Remove the corresponding node
  store.nodes = store.nodes.filter((n) => n.data.id !== sonId);
  // Remove any edges that reference this person
  store.edges = store.edges.filter(
    (e) => e.data.source !== sonId && e.data.target !== sonId
  );
}

function removeDaughter(daughterId) {
  localDaughters.value = localDaughters.value.filter(
    (daughter) => daughter.id !== daughterId
  );
  store.persons = store.persons.filter((p) => p.id !== daughterId);
  store.nodes = store.nodes.filter((n) => n.data.id !== daughterId);
  store.edges = store.edges.filter(
    (e) => e.data.source !== daughterId && e.data.target !== daughterId
  );
}

function saveChanges() {
  if (!props.familyData) return;
  const fam = store.families.find((f) => f.id === props.familyData.id);
  if (!fam) return;

  // Update spouse information.
  updateHusband(fam);
  updateWife(fam);

  // Process new sons: for any son with a temporary ID, create a permanent person.
  const permanentSons = localSons.value.map((son) => {
    if (son.id.startsWith("temp-")) {
      // Create a permanent person for the new son.
      addNewPersonToFamily(fam, son.name, "Son", "male");
      // Return the newly created person (assumed to be the last person added)
      return store.persons[store.persons.length - 1];
    }
    return son;
  });
  // Update localSons with permanent entries.
  localSons.value = permanentSons;
  // Update the family's sons array with the permanent IDs.
  fam.sons = localSons.value.map((son) => son.id);

  // Process new daughters similarly.
  const permanentDaughters = localDaughters.value.map((daughter) => {
    if (daughter.id.startsWith("temp-")) {
      addNewPersonToFamily(fam, daughter.name, "Daughter", "female");
      return store.persons[store.persons.length - 1];
    }
    return daughter;
  });
  localDaughters.value = permanentDaughters;
  fam.daughters = localDaughters.value.map((daughter) => daughter.id);

  // Remove extraneous child edges (if any) that no longer match the updated arrays.
  store.edges = store.edges.filter((edge) => {
    if (edge.data.source === fam.id && edge.data.label === "Son") {
      return fam.sons.includes(edge.data.target);
    }
    if (edge.data.source === fam.id && edge.data.label === "Daughter") {
      return fam.daughters.includes(edge.data.target);
    }
    return true;
  });

  updateEdgeLabels(fam);

  isEditing.value = false;
  loadFamily(props.familyData.id); // Reload the updated family details for the form.
}

function updateEdgeLabels(fam) {
  // Update husband edge
  if (fam.husbandId) {
    const husbandEdge = store.edges.find(
      (e) => e.data.source === fam.husbandId && e.data.target === fam.id
    );
    if (husbandEdge) {
      husbandEdge.data.label =
        fam.sons.length > 0 || fam.daughters.length > 0 ? "Father" : "Husband";
    }
  }
  // Update wife edge
  if (fam.wifeId) {
    const wifeEdge = store.edges.find(
      (e) => e.data.source === fam.wifeId && e.data.target === fam.id
    );
    if (wifeEdge) {
      wifeEdge.data.label =
        fam.sons.length > 0 || fam.daughters.length > 0 ? "Mother" : "Wife";
    }
  }
  // Update child edges for sons
  if (Array.isArray(fam.sons)) {
    fam.sons.forEach((childId) => {
      const sonEdge = store.edges.find(
        (e) => e.data.source === fam.id && e.data.target === childId
      );
      if (sonEdge) {
        sonEdge.data.label = "Son";
      }
    });
  }
  // Update child edges for daughters
  if (Array.isArray(fam.daughters)) {
    fam.daughters.forEach((childId) => {
      const daughterEdge = store.edges.find(
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

// Save functions for Son and Daughter.
function saveSon(son) {
  const s = store.persons.find((p) => p.id === son.id);
  if (s) {
    s.name = son.name;
    updateNodeLabel(s.id, s.name);
    console.log("Son updated:", s);
  }
}

function saveDaughter(daughter) {
  const d = store.persons.find((p) => p.id === daughter.id);
  if (d) {
    d.name = daughter.name;
    updateNodeLabel(d.id, d.name);
    console.log("Daughter updated:", d);
  }
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

  const isChild = relation === "Son" || relation === "Daughter";
  const edgeData = isChild
    ? { source: fam.id, target: newPersonId, label: relation }
    : { source: newPersonId, target: fam.id, label: relation };

  store.edges.push({ data: edgeData });
  updateFamilyNodeLabel(fam);
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
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
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
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
}
.list-input {
  flex-grow: 1;
  margin-right: 10px;
  font-size: 1rem;
}
.list-text {
  margin-right: 10px;
  flex-grow: 1;
  font-size: 1rem;
}
.button-group {
  display: flex;
  gap: 5px;
  align-items: center;
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
  font-size: 1.2rem;
  padding: 6px 8px;
}
.remove-button {
  background-color: #dc3545;
  color: white;
  font-size: 1.2rem;
  padding: 6px 8px;
}
.add-button {
  background-color: #007bff;
  color: white;
  padding: 6px 8px;
  font-size: 1.2rem;
}
.edit-button {
  background-color: #ffc107;
  color: white;
  padding: 6px 8px;
}
.cancel-button {
  background-color: #6c757d;
  color: white;
  padding: 6px 8px;
}
.add-input-group {
  display: flex;
  gap: 5px;
  align-items: center;
}
.input-button-group {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
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
