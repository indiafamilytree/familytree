// family-tree-store/utils/addFamilyAndEdges.js

function findFamilyForRelation(families, person, relation) {
  //   if (relation === "Spouse") {
  //     return families.find((f) => f.members.includes(person.id));
  //   } else if (relation === "Child") {
  //     return families.find((f) => f.members.includes(person.id));
  //   } else {
  //     // For Father, Mother, or initial person creation
  //     return null;
  //   }
  // No need to find family here anymore.
  return null;
}

function createFamily(families) {
  const familyId = `family-${families.length + 1}`;
  const family = {
    id: familyId,
    members: [], // Store all family members (parents and children)
  };
  return family;
}

function updateFamily(family, person) {
  // Fixed this to just add the person to the family
  if (!family.members.includes(person.id)) {
    family.members.push(person.id);
  }
}

function updateFamilyNodeLabel(nodes, familyId) {
  const familyNode = nodes.find((n) => n.data.id === familyId);
  if (familyNode) {
    familyNode.data.label = "Family"; // Always label as "Family"
  }
}

function addEdges(edges, source, target, label, enableLogging) {
  if (
    !edges.some(
      (edge) =>
        edge.data.source === source &&
        edge.data.target === target &&
        edge.data.label === label
    )
  ) {
    edges.push({ data: { source, target, label } });
    if (enableLogging) {
      console.log("    Added edge:", { source, target, label });
    }
  }
}

function createEdgesForRelation(family, person, relation, addEdgeFunc) {
  const familyNodeId = family.id;

  // Define edge types with consistent source and target directions
  const edgeTypes = {
    Husband: { personToFamily: "Husband", from: "person", to: "family" },
    Wife: { personToFamily: "Wife", from: "person", to: "family" },
    Son: { personToFamily: "Son", from: "family", to: "person" },
    Daughter: { personToFamily: "Daughter", from: "family", to: "person" },
    Father: { personToFamily: "Father", from: "person", to: "family" },
    Mother: { personToFamily: "Mother", from: "person", to: "family" },
  };

  const edgeConfig = edgeTypes[relation];
  if (edgeConfig) {
    if (edgeConfig.from === "person" && edgeConfig.to === "family") {
      addEdgeFunc(person.id, familyNodeId, edgeConfig.personToFamily);
    } else if (edgeConfig.from === "family" && edgeConfig.to === "person") {
      addEdgeFunc(familyNodeId, person.id, edgeConfig.personToFamily);
    }
  }
}

export function addFamilyAndEdges(
  person,
  relation,
  enableLogging,
  linkedFamilyId = null
) {
  if (enableLogging) {
    console.log("  addFamilyAndEdges:", { person, relation, linkedFamilyId });
  }

  if (!person) return;

  let existingFamily = null;

  // Find the family by linkedFamilyId
  if (linkedFamilyId) {
    existingFamily = this.families.find((f) => f.id === linkedFamilyId);
  }

  // If no existing family and the relation is not Husband or Wife, find family the person belongs to
  if (!existingFamily && relation !== "Husband" && relation !== "Wife") {
    existingFamily = findFamilyForRelation(this.families, person, relation);
  }

  // Create a new family if no existing family is found
  if (!existingFamily) {
    existingFamily = createFamily(this.families);
    this.families.push(existingFamily);
    this.nodes.push({
      data: {
        id: existingFamily.id,
        label: "Family",
        isFamily: true,
      },
    });
    if (enableLogging) {
      console.log("    New family created:", existingFamily);
    }
  } else if (enableLogging) {
    console.log("    Existing family found:", existingFamily);
  }

  // Update family members
  updateFamily(existingFamily, person);
  updateFamilyNodeLabel(this.nodes, existingFamily.id);

  // Add edges
  const addEdgeFunc = (source, target, label) =>
    addEdges(this.edges, source, target, label, enableLogging);

  createEdgesForRelation(existingFamily, person, relation, addEdgeFunc);

  if (enableLogging) {
    console.log("  addFamilyAndEdges AFTER:");
    console.log("    Current persons:", this.persons);
    console.log("    Current families:", this.families);
    console.log("    Current nodes:", this.nodes);
    console.log("    Current edges:", this.edges);
  }
}
