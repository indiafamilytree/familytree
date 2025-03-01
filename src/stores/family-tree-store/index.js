// ./src/stores/family-tree-store/index.js
import { defineStore } from "pinia";
import { getUrl, uploadData } from "aws-amplify/storage";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";
import { initializeRootPerson } from "./actions/initializeRootPerson.js";
import { addPerson } from "./actions/addPerson.js";
import { importPersons } from "./actions/importPersons.js";
import { addFamilyMembers } from "./actions/addFamilyMembers.js";
import debug from "debug";

// Create loggers for different parts.
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
      logTransform("Starting transformation.");
      // Map Persons using actual keys.
      const persons = amplifyData.Persons.map((p) => ({
        id: p.id, // using 'id'
        name: p.name, // using 'name'
        gender: p.gender,
      }));
      logTransform("Mapped persons:", persons);
      const personNodes = persons.map((p) => ({
        data: { id: p.id, label: p.name, gender: p.gender },
      }));

      // Map Families (adjust keys if necessary)
      const families = amplifyData.Families.map((f) => ({
        id: f.id || f.familyId,
        husbandId: null,
        wifeId: null,
        sons: [],
        daughters: [],
      }));
      logTransform("Mapped families:", families);
      const familyNodes = families.map((f) => ({
        data: { id: f.id, label: "Family", isFamily: true },
      }));

      // Build edges from FamilyPerson join table.
      const edges = amplifyData.FamilyPerson.map((fp) => {
        const person = persons.find(
          (p) => p.id === fp.personId || p.id === fp.person
        );
        if (!person) {
          logTransform("No person found for record:", fp);
          return;
        }
        if (fp.role === "parent") {
          const label = person.gender === "male" ? "Father" : "Mother";
          return {
            data: {
              source: fp.personId || fp.person,
              target: fp.familyId || fp.family,
              label,
            },
          };
        } else if (fp.role === "child") {
          const label = person.gender === "male" ? "Son" : "Daughter";
          return {
            data: {
              source: fp.familyId || fp.family,
              target: fp.personId || fp.person,
              label,
            },
          };
        }
      }).filter((e) => e !== undefined);
      logTransform("Built edges:", edges);

      amplifyData.FamilyPerson.forEach((fp) => {
        const person = persons.find(
          (p) => p.id === fp.personId || p.id === fp.person
        );
        const family = families.find(
          (f) => f.id === fp.familyId || f.id === fp.family
        );
        if (!person || !family) return;
        if (fp.role === "parent") {
          if (person.gender === "male") {
            family.husbandId = person.id;
          } else {
            family.wifeId = person.id;
          }
        } else if (fp.role === "child") {
          if (person.gender === "male") {
            family.sons.push(person.id);
          } else {
            family.daughters.push(person.id);
          }
        }
      });
      logTransform("Updated families:", families);

      // Update store state.
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

        const familyPersons = this.edges.map((edge) => {
          if (edge.data.source.startsWith("person")) {
            return {
              familyId: edge.data.target,
              personId: edge.data.source,
              role: "parent",
            };
          } else {
            return {
              familyId: edge.data.source,
              personId: edge.data.target,
              role: "child",
            };
          }
        });
        const amplifyData = {
          Persons: this.persons,
          Families: this.families,
          FamilyPerson: familyPersons,
        };
        logSave("Amplify data to save:", amplifyData);
        const file = new Blob([JSON.stringify(amplifyData)], {
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
