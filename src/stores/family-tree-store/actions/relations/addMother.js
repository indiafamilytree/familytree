import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addMother(newPerson, enableLogging) {
  addFamilyAndEdges.call(this, newPerson, "Mother", enableLogging);
}
