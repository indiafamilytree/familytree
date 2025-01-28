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

      <div class="form-group">
        <select v-model="linkedFamilyId" id="linkedFamilyId" class="form-input">
          <option value="">Select Family (Optional)</option>
          <option
            v-for="family in families"
            :key="family.id"
            :value="family.id"
          >
            {{ family.id }}
          </option>
        </select>
      </div>

      <div class="button-group">
        <button type="submit" class="form-button">Add Person</button>
        <button @click="downloadJson" class="form-button">Download JSON</button>
      </div>
      <div class="button-group">
        <label for="file-upload" class="form-button"> Import JSON </label>
        <input
          type="file"
          id="file-upload"
          class="hidden-input"
          @change="handleFileImport"
          accept=".json"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

const store = useFamilyTreeStore();
const persons = computed(() => store.persons);
const families = computed(() => store.families);

const name = ref("");
const relation = ref("father");
const linkedFamilyId = ref("");

const addPerson = () => {
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

  let linkedPersonId = null;
  if (linkedFamilyId.value) {
    const linkedFamily = store.families.find(
      (f) => f.id === linkedFamilyId.value
    );
    if (linkedFamily && linkedFamily.members.length > 0) {
      linkedPersonId = linkedFamily.members[0];
    }
  }

  store.addPerson({
    name: name.value,
    gender: gender,
    relation: relation.value,
    linkedPersonId: linkedPersonId,
  });

  name.value = "";
  relation.value = "father";
  linkedFamilyId.value = "";
};

const downloadJson = () => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(store.persons));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "family-tree.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const handleFileImport = (event) => {
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
};
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

.form-button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
  flex-grow: 1;
}

.hidden-input {
  display: none;
}
</style>
