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
import { ref, computed, onMounted } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import FamilyChart from "@/components/FamilyChart.vue";
import SidePanel from "@/components/SidePanel.vue";

const selectedNodeData = ref(null);
const familyChartRef = ref(null);
const store = useFamilyTreeStore();

onMounted(() => {
  if (familyChartRef.value) {
    familyChartRef.value.cy.on("unselect", "node", () => {
      if (!selectedNodeData.value) {
        closeSidePanel();
      }
    });
  }
});

const showSidePanel = computed(() => {
  return selectedNodeData.value !== null || store.persons.length === 0;
});

const selectNode = (nodeData) => {
  selectedNodeData.value = nodeData;
};

const closeSidePanel = () => {
  selectedNodeData.value = null;
  // No need to call unselectNode on familyChartRef
};
</script>

<style>
.app-container {
  display: flex;
  height: 100vh; /* Ensure full height */
}

.family-chart {
  flex-grow: 1; /* Allow chart to take up available space */
}

.side-panel {
  width: 300px; /* Adjust width as needed */
  overflow-y: auto;
}
</style>
