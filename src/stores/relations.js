export const relations = {
  Father: {
    addToFamily: (family, parent, child) => {
      family.fatherId = parent.id;
      if (!family.childrenIds.includes(child.id)) {
        family.childrenIds.push(child.id);
      }
    },
    createEdges: (familyNodeId, parent, child, addEdge) => {
      addEdge(parent.id, familyNodeId, "Father");
      addEdge(familyNodeId, child.id, "Son");
    },
  },
  Mother: {
    addToFamily: (family, parent, child) => {
      family.motherId = parent.id;
      if (!family.childrenIds.includes(child.id)) {
        family.childrenIds.push(child.id);
      }
    },
    createEdges: (familyNodeId, parent, child, addEdge) => {
      addEdge(parent.id, familyNodeId, "Mother");
      addEdge(familyNodeId, child.id, "Son");
    },
  },
  Son: {
    addToFamily: (family, parent, child) => {
      if (!family.childrenIds.includes(child.id)) {
        family.childrenIds.push(child.id);
      }
      if (!family.childrenIds.includes(parent.id)) {
        family.childrenIds.push(parent.id);
      }
    },
    createEdges: (familyNodeId, parent, child, addEdge) => {
      addEdge(parent.id, familyNodeId, "Father");
      addEdge(familyNodeId, child.id, "Son");
    },
  },
  Daughter: {
    addToFamily: (family, parent, child) => {
      if (!family.childrenIds.includes(child.id)) {
        family.childrenIds.push(child.id);
      }
      if (!family.childrenIds.includes(parent.id)) {
        family.childrenIds.push(parent.id);
      }
    },
    createEdges: (familyNodeId, parent, child, addEdge) => {
      addEdge(parent.id, familyNodeId, "Mother");
      addEdge(familyNodeId, child.id, "Daughter");
    },
  },
  Wife: {
    findFamily: (families, parent) => {
      return families.find((f) => f.fatherId === parent.id);
    },
    addToFamily: (family, parent, child) => {
      family.motherId = child.id;
      if (family.childrenIds.length === 0) {
        family.childrenIds = [parent.id];
      }
    },
    createEdges: (familyNodeId, parent, child, addEdge) => {
      addEdge(parent.id, familyNodeId, "Father");
      addEdge(child.id, familyNodeId, "Mother");
    },
  },
  Husband: {
    addToFamily: (family, parent, child) => {
      family.fatherId = child.id;
    },
    createEdges: (familyNodeId, parent, child, addEdge) => {
      addEdge(parent.id, familyNodeId, "Mother");
      addEdge(child.id, familyNodeId, "Father");
    },
  },
};
