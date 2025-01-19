import { defineStore } from "pinia";
import { initializeRootPerson } from "./actions/initializeRootPerson.js";
import { addPerson } from "./actions/addPerson.js";
import { importPersons } from "./actions/importPersons.js";

export const useFamilyTreeStore = defineStore("familyTree", {
  state: () => ({
    persons: [],
    families: [],
    nodes: [],
    edges: [],
    rootPerson: null,
  }),
  actions: {
    initializeRootPerson,
    addPerson,
    importPersons,
  },
});
