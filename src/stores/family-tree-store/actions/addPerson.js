import { addFather } from "./relations/addFather.js";
import { addMother } from "./relations/addMother.js";
import { addWife } from "./relations/addWife.js";
import { addSon } from "./relations/addSon.js";
import { addDaughter } from "./relations/addDaughter.js";
import { addHusband } from "./relations/addHusband.js";

export function addPerson(person, enableLogging = false) {
  const isDevelopment = enableLogging;

  if (!person) {
    console.error("addPerson called without person data.");
    return;
  }

  if (isDevelopment) {
    console.log("addPerson called with:", person);
  }

  if (
    !person.name ||
    !person.gender ||
    !person.relation ||
    !person.linkedPersonId
  ) {
    console.error("Invalid person data:", person);
    return;
  }

  if (!this.persons.find((p) => p.id === person.linkedPersonId)) {
    console.error("linkedPersonId does not exist:", person.linkedPersonId);
    return;
  }

  const newId = `person-${this.persons.length + 1}`;
  const newPerson = { id: newId, ...person };
  this.persons.push(newPerson);
  this.nodes.push({
    data: { id: newId, label: person.name, gender: person.gender },
  });

  const linkedPerson = this.persons.find((p) => p.id === person.linkedPersonId);

  if (person.relation === "father") {
    addFather.call(this, newPerson, linkedPerson, enableLogging);
  } else if (person.relation === "mother") {
    addMother.call(this, newPerson, linkedPerson, enableLogging);
  } else if (person.relation === "wife") {
    addWife.call(this, linkedPerson, newPerson, enableLogging);
  } else if (person.relation === "husband") {
    addHusband.call(this, linkedPerson, newPerson, enableLogging);
  } else if (person.relation === "son") {
    addSon.call(this, linkedPerson, newPerson, enableLogging);
  } else if (person.relation === "daughter") {
    addDaughter.call(this, linkedPerson, newPerson, enableLogging);
  }

  if (isDevelopment) {
    console.log("addPerson AFTER:");
    console.log("  Current persons:", this.persons);
    console.log("  Current families:", this.families);
    console.log("  Current nodes:", this.nodes);
    console.log("  Current edges:", this.edges);
  }
}
