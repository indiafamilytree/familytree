// stores/family-tree-store/actions/initializeRootPerson.js
export function initializeRootPerson(rootPerson, enableLogging = false) {
  const isDevelopment = enableLogging;

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

  if (isDevelopment) {
    console.log("initializeRootPerson:");
    console.log("   Current persons:", this.persons);
    console.log("   Current families:", this.families);
    console.log("   Current nodes:", this.nodes);
    console.log("   Current edges:", this.edges);
  }
}
