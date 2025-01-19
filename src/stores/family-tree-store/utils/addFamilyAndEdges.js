// family-tree-store/utils/addFamilyAndEdges.js

export function addFamilyAndEdges(parent, child, relation, enableLogging) {
  const isDevelopment = enableLogging;
  if (isDevelopment) {
    console.log("  addFamilyAndEdges:", { parent, child, relation });
  }

  if (!parent || !child) return;

  let family;
  if (relation === "Wife") {
    // Find family by parentId (father)
    family = this.families.find((f) => f.fatherId === parent.id);
  } else {
    // Original logic for other relations
    family = this.families.find((f) => f.childrenIds.includes(child.id));
  }

  // If no family found, create a new one
  if (!family) {
    const familyId = `family-${this.families.length + 1}`;
    family = {
      id: familyId,
      fatherId:
        relation === "Mother" ||
        relation === "Wife" ||
        relation === "Son" ||
        relation === "Daughter"
          ? null
          : parent.id,
      motherId:
        relation === "Father" || relation === "Husband" ? null : parent.id,
      childrenIds: [child.id],
    };
    this.families.push(family);

    this.nodes.push({
      data: {
        id: familyId,
        label: "Family", // Default label, will update later
        isFamily: true,
      },
    });
    if (isDevelopment) {
      console.log("    New family created:", family);
    }
  } else {
    if (isDevelopment) {
      console.log("    Existing family found:", family);
    }
  }

  // Update existing family
  if (relation === "Father") {
    family.fatherId = parent.id;
  } else if (relation === "Mother") {
    family.motherId = parent.id;
  } else if (relation === "Wife") {
    family.motherId = child.id;
  } else if (relation === "Husband") {
    family.fatherId = child.id;
  }

  // Ensure child is in childrenIds
  if (
    !family.childrenIds.includes(child.id) &&
    relation !== "Wife" &&
    relation !== "Husband"
  ) {
    family.childrenIds.push(child.id);
  }

  // Update family node label
  const familyNode = this.nodes.find((n) => n.data.id === family.id);
  if (familyNode) {
    const fatherName = family.fatherId
      ? this.persons.find((p) => p.id === family.fatherId)?.name || "Unknown"
      : "";
    const motherName = family.motherId
      ? this.persons.find((p) => p.id === family.motherId)?.name || "Unknown"
      : "";

    if (fatherName !== "" && motherName !== "") {
      familyNode.data.label = `${fatherName}\n${motherName}`;
    } else if (fatherName !== "") {
      familyNode.data.label = `${fatherName}`;
    } else if (motherName !== "") {
      familyNode.data.label = `${motherName}`;
    } else {
      familyNode.data.label = "Family";
    }

    if (isDevelopment) {
      console.log("    Updated family node label:", familyNode.data.label);
    }
  }

  const addEdge = (source, target, label) => {
    if (
      !this.edges.some(
        (edge) =>
          edge.data.source === source &&
          edge.data.target === target &&
          edge.data.label === label
      )
    ) {
      this.edges.push({ data: { source, target, label } });
      if (isDevelopment) {
        console.log("    Added edge:", { source, target, label });
      }
    }
  };

  const familyNodeId = family.id;

  if (relation === "Father") {
    addEdge(parent.id, familyNodeId, "Father");
    addEdge(familyNodeId, child.id, "Son");
  } else if (relation === "Mother") {
    addEdge(parent.id, familyNodeId, "Mother");
    addEdge(familyNodeId, child.id, "Son");
  } else if (relation === "Son") {
    addEdge(familyNodeId, child.id, "Son");
  } else if (relation === "Daughter") {
    addEdge(familyNodeId, child.id, "Daughter");
  } else if (relation === "Wife") {
    addEdge(parent.id, familyNodeId, "Father");
    addEdge(child.id, familyNodeId, "Mother");
  } else if (relation === "Husband") {
    addEdge(parent.id, familyNodeId, "Mother");
    addEdge(child.id, familyNodeId, "Father");
  }

  if (isDevelopment) {
    console.log("  addFamilyAndEdges AFTER:");
    console.log("    Current persons:", this.persons);
    console.log("    Current families:", this.families);
    console.log("    Current nodes:", this.nodes);
    console.log("    Current edges:", this.edges);
  }
}
