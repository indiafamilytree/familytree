<!-- ./components/FamilyChart.vue -->
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

    <!-- Manual refresh layout button -->
    <BaseButton
      @click="refreshLayout"
      variant="secondary"
      class="layout-refresh-button"
    >
      Refresh Layout
    </BaseButton>
  </div>
</template>

<script setup>
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import coseBilkent from "cytoscape-cose-bilkent";
import cytoscapeSVG from "cytoscape-svg"; // for SVG export
import { onMounted, ref, watch, computed, defineEmits } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

// Register extensions.
cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(coseBilkent);
cytoscapeSVG(cytoscape); // Register the SVG export extension

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);
const emit = defineEmits(["node-selected"]);

// --- Layout Configurations ---

// Compound layout configuration (default)
const compoundLayoutConfig = {
  global: {
    name: "dagre",
    rankDir: "TB",
    fit: false,
    spacingFactor: 1.5,
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

// Cose-Bilkent layout configuration.
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

// Dagre layout configuration.
const dagreLayoutConfig = {
  name: "dagre",
  rankDir: "TB",
  fit: false,
  minLen: function (edge) {
    const label = edge.data("label");
    if (
      label === "Husband" ||
      label === "Wife" ||
      label === "Father" ||
      label === "Mother"
    ) {
      return 0.5;
    }
    return 1;
  },
  spacingFactor: 1.5,
  nodeSep: 100,
  edgeSep: 50,
  rankSep: 150,
};

// Klay layout configuration.
const klayLayoutConfig = {
  name: "klay",
  direction: "TB",
  fit: false,
  spacingFactor: 1.2,
  nodeSpacing: 70,
  edgeSpacingFactor: 0.3,
  borderSpacing: 30,
  thoroughness: 20,
};

// Set default layout to compound.
const selectedLayout = ref("compound");

// Computed layout configuration for non-compound layouts.
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

// --- Style Configuration ---
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
      "line-color": "#ccc",
      "target-arrow-color": "#ccc",
      "target-arrow-shape": "triangle",
    },
  },
];

// --- Chart Initialization ---
const initializeChart = () => {
  // Ensure a hardcoded root person exists.
  if (familyTreeStore.persons.length === 0) {
    familyTreeStore.initializeRootPerson({
      name: "Marimuthu",
      gender: "male",
    });
  }

  cy.value = cytoscape({
    container: document.getElementById("cy"),
    elements: [...familyTreeStore.nodes, ...familyTreeStore.edges],
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
    // Then run a secondary grid layout for compound node children.
    cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
  } else {
    cy.value.layout(currentLayoutConfig.value).run();
  }

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

  // Node tap handler with secondary node event logic.
  cy.value.on("tap", "node", (event) => {
    const node = event.target;
    const nodeData = node.data();
    console.log("Node tapped:", nodeData);
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
    }
  });
};

// --- Watcher for Store Changes ---
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
    } else {
      initializeChart();
    }
  },
  { deep: true }
);

onMounted(() => {
  initializeChart();
});

// --- Manual Refresh Function ---
function refreshLayout() {
  console.log(
    "Manual layout refresh triggered. Using layout:",
    selectedLayout.value
  );
  if (selectedLayout.value === "compound") {
    cy.value.layout(compoundLayoutConfig.global).run();
    cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
  } else {
    cy.value.layout(currentLayoutConfig.value).run();
  }
}

// --- Export SVG Function ---
// Export as SVG (scalable for all sizes)
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
    console.log("SVG export successful.");
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
