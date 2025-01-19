import { defineStore } from "pinia";

const isDevelopment = true; // process.env.NODE_ENV === "development";

export const useFamilyTreeStore = defineStore("familyTree", {
  state: () => ({
    persons: [],
    families: [],
    nodes: [],
    edges: [],
    rootPerson: null,
  }),
  actions: {
    initializeRootPerson(rootPerson) {
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
        console.log("Current persons:", this.persons);
        console.log("Current families:", this.families);
        console.log("Current nodes:", this.nodes);
        console.log("Current edges:", this.edges);
      }
    },

    addPerson(person) {
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
        if (isDevelopment) {
          console.log("addFamilyAndEdges:", { parent, child, relation });
        }

        if (!parent || !child) return;

        let family = this.families.find(
          (f) => f.fatherId === parent.id && f.childrenIds?.includes(child.id)
        );
        if (!family) {
          const familyId = `family-${this.families.length + 1}`;
          family = {
            id: familyId,
            fatherId: parent.id,
            motherId: null,
            childrenIds: [child.id],
          };
          this.families.push(family);

          const parentName = parent?.name || "Unknown";
          const unknown = "Unknown";

          this.nodes.push({
            data: {
              id: familyId,
              label: `${parentName}\n${unknown}`,
              isFamily: true,
            },
          });
        } else if (!family.childrenIds.includes(child.id)) {
          family.childrenIds.push(child.id);
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
          }
        };

        const familyNodeId = `family-${this.families.length}`;

        addEdge(parent.id, familyNodeId, relation); // Corrected: Use original relation
        addEdge(
          familyNodeId,
          child.id,
          relation === "Father"
            ? "Son"
            : relation === "Mother"
            ? "Daughter"
            : relation
        );

        if (isDevelopment) {
          console.log("addFamilyAndEdges AFTER:");
          console.log("Current persons:", this.persons);
          console.log("Current families:", this.families);
          console.log("Current nodes:", this.nodes);
          console.log("Current edges:", this.edges);
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
        const husband = this.persons.find(
          (p) => p.id === person.linkedPersonId
        );
        addFamilyAndEdges(husband, newPerson, "Wife");
      } else if (person.relation === "son" || person.relation === "daughter") {
        const existingFamily = this.families.find(
          (f) =>
            f.fatherId === linkedPerson.id || f.motherId === linkedPerson.id
        );
        let father = existingFamily
          ? this.persons.find((p) => p.id === existingFamily.fatherId)
          : linkedPerson;
        let mother = existingFamily
          ? this.persons.find((p) => p.id === existingFamily.motherId)
          : null;
        if (person.gender === "male") {
          addFamilyAndEdges(father, newPerson, "Son");
        } else {
          addFamilyAndEdges(father, newPerson, "Daughter");
        }
      }

      if (isDevelopment) {
        console.log("addPerson AFTER:");
        console.log("Current persons:", this.persons);
        console.log("Current families:", this.families);
        console.log("Current nodes:", this.nodes);
        console.log("Current edges:", this.edges);
      }
    },
  },
});
