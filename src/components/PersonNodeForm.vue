<template>
  <div class="person-node-form">
    <div v-if="!showImmediateFamilyForm && !showAncestralFamilyForm">
      <button @click="showImmediateFamilyForm = true">
        Create Immediate Family
      </button>
      <button @click="showAncestralFamilyForm = true">
        Add Parents (Ancestral Family)
      </button>
    </div>

    <div v-if="showImmediateFamilyForm">
      <h4>Add Immediate Family</h4>
      <div>
        <label>Spouse Name:</label>
        <input type="text" v-model="spouseName" />
      </div>

      <div>
        <label>New Son:</label>
        <div>
          <input v-model="tempSonName" type="text" />
          <button @click="addSonLocally">+</button>
        </div>
        <ul>
          <li v-for="(son, i) in newSons" :key="i">
            <span>{{ son.name }}</span>
            <button @click="removeSonLocally(i)">Remove</button>
          </li>
        </ul>
      </div>

      <div>
        <label>New Daughter:</label>
        <div>
          <input v-model="tempDaughterName" type="text" />
          <button @click="addDaughterLocally">+</button>
        </div>
        <ul>
          <li v-for="(daughter, i) in newDaughters" :key="i">
            <span>{{ daughter.name }}</span>
            <button @click="removeDaughterLocally(i)">Remove</button>
          </li>
        </ul>
      </div>

      <div>
        <button @click="confirmImmediateFamily">Create Immediate Family</button>
        <button @click="cancel">Cancel</button>
      </div>
    </div>

    <div v-if="showAncestralFamilyForm">
      <h4>Add Ancestral Family</h4>
      <div>
        <label>Father Name:</label>
        <input type="text" v-model="fatherName" />
      </div>
      <div>
        <label>Mother Name:</label>
        <input type="text" v-model="motherName" />
      </div>

      <div>
        <button @click="confirmAncestralFamily">Create Ancestral Family</button>
        <button @click="cancel">Cancel</button>
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
  background-color: #f0f0f0; /* Or any background you like */
  border-radius: 8px;
}

/* Example: basic input and button styling */
input[type="text"],
button,
select {
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}

ul {
  list-style-type: none;
  padding-left: 0; /* Reset any default padding */
}

/* Other styles as needed... */
</style>
