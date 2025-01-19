<template>
  <div class="bg-white p-4 rounded shadow-md">
    <form @submit.prevent="addPerson" class="flex items-center space-x-2">
      <input
        v-model="name"
        id="name"
        placeholder="Name"
        required
        class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />

      <select
        v-model="relation"
        id="relation"
        required
        class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option value="father">Father</option>
        <option value="mother">Mother</option>
        <option value="son">Son</option>
        <option value="daughter">Daughter</option>
        <option value="husband">Husband</option>
        <option value="wife">Wife</option>
      </select>

      <select
        v-model="linkedPersonId"
        id="linkedPersonId"
        required
        class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option v-for="person in persons" :key="person.id" :value="person.id">
          {{ person.name }}
        </option>
      </select>

      <button
        type="submit"
        class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add Person
      </button>
      <button
        @click="downloadJson"
        class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Download JSON
      </button>
      <label
        for="file-upload"
        class="cursor-pointer px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Import JSON
      </label>
      <input
        type="file"
        id="file-upload"
        class="hidden"
        @change="handleFileImport"
        accept=".json"
      />
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

const store = useFamilyTreeStore();
store.initializeRootPerson({
  name: "Kannaiyan",
  gender: "male",
});
const persons = computed(() => store.persons);

const name = ref("");
const relation = ref("father");
const linkedPersonId = ref("");

const addPerson = () => {
  console.log("Adding person:", {
    name: name.value,
    relation: relation.value,
    linkedPersonId: linkedPersonId.value,
  });

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

  console.log("Determined gender:", gender);

  store.addPerson({
    name: name.value,
    gender: gender,
    relation: relation.value,
    linkedPersonId: linkedPersonId.value,
  });

  console.log("Person added to store");

  name.value = "";
  relation.value = "father";
  linkedPersonId.value = "";

  console.log("Form reset");
};

const downloadJson = () => {
  console.log("downloadJson triggered");
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(store.persons));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "family-tree.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  console.log("JSON downloaded");
};

const handleFileImport = (event) => {
  console.log("handleFileImport triggered");
  const file = event.target.files[0];
  if (file) {
    console.log("File selected:", file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("File read successfully");
      try {
        const importedData = JSON.parse(e.target.result);
        console.log("Imported JSON data:", importedData);
        store.importPersons(importedData, store); // Assuming you have an importPersons method in your store
        console.log("Data imported to store");
      } catch (error) {
        console.error("Error parsing JSON:", error);
        // Handle error, e.g., show an error message to the user
      }
    };
    reader.readAsText(file);
  }
};
</script>
