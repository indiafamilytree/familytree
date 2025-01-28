<template>
  <div class="app-container">
    <FamilyChart
      @node-selected="selectNode"
      :selectedNodeId="selectedNodeData?.id"
      ref="familyChartRef"
      class="family-chart"
    />
    <SidePanel
      :selectedNodeData="selectedNodeData"
      @close="closeSidePanel"
      class="side-panel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import FamilyChart from "@/components/FamilyChart.vue";
import SidePanel from "@/components/SidePanel.vue";

const selectedNodeData = ref(null);
const familyChartRef = ref(null);
const store = useFamilyTreeStore();

onMounted(() => {
  if (store.persons.length === 0) {
    store.initializeRootPerson({
      name: "Kannaiyan",
      gender: "male",
    });
  }
});

const selectNode = (nodeData) => {
  selectedNodeData.value = nodeData;
};

const closeSidePanel = () => {
  selectedNodeData.value = null;
  familyChartRef.value.unselectNode();
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
  width: 400px; /* Adjust width as needed */
  overflow-y: auto;
}
</style>
