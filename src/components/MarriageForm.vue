<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/components/MarriageForm.vue -->
<template>
  <div>
    <h2>Add Marriage</h2>
    <form @submit.prevent="addMarriage">
      <div>
        <label for="fatherId">Father:</label>
        <select v-model="fatherId" id="fatherId" required>
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
        <label for="motherId">Mother:</label>
        <select v-model="motherId" id="motherId" required>
          <option
            v-for="person in femalePersons"
            :key="person.id"
            :value="person.id"
          >
            {{ person.name }}
          </option>
        </select>
      </div>
      <button type="submit">Add Marriage</button>
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
