<!-- ./components/MarriageForm.vue -->
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
      <div>
        <!-- Replace raw button with BaseButton -->
        <BaseButton type="submit" variant="primary"> Add Marriage </BaseButton>
      </div>
    </form>
  </div>
</template>

<script>
import { useFamilyTreeStore } from "../stores/familyTree";
import BaseButton from "./BaseButton.vue";

export default {
  components: {
    BaseButton,
  },
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
