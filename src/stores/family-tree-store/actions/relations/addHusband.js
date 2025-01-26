import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addHusband(linkedPerson, newPerson, enableLogging) {
  addFamilyAndEdges.call(this, newPerson, "Spouse", enableLogging);
}
