// ./src/stores/family-tree-store/index.js
import { defineStore } from "pinia";
import { getUrl, uploadData } from "aws-amplify/storage";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";
import { initializeRootPerson } from "./actions/initializeRootPerson.js";
import { addPerson } from "./actions/addPerson.js";
import { importPersons } from "./actions/importPersons.js";
import { addFamilyMembers } from "./actions/addFamilyMembers.js";
import debug from "debug";

const logLoad = debug("familyTree:load");
const logTransform = debug("familyTree:transform");
const logSave = debug("familyTree:save");

export const useFamilyTreeStore = defineStore("familyTree", {
  state: () => ({
    persons: [],
    families: [],
    nodes: [],
    edges: [],
    rootPerson: null,
  }),
  actions: {
    initializeRootPerson,
    addPerson,
    importPersons,
    addFamilyMembers,
    async loadAmplifyDataFromS3() {
      try {
        logLoad("Starting load process.");
        const user = await getCurrentUser();
        logLoad("Current user:", user);
        const attributes = await fetchUserAttributes();
        logLoad("User attributes:", attributes);
        const userId = attributes.sub || "default";
        logLoad("Using userId:", userId);
        const path = `entity-files/${userId}/amplify-tree.json`;
        logLoad("S3 path:", path);

        const urlResult = await getUrl({
          path,
          options: { validateObjectExistence: true },
        });
        const presignedUrl = urlResult.url;
        logLoad("Obtained presigned URL:", presignedUrl);

        const response = await fetch(presignedUrl);
        logLoad("Fetch response status:", response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch file, status: ${response.status}`);
        }
        const text = await response.text();
        logLoad("File content received:", text);
        if (text.trim().startsWith("<!DOCTYPE")) {
          logLoad(
            "File does not exist or returned HTML. Using default empty tree."
          );
          return;
        }
        const amplifyData = JSON.parse(text);
        logLoad("Parsed Amplify data:", amplifyData);
        this.transformAmplifyDataToStore(amplifyData);
        logLoad("Amplify data loaded and transformed successfully.");
      } catch (error) {
        logLoad("Error loading Amplify data from S3:", error);
      }
    },

    transformAmplifyDataToStore(amplifyData) {
      logTransform("Starting transformation of new model format.");

      // Map Persons: use "personId" as id and "firstName" as name.
      const persons = amplifyData.Persons.map((p) => ({
        id: p.personId,
        name: p.firstName,
        gender: p.gender,
      }));
      logTransform("Mapped persons:", persons);

      const personNodes = persons.map((p) => ({
        data: { id: p.id, label: p.name, gender: p.gender },
      }));

      // Map Families: each family now has a "familyId", "familySignature", and "members" array.
      const families = amplifyData.Families.map((f) => ({
        id: f.familyId,
        familySignature: f.familySignature || "",
        members: f.members || [], // Each member is { personId, relationship }
      }));
      logTransform("Mapped families:", families);

      const familyNodes = families.map((f) => ({
        data: { id: f.id, label: "Family", isFamily: true },
      }));

      // Build edges based on family members.
      // For each family, for each member, create an edge:
      // - If the member's relationship is "parent": edge from Person -> Family (with label based on gender)
      // - If "child": edge from Family -> Person (with label based on gender)
      const edges = [];
      families.forEach((f) => {
        f.members.forEach((member) => {
          const person = persons.find((p) => p.id === member.personId);
          if (!person) {
            logTransform("No person found for member:", member);
            return;
          }
          if (member.relationship === "parent") {
            const label = person.gender === "male" ? "Father" : "Mother";
            edges.push({
              data: {
                source: person.id,
                target: f.id,
                label,
              },
            });
          } else if (member.relationship === "child") {
            const label = person.gender === "male" ? "Son" : "Daughter";
            edges.push({
              data: {
                source: f.id,
                target: person.id,
                label,
              },
            });
          } else {
            // Fallback: simply use the stored relationship.
            edges.push({
              data: {
                source: person.id,
                target: f.id,
                label: member.relationship,
              },
            });
          }
        });
      });
      logTransform("Built edges:", edges);

      // Update the store state.
      this.persons = persons;
      this.families = families;
      this.nodes = [...personNodes, ...familyNodes];
      this.edges = edges;
      if (persons.length > 0) {
        this.rootPerson = persons[0];
      }
      logTransform("Store state updated.");
    },
    async saveTreeToS3() {
      try {
        logSave("Starting save process.");
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const userId = attributes.sub || "default";
        logSave("Using userId:", userId);
        const path = `entity-files/${userId}/amplify-tree.json`;
        logSave("S3 path:", path);

        // Transform Persons: Map store persons to the new format.
        const persons = this.persons.map((person) => ({
          personId: person.id, // old "id" becomes personId
          firstName: person.name, // old "name" becomes firstName
          gender: person.gender,
        }));

        // Transform Families: Convert the explicit fields into a "members" array.
        const families = this.families.map((family) => {
          const members = [];

          // For each parent role, push a member with role "parent".
          if (family.husbandId) {
            members.push({
              personId: family.husbandId,
              relationship: "parent",
            });
          }
          if (family.wifeId) {
            members.push({ personId: family.wifeId, relationship: "parent" });
          }
          // For each child, push a member with role "child".
          if (family.sons && Array.isArray(family.sons)) {
            family.sons.forEach((sonId) => {
              members.push({ personId: sonId, relationship: "child" });
            });
          }
          if (family.daughters && Array.isArray(family.daughters)) {
            family.daughters.forEach((daughterId) => {
              members.push({ personId: daughterId, relationship: "child" });
            });
          }

          return {
            familyId: family.id, // use the existing family id
            familySignature: family.familySignature || "",
            members,
          };
        });

        // Build the final data object in the new format.
        const amplifyData = {
          Persons: persons,
          Families: families,
        };

        logSave("Amplify data to save:", amplifyData);
        const file = new Blob([JSON.stringify(amplifyData, null, 2)], {
          type: "application/json",
        });
        const result = await uploadData({
          path,
          data: file,
        }).result;
        logSave("Succeeded:", result);
      } catch (error) {
        logSave("Error saving family tree to S3:", error);
      }
    },
  },
});
