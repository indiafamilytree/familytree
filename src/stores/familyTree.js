import { defineStore } from "pinia";

const persons = [
  { id: "1", name: "Grandpa A", gender: "male" },
  { id: "2", name: "Grandma A", gender: "female" },
  { id: "3", name: "Father B", gender: "male" },
  { id: "4", name: "Mother B", gender: "female" },
  { id: "5", name: "Child 1", gender: "male" },
  { id: "6", name: "Child 2", gender: "female" },
  { id: "7", name: "Grandpa C", gender: "male" },
  { id: "8", name: "Grandma C", gender: "female" },
];

const couples = [
  { id: "couple-1", fatherId: "1", motherId: "2" },
  { id: "couple-2", fatherId: "3", motherId: "4" },
  { id: "couple-3", fatherId: "7", motherId: "8" },
];

const children = [
  { coupleId: "couple-1", childrenIds: ["3"] },
  { coupleId: "couple-2", childrenIds: ["5", "6"] },
  { coupleId: "couple-3", childrenIds: ["4"] },
];

const relations = [
  { source: "1", target: "2", label: "Married" },
  { source: "7", target: "8", label: "Married" },
  { source: "3", target: "4", label: "Married" },
];

// Dynamically add couple relationships to relations
couples.forEach((couple) => {
  relations.push(
    { source: couple.fatherId, target: couple.id, label: "Couple" },
    { source: couple.motherId, target: couple.id, label: "Couple" }
  );
});

// Dynamically add parent-child relationships to relations
children.forEach((child) => {
  child.childrenIds.forEach((childId) => {
    relations.push({
      source: child.coupleId,
      target: childId,
      label: "Parent",
    });
  });
});

export const useFamilyTreeStore = defineStore("familyTree", {
  state: () => ({
    user: "3",
    persons,
    couples,
    children,
    nodes: [
      ...persons.map((person) => ({
        data: { id: person.id, label: person.name, gender: person.gender },
      })),
      ...couples.map((couple) => ({
        data: {
          id: couple.id,
          label: `${persons.find((p) => p.id === couple.fatherId).name} \n${
            persons.find((p) => p.id === couple.motherId).name
          }`,
          isCouple: true,
          father: persons.find((p) => p.id === couple.fatherId).name,
          mother: persons.find((p) => p.id === couple.motherId).name,
        },
      })),
    ],
    edges: relations.map((relation) => ({
      data: {
        source: relation.source,
        target: relation.target,
        label: relation.label,
      },
    })),
  }),
  actions: {
    addPerson(person) {
      const newId = (this.persons.length + 1).toString();
      this.persons.push({ id: newId, ...person });
      this.nodes.push({
        data: { id: newId, label: person.name, gender: person.gender },
      });
      if (person.relation === "parent") {
        this.edges.push({
          data: {
            source: newId,
            target: person.linkedPersonId,
            label: "Parent",
          },
        });
      } else if (person.relation === "child") {
        this.edges.push({
          data: {
            source: person.linkedPersonId,
            target: newId,
            label: "Parent",
          },
        });
      }
    },
    addMarriage(marriage) {
      const newId = `couple-${this.couples.length + 1}`;
      this.couples.push({ id: newId, ...marriage });
      this.nodes.push({
        data: {
          id: newId,
          label: `${
            this.persons.find((p) => p.id === marriage.fatherId).name
          } \n${this.persons.find((p) => p.id === marriage.motherId).name}`,
          isCouple: true,
          father: this.persons.find((p) => p.id === marriage.fatherId).name,
          mother: this.persons.find((p) => p.id === marriage.motherId).name,
        },
      });
      this.edges.push(
        { data: { source: marriage.fatherId, target: newId, label: "Couple" } },
        { data: { source: marriage.motherId, target: newId, label: "Couple" } }
      );
    },
  },
});
