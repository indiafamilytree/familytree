import { strict as assert } from "assert";
import { setActivePinia, createPinia } from "pinia";
import { useFamilyTreeStore } from "../../stores/family-tree-store/index.js";

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

  it("should add a mother to the family tree", function () {
    const mother = {
      name: "Jane Doe",
      gender: "female",
      relation: "mother",
      linkedPersonId: "person-1",
    };
    familyTreeStore.addPerson(mother);

    const janeDoe = familyTreeStore.persons.find((p) => p.name === "Jane Doe");
    assert.ok(janeDoe, "Jane Doe should be added");
    assert.strictEqual(janeDoe.name, mother.name, "Name should match");
    assert.strictEqual(janeDoe.gender, mother.gender, "Gender should match");
    assert.strictEqual(
      janeDoe.relation,
      mother.relation,
      "Relation should match"
    );
    assert.strictEqual(
      janeDoe.linkedPersonId,
      mother.linkedPersonId,
      "Linked Person ID should match"
    );

    const family = familyTreeStore.families.find(
      (f) => f.motherId === janeDoe.id
    );
    assert.ok(family, "A family should be created");
    assert.strictEqual(
      family.motherId,
      janeDoe.id,
      "Family motherId should match"
    );
    assert.strictEqual(family.fatherId, null, "Family fatherId should be null");

    const familyNodeId = `family-1`;

    const motherToFamilyEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === janeDoe.id &&
        e.data.target === familyNodeId &&
        e.data.label === "Mother"
    );

    const familyToChildEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === familyNodeId &&
        e.data.target === "person-1" &&
        e.data.label === "Son" // Correct label for mother
    );

    assert.ok(motherToFamilyEdge, "Mother to family edge should be created");
    assert.ok(familyToChildEdge, "Family to child edge should be created");
  });

  it("should add a father to an existing family with mother and kids", function () {
    // Add a mother first
    let logging = false;
    familyTreeStore.addPerson(
      {
        name: "Jane Doe",
        gender: "female",
        relation: "mother",
        linkedPersonId: "person-1",
      },
      logging
    );

    // Now add a father
    const father = {
      name: "John Smith",
      gender: "male",
      relation: "father",
      linkedPersonId: "person-1",
    };
    familyTreeStore.addPerson(father, logging);

    // Assertions
    const families = familyTreeStore.families;
    assert.strictEqual(families.length, 1, "Only one family should exist");

    const family = families[0];
    assert.strictEqual(
      family.fatherId,
      "person-3",
      "Father ID should be correct"
    ); // Assuming father is person-3
    assert.strictEqual(
      family.motherId,
      "person-2",
      "Mother ID should be correct"
    );
    assert.deepStrictEqual(
      family.childrenIds,
      ["person-1"],
      "Children IDs should be correct"
    );
  });

  it("should add a mother to an existing family with father and kids", function () {
    // Add a father first
    familyTreeStore.addPerson({
      name: "John Smith",
      gender: "male",
      relation: "father",
      linkedPersonId: "person-1",
    });

    // Now add a mother
    const mother = {
      name: "Jane Doe",
      gender: "female",
      relation: "mother",
      linkedPersonId: "person-1",
    };
    familyTreeStore.addPerson(mother);

    // Assertions
    const families = familyTreeStore.families;
    assert.strictEqual(families.length, 1, "Only one family should exist");

    const family = families[0];
    assert.strictEqual(
      family.fatherId,
      "person-2",
      "Father ID should be correct"
    );
    assert.strictEqual(
      family.motherId,
      "person-3",
      "Mother ID should be correct"
    ); // Assuming mother is person-3
    assert.deepStrictEqual(
      family.childrenIds,
      ["person-1"],
      "Children IDs should be correct"
    );
  });

  it("should add a wife (mother) to an existing father-son family", function () {
    // Add a father first
    let logging = false;
    familyTreeStore.addPerson(
      {
        name: "John Smith",
        gender: "male",
        relation: "father",
        linkedPersonId: "person-1", // Linked to the root person (son)
      },
      logging
    );

    // Add a wife (mother) linked to the father
    const wife = {
      name: "Jane Doe",
      gender: "female",
      relation: "wife",
      linkedPersonId: "person-2", // Linked to the father (person-2)
    };
    familyTreeStore.addPerson(wife, logging);

    // Assertions
    const families = familyTreeStore.families;
    assert.strictEqual(families.length, 1, "Only one family should exist");

    const family = families[0];
    assert.strictEqual(
      family.fatherId,
      "person-2",
      "Father ID should be correct"
    );
    assert.strictEqual(
      family.motherId,
      "person-3",
      "Mother ID should be correct"
    );
    assert.deepStrictEqual(
      family.childrenIds,
      ["person-1"],
      "Children IDs should be correct"
    );
  });

  it("should add a son without requiring a mother", function () {
    let logging = true;
    const son = {
      name: "Peter Doe",
      gender: "male",
      relation: "son",
      linkedPersonId: "person-1", // Linked to the root person (father)
    };
    familyTreeStore.addPerson(son, logging);

    // Assertions:
    const peterDoe = familyTreeStore.persons.find(
      (p) => p.name === "Peter Doe"
    );
    assert.ok(peterDoe, "Peter Doe should be added");

    const family = familyTreeStore.families.find((f) =>
      f.childrenIds.includes(peterDoe.id)
    );
    assert.ok(family, "A family should be created");
    assert.strictEqual(
      family.fatherId,
      "person-1",
      "Father ID should be correct"
    );
    assert.strictEqual(family.motherId, null, "Mother ID should be null"); // Mother is not added
    assert.ok(
      family.childrenIds.includes(peterDoe.id),
      "Son should be in childrenIds"
    );

    const familyNodeId = `family-1`; // Assuming only one family at this point

    const familyToSonEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === familyNodeId &&
        e.data.target === peterDoe.id &&
        e.data.label === "Son"
    );
    assert.ok(familyToSonEdge, "Family to son edge should be created");
  });

  it("should create only one family when adding a son and a daughter to the root person", function () {
    // Add a son linked to the root person
    const son = {
      name: "Peter Doe",
      gender: "male",
      relation: "son",
      linkedPersonId: "person-1", // Linked to the root person (father)
    };
    familyTreeStore.addPerson(son);

    // Add a daughter linked to the root person
    const daughter = {
      name: "Jane Doe",
      gender: "female",
      relation: "daughter",
      linkedPersonId: "person-1", // Linked to the root person (father)
    };
    familyTreeStore.addPerson(daughter);

    // Assertions:
    const families = familyTreeStore.families;
    assert.strictEqual(families.length, 1, "Only one family should exist");

    const family = families[0];
    assert.strictEqual(
      family.fatherId,
      "person-1",
      "Father ID should be correct"
    );
    assert.strictEqual(family.motherId, null, "Mother ID should be null");
    assert.deepStrictEqual(
      family.childrenIds,
      ["person-2", "person-3"],
      "Children IDs should be correct"
    );
  });
});
