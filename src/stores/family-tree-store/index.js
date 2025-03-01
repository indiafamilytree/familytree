// ./src/stores/family-tree-store/index.js
import { defineStore } from "pinia";
import { getUrl, uploadData } from "aws-amplify/storage";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";
import { initializeRootPerson } from "./actions/initializeRootPerson.js";
import { addPerson } from "./actions/addPerson.js";
import { importPersons } from "./actions/importPersons.js";
import { addFamilyMembers } from "./actions/addFamilyMembers.js";

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
        console.log("[loadAmplifyDataFromS3] Starting load process.");
        const user = await getCurrentUser();
        console.log("[loadAmplifyDataFromS3] Current user:", user);
        const attributes = await fetchUserAttributes();
        console.log("[loadAmplifyDataFromS3] User attributes:", attributes);
        const userId = attributes.sub || "default";
        console.log("[loadAmplifyDataFromS3] Using userId:", userId);
        const path = `entity-files/${userId}/amplify-tree.json`;
        console.log("[loadAmplifyDataFromS3] S3 path:", path);

        // getUrl returns an object, so extract the URL string.
        const urlResult = await getUrl({
          path,
          options: {
            validateObjectExistence: true,
          },
        });
        const presignedUrl = urlResult.url;
        console.log(
          "[loadAmplifyDataFromS3] Obtained presigned URL:",
          presignedUrl
        );

        const response = await fetch(presignedUrl);
        console.log(
          "[loadAmplifyDataFromS3] Fetch response status:",
          response.status
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch file, status: ${response.status}`);
        }
        const text = await response.text();
        console.log("[loadAmplifyDataFromS3] File content received:", text);

        // Check if the content looks like HTML.
        if (text.trim().startsWith("<!DOCTYPE")) {
          console.warn(
            "[loadAmplifyDataFromS3] File does not exist or returned HTML. Using default empty tree."
          );
          return; // Optionally initialize with an empty tree.
        }
        const amplifyData = JSON.parse(text);
        console.log(
          "[loadAmplifyDataFromS3] Parsed Amplify data:",
          amplifyData
        );
        this.transformAmplifyDataToStore(amplifyData);
        console.log(
          "[loadAmplifyDataFromS3] Amplify data loaded and transformed successfully."
        );
      } catch (error) {
        console.error(
          "[loadAmplifyDataFromS3] Error loading Amplify data from S3:",
          error
        );
      }
    },
    transformAmplifyDataToStore(amplifyData) {
      console.log("[transformAmplifyDataToStore] Starting transformation.");
      // Map Amplify Persons using the actual keys (id, name, gender)
      const persons = amplifyData.Persons.map((p) => ({
        id: p.id, // instead of p.personId
        name: p.name, // instead of p.firstName
        gender: p.gender,
      }));
      console.log("[transformAmplifyDataToStore] Mapped persons:", persons);
      const personNodes = persons.map((p) => ({
        data: { id: p.id, label: p.name, gender: p.gender },
      }));

      // Map Amplify Families (adjust keys if needed)
      const families = amplifyData.Families.map((f) => ({
        id: f.id || f.familyId, // use f.id if available, or fallback to f.familyId
        husbandId: null,
        wifeId: null,
        sons: [],
        daughters: [],
      }));
      console.log("[transformAmplifyDataToStore] Mapped families:", families);
      const familyNodes = families.map((f) => ({
        data: { id: f.id, label: "Family", isFamily: true },
      }));

      // Build edges from the FamilyPerson join table.
      const edges = amplifyData.FamilyPerson.map((fp) => {
        const person = persons.find(
          (p) => p.id === fp.personId || p.id === fp.person
        );
        if (!person) {
          console.warn(
            "[transformAmplifyDataToStore] No person found for record:",
            fp
          );
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
      console.log("[transformAmplifyDataToStore] Built edges:", edges);

      // Update each family object based on FamilyPerson records.
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
      console.log("[transformAmplifyDataToStore] Updated families:", families);

      // Update the store state.
      this.persons = persons;
      this.families = families;
      this.nodes = [...personNodes, ...familyNodes];
      this.edges = edges;
      if (persons.length > 0) {
        this.rootPerson = persons[0];
      }
      console.log("[transformAmplifyDataToStore] Store state updated.");
    },
    async saveTreeToS3() {
      try {
        console.log("[saveTreeToS3] Starting save process.");
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const userId = attributes.sub || "default";
        console.log("[saveTreeToS3] Using userId:", userId);
        const path = `entity-files/${userId}/amplify-tree.json`;
        console.log("[saveTreeToS3] S3 path:", path);

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
        console.log("[saveTreeToS3] Amplify data to save:", amplifyData);
        const file = new Blob([JSON.stringify(amplifyData)], {
          type: "application/json",
        });
        const result = await uploadData({
          path,
          data: file,
        }).result;
        console.log("[saveTreeToS3] Succeeded: ", result);
      } catch (error) {
        console.error("[saveTreeToS3] Error saving family tree to S3:", error);
      }
    },
  },
});
