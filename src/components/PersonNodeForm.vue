<template>
  <div class="person-node-form">
    <div
      v-if="!showImmediateFamilyForm && !showAncestralFamilyForm"
      class="button-group"
    >
      <button @click="showImmediateFamilyForm = true" class="form-button">
        Create Immediate Family
      </button>
      <button @click="showAncestralFamilyForm = true" class="form-button">
        Add Parents (Ancestral Family)
      </button>
    </div>

    <div v-if="showImmediateFamilyForm" class="form-section">
      <h4 class="section-title">Add Immediate Family</h4>
      <div class="form-group">
        <label class="form-label">Spouse Name:</label>
        <input type="text" v-model="spouseName" class="form-input" />
      </div>

      <div class="form-group">
        <label class="form-label">New Son:</label>
        <div class="input-group">
          <input v-model="tempSonName" type="text" class="form-input" />
          <button @click="addSonLocally" class="form-button">+</button>
        </div>
        <ul class="list">
          <li v-for="(son, i) in newSons" :key="i" class="list-item">
            <span>{{ son.name }}</span>
            <button @click="removeSonLocally(i)" class="form-button-remove">
              Remove
            </button>
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label class="form-label">New Daughter:</label>
        <div class="input-group">
          <input v-model="tempDaughterName" type="text" class="form-input" />
          <button @click="addDaughterLocally" class="form-button">+</button>
        </div>
        <ul class="list">
          <li v-for="(daughter, i) in newDaughters" :key="i" class="list-item">
            <span>{{ daughter.name }}</span>
            <button
              @click="removeDaughterLocally(i)"
              class="form-button-remove"
            >
              Remove
            </button>
          </li>
        </ul>
      </div>

      <div class="button-group">
        <button @click="confirmImmediateFamily" class="form-button">
          Create Immediate Family
        </button>
        <button @click="cancel" class="form-button-cancel">Cancel</button>
      </div>
    </div>

    <div v-if="showAncestralFamilyForm" class="form-section">
      <h4 class="section-title">Add Ancestral Family</h4>
      <div class="form-group">
        <label class="form-label">Father Name:</label>
        <input type="text" v-model="fatherName" class="form-input" />
      </div>
      <div class="form-group">
        <label class="form-label">Mother Name:</label>
        <input type="text" v-model="motherName" class="form-input" />
      </div>

      <div class="button-group">
        <button @click="confirmAncestralFamily" class="form-button">
          Create Ancestral Family
        </button>
        <button @click="cancel" class="form-button-cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";
import { useFamilyForm } from "@/composables/useFamilyForm";

const props = defineProps({
  personData: { type: Object, required: true },
});
const emit = defineEmits(["update:personData", "close"]);

const showImmediateFamilyForm = ref(false);
const showAncestralFamilyForm = ref(false);

const {
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
} = useFamilyForm();

function confirmImmediateFamily() {
  createImmediateFamily(props.personData);
  emit("update:personData", { ...props.personData });
  emit("close");
  showImmediateFamilyForm.value = false;
  resetForm();
}

function confirmAncestralFamily() {
  createAncestralFamily(props.personData);
  emit("update:personData", { ...props.personData });
  emit("close");
  showAncestralFamilyForm.value = false;
  resetForm();
}

function cancel() {
  showImmediateFamilyForm.value = false;
  showAncestralFamilyForm.value = false;
  resetForm();
  emit("close");
}
</script>

<style scoped>
.person-node-form {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f8f8f8;
}

.form-section {
  margin-bottom: 20px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.form-button,
.form-button-remove,
.form-button-cancel {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.form-button {
  background-color: #4285f4;
  color: white;
}

.form-button-remove {
  background-color: #dc3545;
  color: white;
}

.form-button-cancel {
  background-color: #6c757d;
  color: white;
}

.list {
  margin-top: 10px;
  list-style: none;
  padding: 0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
