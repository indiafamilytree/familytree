import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addMother(newPerson, linkedPerson, enableLogging) {
  addFamilyAndEdges.call(
    this,
    newPerson,
    linkedPerson,
    "Mother",
    enableLogging
  );
}
