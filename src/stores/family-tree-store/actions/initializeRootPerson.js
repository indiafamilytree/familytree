// src/stores/family-tree-store/actions/initializeRootPerson.js
import { createPerson } from "@/services/dataService";

export async function initializeRootPerson(rootPerson, enableLogging = false) {
  if (!rootPerson || !rootPerson.name || !rootPerson.gender) {
    console.error("Invalid root person data:", rootPerson);
    return;
  }

  const rootId = this.getNewPersonId();
  this.rootPerson = { id: rootId, ...rootPerson };
  this.persons.push(this.rootPerson);
  this.nodes.push({
    data: { id: rootId, label: rootPerson.name, gender: rootPerson.gender },
  });

  // Immediately persist the root person to the backend.
  try {
    const { errors, data } = await createPerson({
      personId: rootId,
      firstName: rootPerson.name,
      gender: rootPerson.gender,
    });
    if (errors && errors.length > 0) {
      console.error("Error creating root person in backend:", errors);
    } else {
      console.log("Created root person in backend:", data);
    }
  } catch (error) {
    console.error("Error during backend call for root person:", error);
  }

  if (enableLogging) {
    console.log("initializeRootPerson:");
    console.log("   Current persons:", this.persons);
    console.log("   Current families:", this.families);
    console.log("   Current nodes:", this.nodes);
    console.log("   Current edges:", this.edges);
  }
}
