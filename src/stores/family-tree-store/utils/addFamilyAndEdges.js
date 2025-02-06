// File: src/stores/family-tree-store/utils/addFamilyAndEdges.js

// No need to find family by relation from a members array; always return null.
function findFamilyForRelation(families, person, relation) {
  return null;
}

// Create a new family object with explicit fields.
function createFamily(families) {
  const familyId = `family-${families.length + 1}`;
  const family = {
    id: familyId,
    husbandId: null,
    wifeId: null,
    sons: [],
    daughters: [],
  };
  return family;
}

// Previously used to update a combined members array; no longer needed.
// We'll make this a no-op or remove it entirely.
function updateFamily(family, person) {
  // With the new model, family composition is maintained via explicit fields.
  // This function can be left as a no-op.
}

// Update the family node label (remains unchanged).
function updateFamilyNodeLabel(nodes, familyId) {
  const familyNode = nodes.find((n) => n.data.id === familyId);
  if (familyNode) {
    familyNode.data.label = "Family"; // Always label as "Family"
  }
}

// Add an edge if one with the same source, target, and label does not exist.
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

// Create edges for the given relation using explicit configuration.
function createEdgesForRelation(family, person, relation, addEdgeFunc) {
  const familyNodeId = family.id;

  // Define edge types with consistent source and target directions.
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

/**
 * addFamilyAndEdges: Adds a person to a family (or creates a new family) and
 * adds corresponding edges.
 *
 * Parameters:
 *  - person: The person object to be added.
 *  - relation: The relation string (e.g. "Husband", "Wife", "Son", "Daughter", etc.).
 *  - enableLogging: If true, logs debug information.
 *  - linkedFamilyId: (Optional) If provided, attempts to use that family.
 */
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

  // Find the family by linkedFamilyId if provided.
  if (linkedFamilyId) {
    existingFamily = this.families.find((f) => f.id === linkedFamilyId);
  }

  // If no existing family and the relation is not Husband or Wife, try to find one.
  // With the new model, we always return null.
  if (!existingFamily && relation !== "Husband" && relation !== "Wife") {
    existingFamily = findFamilyForRelation(this.families, person, relation);
  }

  // Create a new family if no existing family is found.
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

  // Update family node label.
  updateFamilyNodeLabel(this.nodes, existingFamily.id);

  // (Optional) Update the family explicit fields.
  // In the new model, updating the family with the person is handled by the caller
  // (for example, when adding a child or spouse, you update the relevant field).
  // Here we call updateFamily (currently a no-op) for backward compatibility.
  updateFamily(existingFamily, person);

  // Add edges.
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
