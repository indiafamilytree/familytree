<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/components/FamilyChart.vue -->
<template>
  <div class="relative w-full h-screen">
    <!-- Cytoscape container -->
    <div id="cy" class="absolute top-0 left-0 w-full h-full bg-gray-100"></div>

    <!-- Layout selection dropdown (top left) -->
    <div class="layout-select">
      <label for="layoutSelect">View:</label>
      <select
        id="layoutSelect"
        v-model="selectedLayout"
        @change="refreshLayout"
      >
        <option value="compound">Compound Layout</option>
        <option value="coseBilkent">Cose Bilkent Layout</option>
        <option value="dagre">Dagre Layout</option>
        <option value="klay">Klay Layout</option>
      </select>
    </div>

    <!-- Export SVG button -->
    <BaseButton
      @click="exportAsSVG"
      variant="primary"
      class="absolute top-4 right-4"
    >
      Export as SVG
    </BaseButton>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, defineEmits } from "vue";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import coseBilkent from "cytoscape-cose-bilkent";
import cytoscapeSVG from "cytoscape-svg";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

// Register Cytoscape extensions.
cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(coseBilkent);
cytoscapeSVG(cytoscape);

const emit = defineEmits(["node-selected"]);
const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);
const selectedLayout = ref("compound");

// --- Layout Configurations ---

const compoundLayoutConfig = {
  global: {
    name: "dagre",
    rankDir: "TB",
    fit: false,
    spacingFactor: 1,
    nodeSep: 100,
    edgeSep: 50,
    rankSep: 150,
  },
  compound: {
    name: "grid",
    fit: false,
    padding: 20,
  },
};

const coseBilkentLayoutConfig = {
  name: "cose-bilkent",
  fit: false,
  animate: true,
  animationDuration: 1000,
  idealEdgeLength: 250,
  nodeRepulsion: 12000,
  gravity: 0.45,
  numIter: 5000,
  tile: true,
  nodeDimensionsIncludeLabels: true,
  padding: 30,
};

const dagreLayoutConfig = {
  name: "dagre",
  rankDir: "TB",
  fit: false,
  minLen: (edge) => {
    const label = edge.data("label");
    return label === "Husband" ||
      label === "Wife" ||
      label === "Father" ||
      label === "Mother"
      ? 0.5
      : 1;
  },
  spacingFactor: 1,
  nodeSep: 100,
  edgeSep: 50,
  rankSep: 150,
};

const klayLayoutConfig = {
  name: "klay",
  nodeDimensionsIncludeLabels: true,
  fit: false,
  spacingFactor: 1,
  klay: {
    direction: "DOWN",
    spacing: 50, // Increase for larger gaps between layers
    edgeSpacingFactor: 2, // Increase edge-based spacing
    inLayerSpacingFactor: 2, // Increase spacing among siblings
    borderSpacing: 100, // Extra margin around layout
    thoroughness: 20,
  },
};

const currentLayoutConfig = computed(() => {
  switch (selectedLayout.value) {
    case "dagre":
      return dagreLayoutConfig;
    case "klay":
      return klayLayoutConfig;
    case "coseBilkent":
      return coseBilkentLayoutConfig;
    default:
      return compoundLayoutConfig.global;
  }
});

// --- Color Bank for Edges ---
// Removed near-white colors to keep colors visible.
const colorBank = [
  "#e6194b",
  "#3cb44b",
  "#ffe119",
  "#0082c8",
  "#f58231",
  "#911eb4",
  "#46f0f0",
  "#f032e6",
  "#d2f53c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#aa6e28",
  // Removed near-white: "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000080",
  "#808080",
  "#FF1493",
  "#00CED1",
  "#ADFF2F",
  "#FF8C00",
  "#DA70D6",
  "#7FFFD4",
  "#D2691E",
  "#FF4500",
  "#2E8B57",
  "#00FA9A",
  "#4682B4",
  "#D2B48C",
  "#B0C4DE",
  "#FF69B4",
  "#CD5C5C",
  "#66CDAA",
  "#B22222",
  "#8A2BE2",
  "#5F9EA0",
  "#FFA07A",
  "#20B2AA",
  "#87CEEB",
  "#778899",
  "#B0E0E6",
  "#32CD32",
  "#FF6347",
  "#40E0D0",
  "#EE82EE",
  "#F5DEB3",
  "#BC8F8F",
];

