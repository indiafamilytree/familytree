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

    const familyNodeId = family.id;

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
        e.data.label === "Son"
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
    let logging = false; // Consider adding logging to your test cases
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
    );
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

    // Check for correct edges
    const fatherToFamilyEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === "person-3" &&
        e.data.target === family.id &&
        e.data.label === "Father"
    );
    assert.ok(fatherToFamilyEdge, "Father to family edge should exist");

    const motherToFamilyEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === "person-2" &&
        e.data.target === family.id &&
        e.data.label === "Mother"
    );
    assert.ok(motherToFamilyEdge, "Mother to family edge should exist");

    const familyToChildEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === family.id &&
        e.data.target === "person-1" &&
        e.data.label === "Son" // Assuming the child is a son
    );
    assert.ok(familyToChildEdge, "Family to child edge should exist");

    // Check family node label
    const familyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === family.id
    );
    assert.strictEqual(
      familyNode.data.label,
      "John Smith\nJane Doe",
      "Family node label should be correct"
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
    familyTreeStore.addPerson({
      name: "John Smith",
      gender: "male",
      relation: "father",
      linkedPersonId: "person-1", // Linked to the root person (son)
    });

    // Add a wife (mother) linked to the father
    const wife = {
      name: "Jane Doe",
      gender: "female",
      relation: "wife",
      linkedPersonId: "person-2", // Linked to the father (person-2)
    };
    familyTreeStore.addPerson(wife);

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

    // Check for correct edges
    const fatherToFamilyEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === "person-2" &&
        e.data.target === family.id &&
        e.data.label === "Father"
    );
    assert.ok(fatherToFamilyEdge, "Father to family edge should exist");

    const motherToFamilyEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === "person-3" &&
        e.data.target === family.id &&
        e.data.label === "Mother"
    );
    assert.ok(motherToFamilyEdge, "Mother to family edge should exist");

    const familyToChildEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === family.id &&
        e.data.target === "person-1" &&
        e.data.label === "Son"
    );
    assert.ok(familyToChildEdge, "Family to child edge should exist");

    // Check family node label
    const familyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === family.id
    );
    assert.strictEqual(
      familyNode.data.label,
      "John Smith\nJane Doe",
      "Family node label should be correct"
    );
  });

  it("should add a son without requiring a mother", function () {
    let logging = false;
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
    let logging = false;
    // Add a son linked to the root person
    const son = {
      name: "Peter Doe",
      gender: "male",
      relation: "son",
      linkedPersonId: "person-1", // Linked to the root person (father)
    };
    familyTreeStore.addPerson(son, logging);

    // Add a daughter linked to the root person
    const daughter = {
      name: "Jane Doe",
      gender: "female",
      relation: "daughter",
      linkedPersonId: "person-1", // Linked to the root person (father)
    };
    familyTreeStore.addPerson(daughter, logging);

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

  it("should correctly add father of the wife without merging families or incorrect edges", function () {
    // 1. Add the wife of the root person
    let logging = false;
    const wife = {
      name: "Selvi", // Assuming "Selvi" is the wife's name
      gender: "female",
      relation: "wife",
      linkedPersonId: "person-1", // Linked to the root person
    };
    familyTreeStore.addPerson(wife, logging);

    // 2. Add the father of the wife
    const fatherOfWife = {
      name: "Goindasamy", // Assuming "Goindasamy" is the father's name
      gender: "male",
      relation: "father",
      linkedPersonId: "person-2", // Linked to the wife (person-2)
    };
    familyTreeStore.addPerson(fatherOfWife, logging);

    // Assertions:

    // Check that there are two families
    assert.strictEqual(
      familyTreeStore.families.length,
      2,
      "Two families should exist"
    );

    // Find the family of the root person
    const rootPersonFamily = familyTreeStore.families.find(
      (f) => f.fatherId === "person-1"
    );
    assert.ok(rootPersonFamily, "Root person's family should exist");

    // Find the family of the wife's father
    const wifeFatherFamily = familyTreeStore.families.find(
      (f) => f.fatherId === "person-3"
    );
    assert.ok(wifeFatherFamily, "Wife's father's family should exist");

    // Check that the family node labels are correct
    const rootFamilyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === rootPersonFamily.id
    );
    assert.strictEqual(
      rootFamilyNode.data.label,
      "Kannaiyan\nSelvi", // Assuming root person's name is "Kannaiyan"
      "Root person's family label should be correct"
    );

    const wifeFatherFamilyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === wifeFatherFamily.id
    );
    assert.strictEqual(
      wifeFatherFamilyNode.data.label,
      "Goindasamy",
      "Wife's father's family label should be correct"
    );

    // Check for the correct edges
    const fatherEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === "person-3" &&
        e.data.target === wifeFatherFamily.id &&
        e.data.label === "Father"
    );
    assert.ok(fatherEdge, "Father edge should exist");

    const daughterEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === wifeFatherFamily.id &&
        e.data.target === "person-2" &&
        e.data.label === "Daughter"
    );
    assert.ok(daughterEdge, "Daughter edge should exist");
  });

  it("should correctly add mother of the wife after adding wife and father of wife", function () {
    // 1. Add the wife of the root person
    let logging = false;
    const wife = {
      name: "Selvi", // Wife's name
      gender: "female",
      relation: "wife",
      linkedPersonId: "person-1", // Linked to the root person
    };
    familyTreeStore.addPerson(wife, logging);

    // 2. Add the father of the wife
    const fatherOfWife = {
      name: "Goindasamy", // Father's name
      gender: "male",
      relation: "father",
      linkedPersonId: "person-2", // Linked to the wife
    };
    familyTreeStore.addPerson(fatherOfWife, logging);

    // 3. Add the mother of the wife
    const motherOfWife = {
      name: "WifeMother", // Mother's name
      gender: "female",
      relation: "mother",
      linkedPersonId: "person-2", // Linked to the wife
    };
    familyTreeStore.addPerson(motherOfWife, logging);

    // Assertions:

    // Check that there are only two families
    assert.strictEqual(
      familyTreeStore.families.length,
      2,
      "Two families should exist"
    );

    // Find the family of the root person
    const rootPersonFamily = familyTreeStore.families.find(
      (f) => f.fatherId === "person-1" && f.motherId === "person-2"
    );
    assert.ok(rootPersonFamily, "Root person's family should exist");

    // Check that the root person's family doesn't have children
    assert.strictEqual(
      rootPersonFamily.childrenIds.length,
      0,
      "Root person's family should not have children"
    );

    // Find the family of the wife's parents
    const wifeParentsFamily = familyTreeStore.families.find(
      (f) => f.fatherId === "person-3" && f.motherId === "person-4"
    );
    assert.ok(wifeParentsFamily, "Wife's parents' family should exist");

    // Check that the family node label is correct
    const wifeParentsFamilyNode = familyTreeStore.nodes.find(
      (n) => n.data.id === wifeParentsFamily.id
    );
    assert.strictEqual(
      wifeParentsFamilyNode.data.label,
      "Goindasamy\nWifeMother",
      "Wife's parents' family label should be correct"
    );

    // Check for correct edges
    const motherEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === "person-4" &&
        e.data.target === wifeParentsFamily.id &&
        e.data.label === "Mother"
    );
    assert.ok(motherEdge, "Mother edge should exist");

    const daughterEdge = familyTreeStore.edges.find(
      (e) =>
        e.data.source === wifeParentsFamily.id &&
        e.data.target === "person-2" &&
        e.data.label === "Daughter"
    );
    assert.ok(daughterEdge, "Daughter edge should exist");
  });
});
