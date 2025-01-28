<template>
  <div class="side-panel">
    <div v-if="selectedPerson">
      <h3 class="form-heading">Edit Person: {{ selectedPerson.name }}</h3>
      <PersonNodeForm
        :personData="selectedPerson"
        @update:personData="updatePerson"
        @close="closePanel"
      />
    </div>
    <div v-else-if="selectedFamily">
      <h3 class="form-heading">Edit Family: {{ selectedFamily.label }}</h3>
      <FamilyNodeForm :familyData="selectedFamily" @close="closePanel" />
    </div>
    <div v-else-if="store.persons.length === 0">
      <h3 class="form-heading">Add Person</h3>
      <PersonForm />
    </div>
    <div v-else>
      <h3 class="form-heading">Select a node</h3>
    </div>
    <!-- ▼ New section at bottom for export/import -->
    <div class="export-import-actions">
      <button @click="downloadTree">Download Tree</button>

      <!-- A label wrapping a hidden file-input for import -->
      <label class="import-button">
        Import Tree
        <input
          type="file"
          @change="handleTreeImport"
          accept=".json"
          style="display: none"
        />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import PersonForm from "@/components/PersonForm.vue";
import PersonNodeForm from "@/components/PersonNodeForm.vue";
import FamilyNodeForm from "@/components/FamilyNodeForm.vue";

const props = defineProps({
  selectedNodeData: {
    type: Object,
    required: false,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const store = useFamilyTreeStore();
const selectedPerson = ref(null);
const selectedFamily = ref(null);

// 1) Download entire tree as JSON
function downloadTree() {
  const treeData = {
    persons: store.persons,
    families: store.families,
    nodes: store.nodes,
    edges: store.edges,
    rootPerson: store.rootPerson,
  };

  // Convert to JSON and create a download
  const jsonStr = JSON.stringify(treeData, null, 2);
  const dataUrl = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);

  const link = document.createElement("a");
  link.setAttribute("href", dataUrl);
  link.setAttribute("download", "family-tree.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2) Import entire tree from a chosen file
function handleTreeImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // parse JSON
      const importedTree = JSON.parse(e.target.result);

      // Clear or override your store, then fill from imported data:
      store.persons = importedTree.persons || [];
      store.families = importedTree.families || [];
      store.nodes = importedTree.nodes || [];
      store.edges = importedTree.edges || [];
      store.rootPerson = importedTree.rootPerson || null;

      // Optionally re-run your layout so it re-draws
      // For example, if you have a method in your FamilyChart that re-layouts
      // Or just rely on your watchers to do it

      console.log("Imported family tree:", importedTree);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
    }
  };
  reader.readAsText(file);

  // Reset the input so the same file can be chosen again if needed
  event.target.value = "";
}

watch(
  () => props.selectedNodeData,
  (newNodeData) => {
    console.log("Selected node data updated:", newNodeData);
    if (newNodeData) {
      if (newNodeData.isFamily) {
        selectedFamily.value = newNodeData;
        selectedPerson.value = null;
      } else {
        selectedPerson.value = store.persons.find(
          (p) => p.id === newNodeData.id
        );
        selectedFamily.value = null;
      }
    } else {
      selectedPerson.value = null;
      selectedFamily.value = null;
    }
  },
  { immediate: true }
);

function updatePerson(updatedPerson) {
  const personIndex = store.persons.findIndex((p) => p.id === updatedPerson.id);
  if (personIndex > -1) {
    store.persons[personIndex] = updatedPerson;
    const node = store.nodes.find((n) => n.data.id === updatedPerson.id);
    if (node) {
      node.data.label = updatedPerson.name;
    }
  }
}

function closePanel() {
  console.log("Closing panel");
  selectedPerson.value = null;
  selectedFamily.value = null;
  emit("close");
}
</script>

<style scoped>
.side-panel {
  width: 350px; /* Adjust width as needed, was 300 */
  height: 100vh;
  overflow-y: auto;
  border-left: 1px solid #ccc;
  padding: 1rem;
  background-color: #f8f8f8;
}

.form-heading {
  margin-top: 0; /* Remove default top margin */
  margin-bottom: 1rem;
}

.export-import-actions {
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: flex-end;
}

.import-button {
  /* Make the label look like a button */
  background-color: #007bff;
  color: #fff;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  user-select: none; /* Prevent text selection when clicking label */
}
.import-button:hover {
  background-color: #005fc7;
}
</style>
