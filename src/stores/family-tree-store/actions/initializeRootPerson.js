// ./stores/family-tree-store/actions/initializeRootPerson.js
export function initializeRootPerson(rootPerson, enableLogging = false) {
  const isDevelopment = enableLogging;

  if (!rootPerson || !rootPerson.name || !rootPerson.gender) {
    console.error("Invalid root person data:", rootPerson);
    return;
  }

  const rootId = "person-1";
  this.rootPerson = { id: rootId, ...rootPerson };
  this.persons.push(this.rootPerson);
  this.nodes.push({
    data: { id: rootId, label: rootPerson.name, gender: rootPerson.gender },
  });

  // Create a family for the root person to belong to
  const familyId = "family-1";
  this.families.push({
    id: familyId,
    members: [rootId],
    // Initialize sons and daughters as empty arrays
    sons: [],
    daughters: [],
  });

  this.nodes.push({
    data: {
      id: familyId,
      label: "Family",
      isFamily: true,
    },
  });

  // Create an edge from the family to the root person
  this.edges.push({
    data: {
      source: familyId,
      target: rootId,
      label: rootPerson.gender === "male" ? "Son" : "Daughter",
    },
  });

  if (isDevelopment) {
    console.log("initializeRootPerson:");
    console.log("   Current persons:", this.persons);
    console.log("   Current families:", this.families);
    console.log("   Current nodes:", this.nodes);
    console.log("   Current edges:", this.edges);
  }
}
