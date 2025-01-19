<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/components/FamilyChart.vue -->
<template>
  <div>
    <div
      id="cy"
      style="width: 100%; height: 100vh; background-color: #f9f9f9"
    ></div>
  </div>
</template>

<script setup>
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import { onMounted, ref, watch } from "vue";
import { useFamilyTreeStore } from "@/stores/familyTree";

// Register the fcose layout
cytoscape.use(fcose);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);

const layoutConfig = {
  name: "fcose",
  animate: true,
  fit: true,
  padding: 30,
  spacingFactor: 1.2,
  nodeRepulsion: 4500,
  idealEdgeLength: 100,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.25,
  numIter: 2500,
  tile: true,
  packComponents: true,
};

const styleConfig = [
  {
    selector: "node",
    style: {
      "background-color": (ele) => {
        if (ele.data("isCouple")) return "#DDA0DD"; // Pinkish blue for couples node background
        return ele.data("gender") === "male" ? "#ADD8E6" : "#FFB6C1";
      },
      label: (ele) => ele.data("label"),
      "text-valign": "center",
      "text-halign": "center",
      color: "#000",
      "font-size": "16px",
      width: "120px", // Same size for all nodes
      height: "60px", // Same size for all nodes
      shape: "round-rectangle",
      "text-wrap": "wrap",
      "text-max-width": "110px",
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#A9A9A9",
      "target-arrow-color": "#A9A9A9",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": "12px",
      "text-background-opacity": 1,
      "text-background-color": "#fff",
      "text-background-shape": "roundrectangle",
      "text-background-padding": "2px",
    },
  },
];

const initializeChart = () => {
  cy.value = cytoscape({
    container: document.getElementById("cy"),
    elements: [...familyTreeStore.nodes, ...familyTreeStore.edges],
    layout: layoutConfig,
    style: styleConfig,
  });

  cy.value.layout(layoutConfig).run();

  // Enable editing on double-click
  cy.value.on("cxttap", "node", (event) => {
    const node = event.target;
    const newName = prompt("Edit Name:", node.data("label"));
    if (newName) {
      node.data("label", newName);
      const storeNode = familyTreeStore.nodes.find(
        (n) => n.data.id === node.data("id")
      );
      if (storeNode) storeNode.data.label = newName;
    }
  });

  cy.value.on("cxttap", "edge", (event) => {
    const edge = event.target;
    const newLabel = prompt("Edit Relation:", edge.data("label"));
    if (newLabel) {
      edge.data("label", newLabel);
      const storeEdge = familyTreeStore.edges.find(
        (e) => e.data.id === edge.data("id")
      );
      if (storeEdge) storeEdge.data.label = newLabel;
    }
  });

  // Center the user node
  /*  cy.value.on("layoutstop", () => {
    const focusedNode = familyTreeStore.nodes.find(
      (node) => node.data.id === familyTreeStore.user
    );
    if (focusedNode) {
      const cyNode = cy.value.getElementById(focusedNode.data.id);
      cy.value.animate({
        center: {
          eles: cyNode,
        },
        duration: 1000, // Smooth animation duration in ms
        easing: "ease-in-out",
      });
    }
  });
  */
};

watch(
  () => [familyTreeStore.nodes, familyTreeStore.edges],
  () => {
    if (cy.value) {
      cy.value.elements().remove();
      cy.value.add([...familyTreeStore.nodes, ...familyTreeStore.edges]);
      cy.value.layout(layoutConfig).run();
      cy.value.fit(); // Ensure all nodes are visible
    } else {
      initializeChart();
    }
  },
  { deep: true }
);

onMounted(() => {
  initializeChart();
});
</script>

<style scoped>
#cy {
  width: 100%;
  height: 100vh;
}
</style>
