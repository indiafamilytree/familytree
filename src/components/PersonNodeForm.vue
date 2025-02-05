<!-- ./components/PersonNodeForm.vue -->
<template>
  <div class="person-node-form">
    <div class="initial-buttons">
      <BaseButton @click="showImmediateFamilyForm = true" variant="primary">
        Immediate
      </BaseButton>
      <BaseButton @click="showAncestralFamilyForm = true" variant="primary">
        Ancestral
      </BaseButton>
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
          <BaseButton @click="addSonLocally" variant="primary">+</BaseButton>
        </div>
        <ul>
          <li v-for="(son, i) in newSons" :key="i" class="list-item">
            <span>{{ son.name }}</span>
            <BaseButton @click="removeSonLocally(i)" variant="danger">
              Remove
            </BaseButton>
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label>New Daughter:</label>
        <div class="input-group">
          <input v-model="tempDaughterName" type="text" />
          <BaseButton @click="addDaughterLocally" variant="primary"
            >+</BaseButton
          >
        </div>
        <ul>
          <li v-for="(daughter, i) in newDaughters" :key="i" class="list-item">
            <span>{{ daughter.name }}</span>
            <BaseButton @click="removeDaughterLocally(i)" variant="danger">
              Remove
            </BaseButton>
          </li>
        </ul>
      </div>

      <div class="button-group">
        <BaseButton @click="confirmImmediateFamily" variant="primary">
          Create Family
        </BaseButton>
        <BaseButton @click="cancel" variant="danger"> Cancel </BaseButton>
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
        <BaseButton @click="confirmAncestralFamily" variant="primary">
          Create Ancestral Family
        </BaseButton>
        <BaseButton @click="cancel" variant="danger"> Cancel </BaseButton>
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
.initial-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}
</style>
