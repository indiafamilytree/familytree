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
        <option value="coseBilkent">Cose Bilkent Layout</option>
        <option value="dagre">Dagre Layout</option>
        <option value="klay">Klay Layout</option>
        <option value="compound">Compound Layout</option>
      </select>
    </div>

    <!-- Export PNG button -->
    <BaseButton
      @click="exportAsHighResPNG"
      variant="primary"
      class="absolute top-4 right-4"
    >
      Export as PNG (300 DPI)
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
import { onMounted, ref, watch, computed, defineEmits, nextTick } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

// Register layout extensions.
cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(coseBilkent);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);
const emit = defineEmits(["node-selected"]);

// --- Layout Configurations ---

// Cose-Bilkent layout configuration.
const coseBilkentLayoutConfig = {
  name: "cose-bilkent",
  fit: false, // Allow the graph to overflow.
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

// For the compound layout, we will run two layouts:
// (a) A global layout (using dagre) on the compound nodes (families)
// (b) A secondary layout (using grid) on the children of each family node.
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
    // You can adjust further options, e.g., number of rows if needed.
  },
};

// Reactive variable for the selected layout.
const selectedLayout = ref("coseBilkent");

// Computed layout configuration for non-compound options.
const currentLayoutConfig = computed(() => {
  switch (selectedLayout.value) {
    case "dagre":
      return dagreLayoutConfig;
    case "klay":
      return klayLayoutConfig;
    case "coseBilkent":
    default:
      return coseBilkentLayoutConfig;
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
  // If no persons exist, initialize a hardcoded root person.
  if (familyTreeStore.persons.length === 0) {
    familyTreeStore.initializeRootPerson({
      name: "Kannusamy",
      gender: "male",
    });
  }

  cy.value = cytoscape({
    container: document.getElementById("cy"),
    elements: [...familyTreeStore.nodes, ...familyTreeStore.edges],
    // For non-compound layouts, use currentLayoutConfig;
    // for compound layout, we will run the global layout first and then a child layout.
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

  // Run the global layout.
  cy.value
    .layout(
      selectedLayout.value === "compound"
        ? compoundLayoutConfig.global
        : currentLayoutConfig.value
    )
    .run();

  // If using compound layout, run a secondary layout on the children of each compound node.
  if (selectedLayout.value === "compound") {
    // Assuming that each family node is a compound node and its children are family members.
    cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
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
    // If the global flag for second-person selection is true and the node is a person, dispatch event.
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

watch(
  () => [familyTreeStore.nodes, familyTreeStore.edges],
  (newValues) => {
    if (cy.value) {
      cy.value.elements().remove();
      cy.value.add([...familyTreeStore.nodes, ...familyTreeStore.edges]);
      if (selectedLayout.value === "compound") {
        cy.value.layout(compoundLayoutConfig.global).run();
        // Then run secondary layout for compound node children.
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

// --- Export PNG Function ---
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
