import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addSon(linkedPerson, newPerson, enableLogging) {
  addFamilyAndEdges.call(this, linkedPerson, "Child", enableLogging);
}
