<template>
  <div class="relative w-full h-screen">
    <div id="cy" class="absolute top-0 left-0 w-full h-full bg-gray-100"></div>
    <button
      @click="exportAsHighResPNG"
      class="absolute top-4 right-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Export as PNG (300 DPI)
    </button>
  </div>
</template>

<script setup>
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { onMounted, ref, watch, onUnmounted } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

// Register the fcose layout
cytoscape.use(dagre);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);
const emit = defineEmits(["node-selected"]);

// Initialize root person if not already initialized
onMounted(() => {
  if (familyTreeStore.persons.length === 0) {
    familyTreeStore.initializeRootPerson({
      name: "Kannusamy",
      gender: "male",
    });
  }
});

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
  name: "dagre",
  rankDir: "TB", // or 'TB' for top-to-bottom
  // For each edge, set how many “ranks” to keep between source and target
  minLen: function (edge) {
    const label = edge.data("label");
    // Father->Family or Mother->Family => minLen=0
    if (
      label === "Husband" ||
      label === "Wife" ||
      label === "Father" ||
      label === "Mother"
    ) {
      return 0;
    }
    // Children => rank distance 1 (or your default)
    return 1;
  },
  spacingFactor: 1.2,
  nodeSep: 50,
  edgeSep: 10,
  rankSep: 100,
  // optional: define which nodes are “highest”
  // e.g. by setting minLen or rank in dagre.
};

const styleConfig = [
  {
    selector: "node",
    style: {
      "background-color": (ele) => {
        if (ele.data("id").startsWith("family")) {
          return "#DDA0DD"; // Family node color
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
      // ▼ Use a function to pick shape by node type/gender
      shape: (ele) => {
        // Keep family nodes round-rectangle
        if (ele.data("id").startsWith("family")) {
          return "round-rectangle";
        }
        // Male -> rectangle
        if (ele.data("gender") === "male") {
          return "round-rectangle";
        }
        // Female -> circle (Cytoscape shape is "ellipse")
        if (ele.data("gender") === "female") {
          return "ellipse";
        }
        // Default fallback if needed
        return "round-rectangle";
      },
      "text-wrap": "wrap",
      "text-max-width": "110px",
    },
  },
  {
    selector: "node[isFamily]",
    style: {
      label: "", // Hide the label
      shape: "ellipse", // Circle shape
      "background-color": "#DDA0DD", // Your purple
      width: "20px", // Make it small
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
    // Disable zooming
    zoomingEnabled: false,
    // Enable panning
    panningEnabled: true,
  });

  cy.value.layout(layoutConfig).run();

  // --- Center on Root Person ---
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

  // Call centerOnRoot after the layout has been applied and the graph is rendered
  cy.value.ready(() => {
    centerOnRoot();
  });

  // --- Click to Show Details in Sidebar ---
  cy.value.on("tap", "node", (event) => {
    const node = event.target;
    emit("node-selected", node.data());
  });

  // Enable editing on right-click
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
    console.log("watch triggered");
    console.log("  newValues:", newValues);
    console.log("  oldValues:", oldValues);

    if (cy.value) {
      cy.value.elements().remove();
      cy.value.add([...familyTreeStore.nodes, ...familyTreeStore.edges]);
      cy.value.layout(layoutConfig).run();
    } else {
      initializeChart();
    }

    // Log nodes and edges after update
    logNodesAndEdges();
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

// Function to log nodes and edges
const logNodesAndEdges = () => {
  console.log("Current Nodes:", cy.value.nodes().jsons());
  console.log("Current Edges:", cy.value.edges().jsons());
};
</script>
<style scoped>
.relative {
  position: relative;
  width: 100%;
  height: 100vh;
}
.family-chart-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

#cy {
  width: 100%;
  height: 100%;
  background-color: #f9f9f9;
}

.export-button {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 500;
  border-radius: 5px;
  color: white;
  background-color: #4285f4;
  cursor: pointer;
  z-index: 10; /* Ensure button is above the chart */
}
</style>
