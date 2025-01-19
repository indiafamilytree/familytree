import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addDaughter(linkedPerson, newPerson, enableLogging) {
  addFamilyAndEdges.call(
    this,
    linkedPerson,
    newPerson,
    "Daughter",
    enableLogging
  );
}
