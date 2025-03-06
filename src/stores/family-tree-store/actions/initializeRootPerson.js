// src/stores/family-tree-store/actions/initializeRootPerson.js
import { createPerson } from "@/services/dataService";

export async function initializeRootPerson(rootPerson, enableLogging = false) {
  if (!rootPerson || !rootPerson.name || !rootPerson.gender) {
    console.error("Invalid root person data:", rootPerson);
    return;
  }

  const rootId = this.getNewPersonId();
  this.rootPerson = { id: rootId, personId: rootId, ...rootPerson };
  this.persons.push(this.rootPerson);
  this.nodes.push({
    data: { id: rootId, label: rootPerson.name, gender: rootPerson.gender },
  });

  if (enableLogging) {
    console.log("initializeRootPerson:");
    console.log("   Current persons:", this.persons);
    console.log("   Current families:", this.families);
    console.log("   Current nodes:", this.nodes);
    console.log("   Current edges:", this.edges);
  }
}
