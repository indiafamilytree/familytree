<template>
  <div class="person-node-form">
    <div class="initial-buttons">
      <button @click="showImmediateFamilyForm = true">Immediate</button>
      <button @click="showAncestralFamilyForm = true">Ancestral</button>
    </div>

    <div v-if="showImmediateFamilyForm" class="form-section">
      <h4>Add Immediate Family</h4>
      <div class="form-group">
        <label>Spouse Name:</label>
        <input type="text" v-model="spouseName" />
      </div>

      <div class="form-group">
        <label>New Son:</label>
        <div class="input-group">
          <input v-model="tempSonName" type="text" />
          <button @click="addSonLocally">+</button>
        </div>
        <ul>
          <li v-for="(son, i) in newSons" :key="i" class="list-item">
            <span>{{ son.name }}</span>
            <button @click="removeSonLocally(i)">Remove</button>
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label>New Daughter:</label>
        <div class="input-group">
          <input v-model="tempDaughterName" type="text" />
          <button @click="addDaughterLocally">+</button>
        </div>
        <ul>
          <li v-for="(daughter, i) in newDaughters" :key="i" class="list-item">
            <span>{{ daughter.name }}</span>
            <button @click="removeDaughterLocally(i)">Remove</button>
          </li>
        </ul>
      </div>

      <div class="button-group">
        <button @click="confirmImmediateFamily">Create Family</button>
        <button @click="cancel" class="form-button-cancel">Cancel</button>
      </div>
    </div>

    <div v-if="showAncestralFamilyForm" class="form-section">
      <h4>Add Ancestral Family</h4>
      <div class="form-group">
        <label>Father Name:</label>
        <input type="text" v-model="fatherName" />
      </div>
      <div class="form-group">
        <label>Mother Name:</label>
        <input type="text" v-model="motherName" />
      </div>

      <div class="button-group">
        <button @click="confirmAncestralFamily">Create Ancestral Family</button>
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
/* PersonNodeForm.vue styles */

.person-node-form {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  font-family: sans-serif;
}

h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.form-section {
  /* Added for spacing between form sections */
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

label {
  margin-bottom: 5px;
  font-weight: 500;
}

input[type="text"] {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.input-group button {
  /* Style the "+" button */
  background-color: #42b983; /* Green */
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 5px 0;
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

.list-item span {
  flex-grow: 1;
  margin-right: 5px;
}

.list-item button {
  padding: 4px 8px;
  font-size: 0.85rem;
}

button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
}

.initial-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.initial-buttons button {
  background-color: #42b983; /* Green */
  color: white;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.button-group button, /* Style for all buttons in button groups */
.showImmediateFamilyForm button, /* Style for immediate family buttons */
.showAncestralFamilyForm button  /* Style for Ancestral family buttons */ {
  background-color: #007bff; /* Blue */
  color: white;
}

.form-button-cancel {
  /* Cancel button style */
  background-color: #dc3545; /* Red */
  color: white;
}

.list-item button {
  /* Style for remove buttons within lists */
  background-color: #dc3545; /* Red */
  color: white;
}
</style>
