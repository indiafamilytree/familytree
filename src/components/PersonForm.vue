<!-- ./components/PersonForm.vue -->
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
        <select v-model="relation" id="relation" required class="form-input">
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="son">Son</option>
          <option value="daughter">Daughter</option>
          <option value="husband">Husband</option>
          <option value="wife">Wife</option>
        </select>
      </div>
      <!-- Removed the linkedFamilyId select as persons will only link to families via familyLinks -->
      <div class="button-group">
        <BaseButton type="submit" variant="primary">Add Person</BaseButton>
        <BaseButton @click="downloadJson" variant="inprogress">
          Download JSON
        </BaseButton>
      </div>
      <div class="button-group">
        <BaseButton tag="label" variant="primary">
          Import JSON
          <input
            type="file"
            id="file-upload"
            class="hidden"
            @change="handleFileImport"
            accept=".json"
          />
        </BaseButton>
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
const relation = ref("father");
// removed linkedFamilyId because a person will not be directly linked to another person

function addPerson() {
  let gender;
  if (
    relation.value === "father" ||
    relation.value === "son" ||
    relation.value === "husband"
  ) {
    gender = "male";
  } else if (
    relation.value === "mother" ||
    relation.value === "daughter" ||
    relation.value === "wife"
  ) {
    gender = "female";
  }

  // Create a person with an empty familyLinks array.
  store.addPerson({
    name: name.value,
    gender: gender,
    relation: relation.value, // optionally store the relation if needed
    familyLinks: [], // person starts with no family links
  });

  // Reset form fields.
  name.value = "";
  relation.value = "father";
}

function downloadJson() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(store.persons));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "family-tree.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        store.importPersons(importedData, store);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file);
  }
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
