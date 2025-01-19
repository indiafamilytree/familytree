import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addFather(newPerson, linkedPerson, enableLogging) {
  addFamilyAndEdges.call(
    this,
    newPerson,
    linkedPerson,
    "Father",
    enableLogging
  );
}
