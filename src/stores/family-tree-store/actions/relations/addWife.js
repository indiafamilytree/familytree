import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";

export function addWife(linkedPerson, newPerson, enableLogging) {
  addFamilyAndEdges.call(this, linkedPerson, newPerson, "Wife", enableLogging);
}
