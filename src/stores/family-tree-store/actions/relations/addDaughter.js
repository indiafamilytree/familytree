// stores/family-tree-store/actions/relations/addSon.js
import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";
import { renameSpouseEdgeToParentIfNeeded } from "../../utils/renameSpouseEdgeToParentIfNeeded.js";

export function addDaughter(linkedPerson, newPerson, enableLogging) {
  // 1) Actually add the child
  addFamilyAndEdges.call(this, linkedPerson, "Child", enableLogging);

  // 2) Figure out which family we just modified. Usually, you can find it
  //    by searching for a family that includes linkedPerson (the father or mother).
  //    If you have "linkedFamilyId" in `newPerson`, you can use that directly.

  // Example: if addFamilyAndEdges assigned a `linkedFamilyId`,
  // or if your store keeps track of it:
  const family = this.families.find((f) => f.members.includes(linkedPerson.id));
  if (family) {
    // rename spouse → father/mother if children exist
    renameSpouseEdgeToParentIfNeeded.call(this, family.id);
  }
}
