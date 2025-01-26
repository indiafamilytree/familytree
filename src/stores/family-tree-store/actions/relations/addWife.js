import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addWife(linkedPerson, newPerson, enableLogging) {
  addFamilyAndEdges.call(this, newPerson, "Spouse", enableLogging);
}
