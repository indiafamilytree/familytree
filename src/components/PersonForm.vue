<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/components/PersonForm.vue -->
<template>
  <div class="person-form">
    <form @submit.prevent="addPerson" class="form-layout">
      <div class="form-group">
        <input
          v-model="name"
          id="name"
          placeholder="Name"
          required
          class="form-input"
        />
      </div>
      <div class="form-group">
        <select v-model="gender" id="gender" required class="form-input">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div class="button-group">
        <BaseButton type="submit" variant="primary">Add Person</BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

const store = useFamilyTreeStore();
const persons = computed(() => store.persons);
const families = computed(() => store.families);

const name = ref("");
const gender = ref("male");

function addPerson() {
  // Initialize the root person
  store.initializeRootPerson({
    name: name.value,
    gender: gender.value,
  });

  // Reset form fields.
  name.value = "";
  gender.value = "male";
}
</script>

<style scoped>
.person-form {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 15px;
}
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.button-group {
  display: flex;
  gap: 10px;
}
.hidden {
  display: none;
}
</style>
