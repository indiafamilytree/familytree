import {
  addFather,
  addMother,
  addWife,
  addSon,
  addDaughter,
  addHusband,
} from "./relations/index.js";
import { addFamilyAndEdges } from "../utils/addFamilyAndEdges.js";

export function addPerson(person, enableLogging = false) {
  const isDevelopment = enableLogging;

  if (!person) {
    console.error("addPerson called without person data.");
    return;
  }

  if (isDevelopment) {
    console.log("addPerson called with:", person);
  }

  if (!person.name || !person.gender || !person.relation) {
    console.error("Invalid person data:", person);
    return;
  }

  const newId = this.getNewPersonId();
  const newPerson = { id: newId, ...person };
  this.persons.push(newPerson);
  this.nodes.push({
    data: { id: newId, label: person.name, gender: person.gender },
  });

  let linkedPerson = null;
  if (person.linkedPersonId) {
    linkedPerson = this.persons.find((p) => p.id === person.linkedPersonId);
  }

  if (person.relation === "father") {
    addFather.call(this, newPerson, enableLogging);
  } else if (person.relation === "mother") {
    addMother.call(this, newPerson, enableLogging);
  } else if (person.relation === "wife") {
    addWife.call(this, linkedPerson, newPerson, enableLogging);
  } else if (person.relation === "husband") {
    addHusband.call(this, linkedPerson, newPerson, enableLogging);
  } else if (person.relation === "son") {
    addSon.call(this, linkedPerson, newPerson, enableLogging);
  } else if (person.relation === "daughter") {
    addDaughter.call(this, linkedPerson, newPerson, enableLogging);
  } else {
    addFamilyAndEdges.call(
      this,
      newPerson,
      person.relation,
      enableLogging,
      person.linkedFamilyId
    );
  }

  if (isDevelopment) {
    console.log("addPerson AFTER:");
    console.log("   Current persons:", this.persons);
    console.log("   Current families:", this.families);
    console.log("   Current nodes:", this.nodes);
    console.log("   Current edges:", this.edges);
  }
}
