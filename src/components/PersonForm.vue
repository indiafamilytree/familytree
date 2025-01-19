<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/components/PersonForm.vue -->
<template>
  <div>
    <h2>Add Person</h2>
    <form @submit.prevent="addPerson">
      <div>
        <label for="name">Name:</label>
        <input v-model="name" id="name" required />
      </div>
      <div>
        <label for="relation">Relation:</label>
        <select v-model="relation" id="relation" required>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="son">Son</option>
          <option value="daughter">Daughter</option>
        </select>
      </div>
      <div>
        <label for="linkedPersonId">Linked Person:</label>
        <select v-model="linkedPersonId" id="linkedPersonId" required>
          <option v-for="person in persons" :key="person.id" :value="person.id">
            {{ person.name }}
          </option>
        </select>
      </div>
      <button type="submit">Add Person</button>
    </form>
  </div>
</template>

<script>
import { useFamilyTreeStore } from "../stores/familyTree";

export default {
  data() {
    return {
      name: "",
      relation: "father",
      linkedPersonId: "",
    };
  },
  computed: {
    persons() {
      const store = useFamilyTreeStore();
      return store.persons;
    },
  },
  methods: {
    addPerson() {
      let gender;
      if (this.relation === "father" || this.relation === "son") {
        gender = "male";
      } else if (this.relation === "mother" || this.relation === "daughter") {
        gender = "female";
      }

      const store = useFamilyTreeStore();
      store.addPerson({
        name: this.name,
        gender: gender,
        relation: this.relation,
        linkedPersonId: this.linkedPersonId,
      });
      this.name = "";
      this.relation = "father";
      this.linkedPersonId = "";
    },
  },
};
</script>
