// stores/family-tree-store/actions/relations/addDaughter.js
import { addFamilyAndEdges } from "../../utils/addFamilyAndEdges.js";
import { renameSpouseEdgeToParentIfNeeded } from "../../utils/renameSpouseEdgeToParentIfNeeded.js";

export function addDaughter(linkedPerson, newPerson, enableLogging) {
  // 1) Actually add the child.
  // (Assuming addFamilyAndEdges is updated to work with your new model.)
  addFamilyAndEdges.call(this, linkedPerson, "Child", enableLogging);

  // 2) Figure out which family we just modified.
  const family = this.families.find(
    (f) =>
      f.husbandId === linkedPerson.id ||
      f.wifeId === linkedPerson.id ||
      (f.sons && f.sons.includes(linkedPerson.id)) ||
      (f.daughters && f.daughters.includes(linkedPerson.id))
  );

  if (family) {
    // Rename spouse edge to parent if children exist.
    renameSpouseEdgeToParentIfNeeded.call(this, family.id);
  }
}
