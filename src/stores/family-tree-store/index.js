// ./src/stores/family-tree-store/index.js
import { defineStore } from "pinia";
import { getUrl, uploadData } from "aws-amplify/storage";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";
import { initializeRootPerson } from "./actions/initializeRootPerson.js";
import { addPerson } from "./actions/addPerson.js";
import { importPersons } from "./actions/importPersons.js";
import { addFamilyMembers } from "./actions/addFamilyMembers.js";
import debug from "debug";
import { customAlphabet } from "nanoid";
import { debounce } from "lodash-es";
import md5 from "md5";

// Import the per‑record batch upsert and hash loader functions from dataService.
import {
  loadHashesFromS3,
  batchUpsertPersons,
  batchUpsertFamilies,
} from "@/services/dataService.js";

import { createPerson } from "@/services/apiService.js";

const logLoad = debug("familyTree:load");
const logTransform = debug("familyTree:transform");
const logSave = debug("familyTree:save");

// Create a 16‑character ID generator using lowercase alphanumerics.
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

/**
 * Compute max generation with a BFS approach.
 * @param {Array} persons - each person has { id, name, gender }
 * @param {Array} families - each family has { id, members: [ { personId, relationship } ] }
 * @returns {Number} the maximum generation found
 */
function computeMaxGenerationBFS(persons, families) {
  const childSet = new Set();
  families.forEach((fam) => {
    fam.members
      .filter((m) => m.relationship === "child")
      .forEach((m) => childSet.add(m.personId));
  });

  const adjacency = {};
  persons.forEach((p) => {
    adjacency[p.id] = [];
  });
  families.forEach((fam) => {
    const parentIds = fam.members
      .filter((m) => m.relationship === "parent")
      .map((m) => m.personId);
    const childIds = fam.members
      .filter((m) => m.relationship === "child")
      .map((m) => m.personId);
    parentIds.forEach((parentId) => {
      adjacency[parentId].push(...childIds);
    });
  });

  let maxGeneration = 1;
  const generationMap = {};
  const ancestors = persons.filter((p) => !childSet.has(p.id));
  for (const ancestor of ancestors) {
    const queue = [{ personId: ancestor.id, generation: 1 }];
    while (queue.length) {
      const { personId, generation } = queue.shift();
      if (generationMap[personId] && generationMap[personId] >= generation) {
        continue;
      }
      generationMap[personId] = generation;
      if (generation > maxGeneration) {
        maxGeneration = generation;
      }
      adjacency[personId].forEach((childId) => {
        queue.push({ personId: childId, generation: generation + 1 });
      });
    }
  }
  return maxGeneration;
}

export const useFamilyTreeStore = defineStore("familyTree", {
  state: () => ({
    persons: [],
    families: [],
    nodes: [],
    edges: [],
    rootPerson: null,
    // Overall hash of the families and persons (used to trigger S3 writes)
    lastSavedHash: null,
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
        // Load per‑record hashes from the S3 data (if present).
        loadHashesFromS3(amplifyData);
        // Compute and store the overall hash of the store.
        this.lastSavedHash = hashString(
          JSON.stringify({ families: this.families, persons: this.persons })
        );
        logLoad("Initial overall store hash computed:", this.lastSavedHash);
        logLoad("Amplify data loaded and transformed successfully.");
      } catch (error) {
        logLoad("Error loading Amplify data from S3:", error);
      }
    },

    transformAmplifyDataToStore(amplifyData) {
      logTransform("Starting transformation of new model format.");

      console.log(amplifyData);

      // Map Persons
      const persons = amplifyData.Persons.map((p) => ({
        id: p.personId || p.id,
        personId: p.personId || p.id,
        name: p.name,
        gender: p.gender,
      }));
      logTransform("Mapped persons:", persons);

      const personNodes = persons.map((p) => ({
        data: { id: p.id, label: p.name, gender: p.gender },
      }));

      // Map Families: parse the stored members JSON string back into an array.
      const families = amplifyData.Families.map((f) => ({
        id: f.familyId || f.id,
        familyId: f.familyId || f.id,
        familySignature: f.familySignature || "",
        members: f.members ? JSON.parse(f.members) : [],
      }));
      logTransform("Mapped families:", families);

      const familyNodes = families.map((f) => ({
        data: { id: f.id, label: "Family", isFamily: true },
      }));

      // Build edges based on family members.
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

        // Transform Persons
        const persons = this.persons.map((person) => ({
          id: person.id,
          personId: person.id,
          name: person.name,
          gender: person.gender,
        }));

        // Transform Families
        const families = this.families.map((family) => {
          let members = [];
          if (family.members && family.members.length > 0) {
            members = family.members;
          } else {
            this.edges.forEach((edge) => {
              if (
                edge.data.target === family.id &&
                edge.data.source.startsWith("person")
              ) {
                members.push({
                  personId: edge.data.source,
                  relationship: "parent",
                });
              }
              if (
                edge.data.source === family.id &&
                edge.data.target.startsWith("person")
              ) {
                members.push({
                  personId: edge.data.target,
                  relationship: "child",
                });
              }
            });
            members = Array.from(
              new Map(members.map((m) => [m.personId, m])).values()
            );
          }
          return {
            id: family.id,
            familyId: family.id,
            familySignature: family.familySignature || "",
            members: JSON.stringify(members),
          };
        });

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

    // New action: Update backend data using batch upsert.
    async updateBackendData() {
      try {
        console.log("Batch updating backend data...");
        // Use the batch upsert functions imported from dataService.
        console.log(this.persons, this.families);
        await batchUpsertPersons(this.persons);
        await batchUpsertFamilies(this.families);
      } catch (error) {
        console.error("Error updating backend data:", error);
      }
    },

    // New action: Calculate generation mapping.
    calculateGenerationMapping() {
      return computeMaxGenerationBFS(this.persons, this.families);
    },

    // New methods for generating IDs.
    getNewFamilyId() {
      return nanoid();
    },
    getNewPersonId() {
      return nanoid();
    },

    // New action: Initialize auto-save subscription with debounce and overall hash checking.
    initAutoSave() {
      // Helper: compute an overall hash for families and persons.
      const computeStoreHash = () =>
        hashString(
          JSON.stringify({ families: this.families, persons: this.persons })
        );

      const debouncedSave = debounce(() => {
        const newHash = computeStoreHash();
        if (this.lastSavedHash !== newHash) {
          // Call the backend batch upsert and then save the full tree to S3.
          this.updateBackendData();
          this.saveTreeToS3();
          this.lastSavedHash = newHash;
        }
      }, 1000); // Adjust delay (ms) as needed

      // Subscribe to mutations in the store.
      this.$subscribe((mutation, state) => {
        debouncedSave();
      });
    },
  },
});

function hashString(str) {
  let md5hash = md5(str);
  return md5hash;
}
