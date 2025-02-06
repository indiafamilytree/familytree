<!-- ./components/FamilyChart.vue -->
<template>
  <div class="relative w-full h-screen">
    <div id="cy" class="absolute top-0 left-0 w-full h-full bg-gray-100"></div>
    <BaseButton
      @click="exportAsHighResPNG"
      variant="primary"
      class="absolute top-4 right-4"
    >
      Export as PNG (300 DPI)
    </BaseButton>
  </div>
</template>

<script setup>
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { onMounted, ref, watch } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

cytoscape.use(dagre);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);
const emit = defineEmits(["node-selected"]);

onMounted(() => {
  if (familyTreeStore.persons.length === 0) {
    familyTreeStore.initializeRootPerson({
      name: "Kannusamy",
      gender: "male",
    });
  }
});

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
  name: "dagre",
  rankDir: "TB",
  minLen: function (edge) {
    const label = edge.data("label");
    if (
      label === "Husband" ||
      label === "Wife" ||
      label === "Father" ||
      label === "Mother"
    ) {
      return 0;
    }
    return 1;
  },
  spacingFactor: 1.2,
  nodeSep: 50,
  edgeSep: 10,
  rankSep: 100,
};

const styleConfig = [
  {
    selector: "node",
    style: {
      "background-color": (ele) => {
        if (ele.data("id").startsWith("family")) {
          return "#DDA0DD";
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
      shape: (ele) => {
        if (ele.data("id").startsWith("family")) {
          return "round-rectangle";
        }
        if (ele.data("gender") === "male") {
          return "round-rectangle";
        }
        if (ele.data("gender") === "female") {
          return "ellipse";
        }
        return "round-rectangle";
      },
      "text-wrap": "wrap",
      "text-max-width": "110px",
    },
  },
  {
    selector: "node[isFamily]",
    style: {
      label: "",
      shape: "ellipse",
      "background-color": "#DDA0DD",
      width: "20px",
      height: "20px",
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
        if (targetNode.data("id").startsWith("family")) {
          if (!edgeColorMap.has(ele.data("id"))) {
            edgeColorMap.set(ele.data("id"), colorPalette[colorIndex]);
            colorIndex = (colorIndex + 1) % colorPalette.length;
          }
          return edgeColorMap.get(ele.data("id"));
        } else {
          return targetNode.style("background-color");
        }
      },
      "target-arrow-color": (ele) => {
        const targetNode = ele.target();
        if (targetNode.data("id").startsWith("family")) {
          if (!edgeColorMap.has(ele.data("id"))) {
            edgeColorMap.set(ele.data("id"), colorPalette[colorIndex]);
            colorIndex = (colorIndex + 1) % colorPalette.length;
          }
          return edgeColorMap.get(ele.data("id"));
        } else {
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
    zoomingEnabled: false,
    panningEnabled: true,
  });

  cy.value.layout(layoutConfig).run();

  const centerOnRoot = () => {
    const rootNodeData = familyTreeStore.rootPerson;
    if (rootNodeData) {
      const rootNode = cy.value.getElementById(rootNodeData.id);
      if (rootNode.length > 0) {
        cy.value.center(rootNode);
      } else {
        console.warn(`Root node with ID ${rootNodeData.id} not found.`);
      }
    } else {
      console.warn("Root person is not set in the store.");
    }
  };

  cy.value.ready(() => {
    centerOnRoot();
  });

  cy.value.on("tap", "node", (event) => {
    const node = event.target;
    const nodeData = node.data();
    console.log("Node tapped:", nodeData);

    // Check if this is a person node (assuming family nodes have isFamily: true)
    if (!nodeData.isFamily && window.awaitSecondPerson) {
      console.log("Dispatching 'second-person-selected' event for:", nodeData);
      window.dispatchEvent(
        new CustomEvent("second-person-selected", { detail: nodeData })
      );
    } else {
      emit("node-selected", nodeData);
    }
  });

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
  (newValues, oldValues) => {
    if (cy.value) {
      cy.value.elements().remove();
      cy.value.add([...familyTreeStore.nodes, ...familyTreeStore.edges]);
      cy.value.layout(layoutConfig).run();
    } else {
      initializeChart();
    }
  },
  { deep: true }
);

onMounted(() => {
  initializeChart();
});

function exportAsHighResPNG() {
  const desiredWidthInches = 10;
  const desiredHeightInches = 8;
  const dpi = 300;
  const desiredWidthPixels = desiredWidthInches * dpi;
  const desiredHeightPixels = desiredHeightInches * dpi;
  const bounds = cy.value.elements().boundingBox();
  const currentWidth = bounds.w;
  const currentHeight = bounds.h;
  const scale = Math.max(
    desiredWidthPixels / currentWidth,
    desiredHeightPixels / currentHeight
  );
  const pngBlob = cy.value.png({
    output: "blob",
    bg: "transparent",
    full: true,
    scale: scale,
  });
  const url = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "family-tree.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.relative {
  position: relative;
  width: 100%;
  height: 100vh;
}
#cy {
  width: 100%;
  height: 100%;
  background-color: #f9f9f9;
}
</style>
