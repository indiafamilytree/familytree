<!-- App.vue -->
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
import { ref, watch } from "vue";
import FamilyChart from "@/components/FamilyChart.vue";
import SidePanel from "@/components/SidePanel.vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

const selectedNodeData = ref(null);
const familyChartRef = ref(null);
const store = useFamilyTreeStore();

// Define showSidePanel so that it is available in the template.
const showSidePanel = ref(true);

function selectNode(nodeData) {
  selectedNodeData.value = nodeData;
}

function closeSidePanel() {
  selectedNodeData.value = null;
}

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

/* Adjust the width of the chart to account for the wider side panel */
.family-chart {
  width: calc(100% - 400px); /* Changed from 350px to 400px */
}

.side-panel {
  width: 400px; /* Increased width for larger forms */
  overflow-y: auto;
}
</style>
