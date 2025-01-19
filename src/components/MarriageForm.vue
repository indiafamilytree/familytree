<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/components/MarriageForm.vue -->
<template>
  <div class="max-w-md mx-auto mt-10">
    <h2 class="text-2xl font-bold mb-6">Add Marriage</h2>
    <form @submit.prevent="addMarriage" class="space-y-6">
      <div>
        <label for="fatherId" class="block text-sm font-medium text-gray-700"
          >Father:</label
        >
        <select
          v-model="fatherId"
          id="fatherId"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option
            v-for="person in malePersons"
            :key="person.id"
            :value="person.id"
          >
            {{ person.name }}
          </option>
        </select>
      </div>
      <div>
        <label for="motherId" class="block text-sm font-medium text-gray-700"
          >Mother:</label
        >
        <select
          v-model="motherId"
          id="motherId"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option
            v-for="person in femalePersons"
            :key="person.id"
            :value="person.id"
          >
            {{ person.name }}
          </option>
        </select>
      </div>
      <button
        type="submit"
        class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add Marriage
      </button>
    </form>
  </div>
</template>

<script>
import { useFamilyTreeStore } from "../stores/familyTree";

export default {
  data() {
    return {
      fatherId: "",
      motherId: "",
    };
  },
  computed: {
    persons() {
      const store = useFamilyTreeStore();
      return store.persons;
    },
    malePersons() {
      return this.persons.filter((person) => person.gender === "male");
    },
    femalePersons() {
      return this.persons.filter((person) => person.gender === "female");
    },
  },
  methods: {
    addMarriage() {
      const store = useFamilyTreeStore();
      store.addMarriage({
        fatherId: this.fatherId,
        motherId: this.motherId,
      });
      this.fatherId = "";
      this.motherId = "";
    },
  },
};
</script>
