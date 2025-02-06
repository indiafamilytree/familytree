<!-- ./components/PersonNodeForm.vue -->
<template>
  <div class="person-node-form">
    <!-- Family Option at the Top -->
    <div class="options-top">
      <label class="options-label">Family Option:</label>
      <select
        v-model="selectedFamilyOption"
        @change="handleOptionSelection"
        class="option-select"
      >
        <option disabled value="">-- Select an Option --</option>
        <option value="immediate">Immediate</option>
        <option value="ancestral">Ancestral</option>
        <option value="existing">Family with Existing Node</option>
      </select>
    </div>

    <!-- When awaiting second person selection -->
    <div v-if="awaitSecondPerson" class="form-section">
      <h4>Family with Existing Node</h4>
      <p>Please select a second person from the chart.</p>
      <div class="button-group">
        <BaseButton
          @click="cancelExistingFamily"
          variant="danger"
          class="cancel-button"
        >
          Cancel
        </BaseButton>
      </div>
    </div>

    <!-- Immediate Family Form -->
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
          <BaseButton
            @click="addSonLocally"
            variant="primary"
            class="add-button"
            >+</BaseButton
          >
        </div>
        <ul>
          <li v-for="(son, i) in newSons" :key="i" class="list-item">
            <span>{{ son.name }}</span>
            <BaseButton
              @click="removeSonLocally(i)"
              variant="danger"
              class="remove-button"
              >X</BaseButton
            >
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label>New Daughter:</label>
        <div class="input-group">
          <input v-model="tempDaughterName" type="text" />
          <BaseButton
            @click="addDaughterLocally"
            variant="primary"
            class="add-button"
            >+</BaseButton
          >
        </div>
        <ul>
          <li v-for="(daughter, i) in newDaughters" :key="i" class="list-item">
            <span>{{ daughter.name }}</span>
            <BaseButton
              @click="removeDaughterLocally(i)"
              variant="danger"
              class="remove-button"
              >X</BaseButton
            >
          </li>
        </ul>
      </div>

      <div class="button-group">
        <BaseButton @click="confirmImmediateFamily" variant="primary"
          >Create Family</BaseButton
        >
        <BaseButton @click="cancel" variant="danger">Cancel</BaseButton>
      </div>
    </div>

    <!-- Ancestral Family Form -->
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
        <BaseButton @click="confirmAncestralFamily" variant="primary"
          >Create Ancestral Family</BaseButton
        >
        <BaseButton @click="cancel" variant="danger">Cancel</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";
import { useFamilyForm } from "@/composables/useFamilyForm";
import BaseButton from "@/components/BaseButton.vue";

const props = defineProps({
  personData: { type: Object, required: true },
});
const emit = defineEmits(["update:personData", "close", "await-second-person"]);

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

// New state for the dropdown and for awaiting second person selection
const selectedFamilyOption = ref("");
const awaitSecondPerson = ref(false);
const showImmediateFamilyForm = ref(false);
const showAncestralFamilyForm = ref(false);

function handleOptionSelection() {
  if (selectedFamilyOption.value === "immediate") {
    showImmediateFamilyForm.value = true;
    showAncestralFamilyForm.value = false;
    awaitSecondPerson.value = false;
  } else if (selectedFamilyOption.value === "ancestral") {
    showAncestralFamilyForm.value = true;
    showImmediateFamilyForm.value = false;
    awaitSecondPerson.value = false;
  } else if (selectedFamilyOption.value === "existing") {
    awaitSecondPerson.value = true;
    // Notify the parent or chart that we're awaiting a second person selection.
    emit("await-second-person", true);
    // Hide the dropdown while waiting.
    showImmediateFamilyForm.value = false;
    showAncestralFamilyForm.value = false;
  }
}

function cancelExistingFamily() {
  awaitSecondPerson.value = false;
  emit("await-second-person", false);
  // Reset dropdown selection to prompt again.
  selectedFamilyOption.value = "";
}

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
  selectedFamilyOption.value = "";
  resetForm();
  emit("close");
}
</script>

<style scoped>
.person-node-form {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  font-family: sans-serif;
}

/* Dropdown styling */
.options-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
}
.options-label {
  font-weight: 600;
  margin-bottom: 5px;
}
.option-select {
  padding: 5px;
  font-size: 1rem;
  width: 100%;
  max-width: 250px;
}

/* Form section styling */
.form-section {
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
.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
