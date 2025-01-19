export function importPersons(persons, store) {
  console.log("ImportPersons Called: ", persons.length);
  if (persons.length > 0) {
    store.persons = [];
    store.families = [];
    store.nodes = [];
    store.edges = [];
    store.rootPerson = null;
    store.initializeRootPerson(persons[0]);
    for (let i = 1; i < persons.length; i++) {
      const { id, ...personWithoutId } = persons[i];
      store.addPerson(personWithoutId);
    }
    console.log("ImportPersons:");
    console.log("  Current persons:", this.persons);
    console.log("  Current families:", this.families);
    console.log("  Current nodes:", this.nodes);
    console.log("  Current edges:", this.edges);
  }
}
