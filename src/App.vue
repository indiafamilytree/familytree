<template>
  <div class="app-container">
    <FamilyChart
      @node-selected="selectNode"
      :selected-node-id="selectedNodeData?.id"
      ref="familyChartRef"
      class="family-chart"
    />
    <SidePanel
      v-if="showSidePanel"
      :selectedNodeData="selectedNodeData"
      @close="closeSidePanel"
      class="side-panel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import FamilyChart from "@/components/FamilyChart.vue";
import SidePanel from "@/components/SidePanel.vue";

const selectedNodeData = ref(null);
const familyChartRef = ref(null);
const store = useFamilyTreeStore();

onMounted(() => {
  // Initialize the root person only if the store is empty
  if (store.persons.length === 0) {
    store.initializeRootPerson({
      name: "Kannaiyan",
      gender: "male",
    });
  }
});

const showSidePanel = ref(true); // Initially show the side panel

const selectNode = (nodeData) => {
  // Check if clicking on the same node as currently selected
  if (nodeData?.id === selectedNodeData.value?.id) {
    selectedNodeData.value = null; // Deselect if clicking the same node
    showSidePanel.value = true; // Show panel for deselected state, in this specific scenario its for adding a new person.
  } else {
    selectedNodeData.value = nodeData;
    showSidePanel.value = true; // Ensure the side panel is shown when a node is selected
  }
};

const closeSidePanel = () => {
  selectedNodeData.value = null;
  showSidePanel.value = true; // Show the side panel for adding new person to the tree, even after closing from close button
};

watch(
  () => selectedNodeData.value,
  (newValue) => {
    if (newValue === null && familyChartRef.value?.cy) {
      familyChartRef.value.cy.nodes().unselect();
    }
  }
);
</script>

<style>
.app-container {
  display: flex;
  height: 100vh;
}

.family-chart {
  /* Remove flex-grow  and use width instead*/
  width: calc(100% - 350px); /* Adjust 350px if your side panel width changes */
}

.side-panel {
  width: 350px; /* Fixed width for the side panel */
  overflow-y: auto;
}
</style>
