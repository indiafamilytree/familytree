// stores/family-tree-store/utils/renameSpouseEdgeToParentIfNeeded.js

export function renameSpouseEdgeToParentIfNeeded(familyId) {
  // `this` is the store context if you call with .call(this, familyId)
  const fam = this.families.find((f) => f.id === familyId);
  if (!fam) return;

  // If family has at least one child, rename “Husband” → “Father” and “Wife” → “Mother”
  const hasChild = fam.childrenIds && fam.childrenIds.length > 0;
  if (!hasChild) return;

  // If fatherId exists and the stored edge label is "Husband", change it to "Father"
  if (fam.fatherId) {
    const fatherEdge = this.edges.find(
      (e) =>
        e.data.source === fam.fatherId &&
        e.data.target === familyId &&
        e.data.label === "Husband"
    );
    if (fatherEdge) {
      fatherEdge.data.label = "Father";
    }
  }

  // If motherId exists and the stored edge label is "Wife", change it to "Mother"
  if (fam.motherId) {
    const motherEdge = this.edges.find(
      (e) =>
        e.data.source === fam.motherId &&
        e.data.target === familyId &&
        e.data.label === "Wife"
    );
    if (motherEdge) {
      motherEdge.data.label = "Mother";
    }
  }
}
