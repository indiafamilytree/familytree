import { defineStore } from "pinia";

export const useFamilyTreeStore = defineStore("familyTree", {
  state: () => ({
    persons: [],
    families: [],
    nodes: [],
    edges: [],
    rootPerson: null,
  }),
  actions: {
    initializeRootPerson(rootPerson, enableLogging = false) {
      const isDevelopment = enableLogging;

      if (!rootPerson || !rootPerson.name || !rootPerson.gender) {
        console.error("Invalid root person data:", rootPerson);
        return;
      }

      const rootId = "person-1";
      this.rootPerson = { id: rootId, ...rootPerson };
      this.persons.push(this.rootPerson);
      this.nodes.push({
        data: { id: rootId, label: rootPerson.name, gender: rootPerson.gender },
      });

      if (isDevelopment) {
        console.log("initializeRootPerson:");
        console.log("  Current persons:", this.persons);
        console.log("  Current families:", this.families);
        console.log("  Current nodes:", this.nodes);
        console.log("  Current edges:", this.edges);
      }
    },

    addPerson(person, enableLogging = false) {
      const isDevelopment = enableLogging;

      if (!person) {
        console.error("addPerson called without person data.");
        return;
      }

      if (isDevelopment) {
        console.log("addPerson called with:", person);
      }

      if (
        !person.name ||
        !person.gender ||
        !person.relation ||
        !person.linkedPersonId
      ) {
        console.error("Invalid person data:", person);
        return;
      }

      if (!this.persons.find((p) => p.id === person.linkedPersonId)) {
        console.error("linkedPersonId does not exist:", person.linkedPersonId);
        return;
      }

      const newId = `person-${this.persons.length + 1}`;
      const newPerson = { id: newId, ...person };
      this.persons.push(newPerson);
      this.nodes.push({
        data: { id: newId, label: person.name, gender: person.gender },
      });

      const addFamilyAndEdges = (parent, child, relation) => {
        const isDevelopment = enableLogging; // Access enableLogging from the addPerson scope
        if (isDevelopment) {
          console.log("  addFamilyAndEdges:", { parent, child, relation });
        }

        if (!parent || !child) return;

        // Find the existing family correctly
        let family;
        if (relation === "Wife") {
          // Find family by fatherId
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
              relation === "Mother" || relation === "Wife" ? null : parent.id,
            motherId:
              relation === "Father" || relation === "Husband"
                ? null
                : parent.id,
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
          if (family.childrenIds.length === 0) {
            family.childrenIds = [parent.id];
          }
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
            ? this.persons.find((p) => p.id === family.fatherId)?.name ||
              "Unknown"
            : "";
          const motherName = family.motherId
            ? this.persons.find((p) => p.id === family.motherId)?.name ||
              "Unknown"
            : "";
          familyNode.data.label = `${fatherName}\n${motherName}`;
          if (isDevelopment) {
            console.log(
              "    Updated family node label:",
              familyNode.data.label
            );
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

        // Only add Father, Mother, Son, Daughter edges
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
      };

      const linkedPerson = this.persons.find(
        (p) => p.id === person.linkedPersonId
      );

      if (person.relation === "father") {
        addFamilyAndEdges(newPerson, linkedPerson, "Father");
      } else if (person.relation === "mother") {
        addFamilyAndEdges(newPerson, linkedPerson, "Mother");
      } else if (person.relation === "wife") {
        addFamilyAndEdges(linkedPerson, newPerson, "Wife");
      } else if (person.relation === "son" || person.relation === "daughter") {
        addFamilyAndEdges(linkedPerson, newPerson, person.relation);
      }

      if (isDevelopment) {
        console.log("addPerson AFTER:");
        console.log("  Current persons:", this.persons);
        console.log("  Current families:", this.families);
        console.log("  Current nodes:", this.nodes);
        console.log("  Current edges:", this.edges);
      }
    },
  },
});
