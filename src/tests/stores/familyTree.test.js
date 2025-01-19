import { strict as assert } from "assert";
import { setActivePinia, createPinia } from "pinia";
import { useFamilyTreeStore } from "../../stores/familyTree.js";

describe("FamilyTree", function () {
  let familyTreeStore;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(function () {
    process.env.NODE_ENV = "development";
    setActivePinia(createPinia());
    familyTreeStore = useFamilyTreeStore();
    familyTreeStore.initializeRootPerson({
      name: "Kannaiyan",
      gender: "male",
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should add a father to the family tree", function () {
    const father = {
      name: "John Smith",
      gender: "male",
      relation: "father",
      linkedPersonId: "person-1",
    };
    familyTreeStore.addPerson(father);

    const johnSmith = familyTreeStore.persons.find(
      (p) => p.name === "John Smith"
    );

    assert.ok(johnSmith, "John Smith should be added");
    assert.strictEqual(johnSmith.name, father.name, "Name should match");
    assert.strictEqual(johnSmith.gender, father.gender, "Gender should match");
    assert.strictEqual(
      johnSmith.relation,
      father.relation,
      "Relation should match"
    );
    assert.strictEqual(
      johnSmith.linkedPersonId,
      father.linkedPersonId,
      "Linked Person ID should match"
    );

    const family = familyTreeStore.families.find(
      (f) => f.fatherId === johnSmith.id
    );

    assert.ok(family, "A family should be created");
    assert.strictEqual(
      family.fatherId,
      johnSmith.id,
      "Family fatherId should match"
    );
    assert.strictEqual(family.motherId, null, "Family motherId should be null");

    const familyNodeId = `family-1`;

    const fatherToFamilyEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === johnSmith.id &&
        e.data.target === familyNodeId &&
        e.data.label === "Father"
    );

    const familyToChildEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === familyNodeId &&
        e.data.target === "person-1" &&
        e.data.label === "Son" // Correct label
    );

    assert.ok(fatherToFamilyEdge, "Father to family edge should be created");
    assert.ok(familyToChildEdge, "Family to child edge should be created");
  });
});
