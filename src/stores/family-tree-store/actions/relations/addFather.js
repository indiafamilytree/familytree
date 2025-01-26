import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addFather(newPerson, enableLogging) {
  addFamilyAndEdges.call(this, newPerson, "Father", enableLogging);
}
