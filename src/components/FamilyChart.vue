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
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

// Register the fcose layout
cytoscape.use(fcose);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);

// --- Color Palette (50 colors) ---
const colorPalette = [
  "#FF5733",
  "#3498DB",
  "#2ECC71",
  "#F08080",
  "#FFB6C1",
  "#9370DB",
  "#FFD700",
  "#20B2AA",
  "#D2691E",
  "#2E8B57",
  "#008080",
  "#FF6347",
  "#4682B4",
  "#008B8B",
  "#BDB76B",
  "#556B2F",
  "#8B008B",
  "#7CFC00",
  "#FA8072",
  "#6A5ACD",
  "#DAA520",
  "#006400",
  "#800000",
  "#8FBC8F",
  "#483D8B",
  "#B22222",
  "#2F4F4F",
  "#FF7F50",
  "#DC143C",
  "#00CED1",
  "#9400D3",
  "#1E90FF",
  "#B8860B",
  "#00008B",
  "#A9A9A9",
  "#6B8E23",
  "#FFA500",
  "#FF4500",
  "#DA70D6",
  "#EEE8AA",
  "#98FB98",
  "#AFEEEE",
  "#DB7093",
  "#FFEFD5",
  "#FFDAB9",
  "#CD853F",
  "#FFC0CB",
  "#DDA0DD",
  "#B0E0E6",
  "#800080",
];

let colorIndex = 0;
const edgeColorMap = new Map();

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
        if (ele.data("id").startsWith("family")) {
          return "#DDA0DD"; // Light purple for family nodes
        } else {
          return ele.data("gender") === "male" ? "#ADD8E6" : "#FFB6C1";
        }
      },
      label: (ele) => ele.data("label"),
      "text-valign": "center",
      "text-halign": "center",
      color: "#000",
      "font-size": "16px",
      width: "120px",
      height: "60px",
      shape: "round-rectangle",
      "text-wrap": "wrap",
      "text-max-width": "110px",
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": "12px",
      "text-background-opacity": 1,
      "text-background-color": "#fff",
      "text-background-shape": "roundrectangle",
      "text-background-padding": "2px",
      "line-color": (ele) => {
        const targetNode = ele.target();

        // If target is a family node, use a unique color from the palette
        if (targetNode.data("id").startsWith("family")) {
          if (!edgeColorMap.has(ele.data("id"))) {
            edgeColorMap.set(ele.data("id"), colorPalette[colorIndex]);
            colorIndex = (colorIndex + 1) % colorPalette.length; // Cycle through colors
          }
          return edgeColorMap.get(ele.data("id"));
        } else {
          // If target is not a family node, transition to its color
          return targetNode.style("background-color");
        }
      },
      "target-arrow-color": (ele) => {
        const targetNode = ele.target();

        // If target is a family node, use a unique color from the palette
        if (targetNode.data("id").startsWith("family")) {
          if (!edgeColorMap.has(ele.data("id"))) {
            edgeColorMap.set(ele.data("id"), colorPalette[colorIndex]);
            colorIndex = (colorIndex + 1) % colorPalette.length; // Cycle through colors
          }
          return edgeColorMap.get(ele.data("id"));
        } else {
          // If target is not a family node, transition to its color
          return targetNode.style("background-color");
        }
      },
      "target-arrow-shape": "triangle",
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
