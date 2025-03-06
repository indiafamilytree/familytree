<template>
  <div class="form-container">
    <h3 class="form-title">Family Details</h3>
    <div v-if="familyData" class="form-body">
      <!-- Parent Section -->
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
            >✓</BaseButton
          >
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
            >✓</BaseButton
          >
        </div>
      </div>

      <!-- Children Section -->
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
                @click="saveChild(son)"
                variant="primary"
                class="save-button"
                >✓</BaseButton
              >
              <BaseButton
                @click="removeChild(son.id, 'male')"
                variant="danger"
                class="remove-button"
                >X</BaseButton
              >
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
          <BaseButton
            @click="addNewChild('male')"
            variant="primary"
            class="add-button"
            >+</BaseButton
          >
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
            <div class="button-group" v-if="isEditing">
              <BaseButton
                @click="saveChild(daughter)"
                variant="primary"
                class="save-button"
                >✓</BaseButton
              >
              <BaseButton
                @click="removeChild(daughter.id, 'female')"
                variant="danger"
                class="remove-button"
                >X</BaseButton
              >
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
            @click="addNewChild('female')"
            variant="primary"
            class="add-button"
            >+</BaseButton
          >
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <BaseButton
          v-if="!isEditing"
          @click="isEditing = true"
          variant="secondary"
          class="edit-button"
          >Edit</BaseButton
        >
        <BaseButton
          v-if="isEditing"
          @click="saveChanges"
          variant="primary"
          class="save-button"
          >Save</BaseButton
        >
        <BaseButton
          v-if="isEditing"
          @click="cancelEdit"
          variant="danger"
          class="cancel-button"
          >Cancel</BaseButton
        >
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

// Load family data when familyData prop changes.
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
  let members = [];
  if (typeof fam.members === "string") {
    try {
      members = JSON.parse(fam.members);
    } catch (e) {
      console.error("Error parsing family members:", e);
    }
  } else {
    members = fam.members || [];
  }
  const parentMembers = members.filter((m) => m.relationship === "parent");
  const childMembers = members.filter((m) => m.relationship === "child");

  const parents = parentMembers
    .map((m) => store.persons.find((p) => p.id === m.personId))
    .filter(Boolean);
  localHusbandName.value = parents.find((p) => p.gender === "male")?.name || "";
  localWifeName.value = parents.find((p) => p.gender === "female")?.name || "";

  const children = childMembers
    .map((m) => store.persons.find((p) => p.id === m.personId))
    .filter(Boolean);
  localSons.value = children.filter((p) => p.gender === "male");
  localDaughters.value = children.filter((p) => p.gender === "female");
}

function addNewChild(gender) {
  if (gender === "male" && tempSonName.value) {
    const tempChild = {
      id: `temp-${Date.now()}`,
      name: tempSonName.value,
      gender,
    };
    localSons.value.push(tempChild);
    tempSonName.value = "";
  } else if (gender === "female" && tempDaughterName.value) {
    const tempChild = {
      id: `temp-${Date.now()}`,
      name: tempDaughterName.value,
      gender,
    };
    localDaughters.value.push(tempChild);
    tempDaughterName.value = "";
  }
}

function removeChild(childId, gender) {
  if (gender === "male") {
    localSons.value = localSons.value.filter((child) => child.id !== childId);
  } else {
    localDaughters.value = localDaughters.value.filter(
      (child) => child.id !== childId
    );
  }
}

async function saveChild(child) {
  const person = store.persons.find((p) => p.id === child.id);
  if (person) {
    person.name = child.name;
    const node = store.nodes.find((n) => n.data.id === person.id);
    if (node) node.data.label = child.name;
  }
}

async function saveChanges() {
  if (!props.familyData) return;
  const fam = store.families.find((f) => f.id === props.familyData.id);
  if (!fam) return;

  // Update parents.
  let husband = store.persons.find(
    (p) => p.gender === "male" && p.name === localHusbandName.value
  );
  if (!husband && localHusbandName.value) {
    const newId = store.getNewPersonId();
    husband = { id: newId, name: localHusbandName.value, gender: "male" };
    store.persons.push(husband);
    store.nodes.push({
      data: { id: newId, label: husband.name, gender: husband.gender },
    });
    fam.members.push({ personId: newId, relationship: "parent" });
    store.edges.push({
      data: { source: newId, target: fam.id, label: "Father" },
    });
  } else if (husband) {
    husband.name = localHusbandName.value;
  }

  let wife = store.persons.find(
    (p) => p.gender === "female" && p.name === localWifeName.value
  );
  if (!wife && localWifeName.value) {
    const newId = store.getNewPersonId();
    wife = { id: newId, name: localWifeName.value, gender: "female" };
    store.persons.push(wife);
    store.nodes.push({
      data: { id: newId, label: wife.name, gender: wife.gender },
    });
    fam.members.push({ personId: newId, relationship: "parent" });
    store.edges.push({
      data: { source: newId, target: fam.id, label: "Mother" },
    });
  } else if (wife) {
    wife.name = localWifeName.value;
  }

  // Process new children from localSons.
  for (const child of localSons.value) {
    if (child.id.startsWith("temp-")) {
      const newId = store.getNewPersonId();
      const newChild = { id: newId, name: child.name, gender: child.gender };
      store.persons.push(newChild);
      store.nodes.push({
        data: { id: newId, label: newChild.name, gender: newChild.gender },
      });
      fam.members.push({ personId: newId, relationship: "child" });
      store.edges.push({
        data: { source: fam.id, target: newId, label: "Son" },
      });
      child.id = newId;
    } else {
    }
  }

  // Process new children from localDaughters.
  for (const child of localDaughters.value) {
    if (child.id.startsWith("temp-")) {
      const newId = store.getNewPersonId();
      const newChild = { id: newId, name: child.name, gender: child.gender };
      store.persons.push(newChild);
      store.nodes.push({
        data: { id: newId, label: newChild.name, gender: newChild.gender },
      });
      fam.members.push({ personId: newId, relationship: "child" });
      store.edges.push({
        data: { source: fam.id, target: newId, label: "Daughter" },
      });
      child.id = newId;
    } else {
    }
  }

  isEditing.value = false;
  loadFamily(props.familyData.id);
}

function cancelEdit() {
  isEditing.value = false;
  if (props.familyData) loadFamily(props.familyData.id);
  emit("close");
}

function saveHusband() {
  isEditing.value = false;
}
function saveWife() {
  isEditing.value = false;
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
.form-actions {
  display: flex;
  margin-top: 10px;
  gap: 10px;
  justify-content: flex-end;
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
.add-input-group {
  display: flex;
  gap: 5px;
  align-items: center;
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
</style>