function assignEdgeColors() {
  if (!cy.value) return;
  const edges = cy.value.edges();
  edges.forEach((edge, index) => {
    const color = colorBank[index % colorBank.length];
    edge.data("color", color);
  });
}

// --- Cytoscape Style ---
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
        return ele.data("gender") === "male" ? "round-rectangle" : "ellipse";
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
      "line-color": "data(color)",
      "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle",
    },
  },
];

// --- Chart Initialization & Event Handling ---
function initializeChart() {
  // Ensure a root person exists.
  if (familyTreeStore.persons.length === 0) {
    // familyTreeStore.initializeRootPerson({ name: "Marimuthu", gender: "male" });
  }

  cy.value = cytoscape({
    container: document.getElementById("cy"),
    elements: [...familyTreeStore.nodes, ...familyTreeStore.edges],
    // Use the selected layout configuration as defined.
    layout:
      selectedLayout.value === "compound"
        ? compoundLayoutConfig.global
        : currentLayoutConfig.value,
    style: styleConfig,
    zoomingEnabled: true,
    panningEnabled: true,
    zoom: 1.5,
    userPanningEnabled: true,
  });

  // Run the layout.
  if (selectedLayout.value === "compound") {
    cy.value.layout(compoundLayoutConfig.global).run();
    cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
  } else {
    cy.value.layout(currentLayoutConfig.value).run();
  }

  // Once layout is ready, assign colors, center on root, and then fit the graph into the viewport.
  cy.value.ready(() => {
    assignEdgeColors();
    centerOnRoot();
    // Optimize: Fit all elements into the container with 20px padding.
    cy.value.fit(cy.value.elements(), 20);
    console.log("Graph fitted to viewport.");
  });

  // Node tap handler.
  cy.value.on("tap", "node", (event) => {
    const node = event.target;
    const nodeData = node.data();
    console.log("Node tapped:", nodeData);
    // If awaiting second person selection, dispatch that event.
    if (!nodeData.isFamily && window.awaitSecondPerson) {
      window.dispatchEvent(
        new CustomEvent("second-person-selected", { detail: nodeData })
      );
    } else {
      // Otherwise, emit a "node-selected" event so the side panel opens the appropriate form.
      emit("node-selected", nodeData);
    }
  });

  // Additional event handlers (e.g., right-click for editing) can be added here.
}

function centerOnRoot() {
  const rootNodeData = familyTreeStore.rootPerson;
  if (rootNodeData) {
    const rootNode = cy.value.getElementById(rootNodeData.id);
    if (rootNode.length > 0) {
      cy.value.center(rootNode);
    }
  }
}

watch(
  () => familyTreeStore.rootPerson,
  (newRoot) => {
    if (newRoot && cy.value) {
      setTimeout(() => {
        centerOnRoot();
      }, 10); // adjust delay as needed
    }
  }
);

// Watch for changes in the store to update the chart.
watch(
  () => [familyTreeStore.nodes, familyTreeStore.edges],
  (newValues) => {
    if (cy.value) {
      cy.value.elements().remove();
      cy.value.add([...familyTreeStore.nodes, ...familyTreeStore.edges]);
      if (selectedLayout.value === "compound") {
        cy.value.layout(compoundLayoutConfig.global).run();
        cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
      } else {
        cy.value.layout(currentLayoutConfig.value).run();
      }
      assignEdgeColors();
    } else {
      initializeChart();
    }
  },
  { deep: true }
);

onMounted(() => {
  initializeChart();
});

// Manual refresh layout.
function refreshLayout() {
  if (selectedLayout.value === "compound") {
    cy.value.layout(compoundLayoutConfig.global).run();
    cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
  } else {
    cy.value.layout(currentLayoutConfig.value).run();
  }
  assignEdgeColors();
}

// Export SVG function.
function exportAsSVG() {
  try {
    const svgStr = cy.value.svg({ output: "string", full: true });
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-tree.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting SVG:", error);
  }
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
/* Layout selection dropdown styles */
.layout-select {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  background: #fff;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.layout-select label {
  font-size: 0.9rem;
  margin-right: 5px;
}
.layout-select select {
  padding: 4px;
  font-size: 0.9rem;
}
/* Manual refresh layout button styling */
.layout-refresh-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 8px 12px;
  font-size: 1rem;
}
</style>
