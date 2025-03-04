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

    <!-- Stats Section positioned at top right -->
    <div class="stats-panel">
      <div class="stat-item persons">
        <span class="stat-label">Persons:</span>
        <span class="stat-number">{{ personCount }}</span>
      </div>
      <div class="stat-item families">
        <span class="stat-label">Families:</span>
        <span class="stat-number">{{ familyCount }}</span>
      </div>
      <div class="stat-item females">
        <span class="stat-label">Females:</span>
        <span class="stat-number">{{ femaleCount }}</span>
      </div>
      <div class="stat-item males">
        <span class="stat-label">Males:</span>
        <span class="stat-number">{{ maleCount }}</span>
      </div>
      <div class="stat-item generation">
        <span class="stat-label">Generation:</span>
        <span class="stat-number">{{ generationStats }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed, defineEmits } from "vue";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import coseBilkent from "cytoscape-cose-bilkent";
import cytoscapeSVG from "cytoscape-svg";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

cytoscape.use(dagre);
cytoscape.use(klay);
cytoscape.use(coseBilkent);
cytoscapeSVG(cytoscape);

const emit = defineEmits(["node-selected"]);
const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);
const selectedLayout = ref("compound");

// Computed statistics.
const personCount = computed(() => familyTreeStore.persons.length);
const familyCount = computed(() => familyTreeStore.families.length);
const femaleCount = computed(
  () => familyTreeStore.persons.filter((p) => p.gender === "female").length
);
const maleCount = computed(
  () => familyTreeStore.persons.filter((p) => p.gender === "male").length
);
const generationStats = computed(() => {
  // calculateGenerationMapping returns an object with generationMap and maxGeneration.
  return familyTreeStore.calculateGenerationMapping();
});

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
    spacing: 50,
    edgeSpacingFactor: 2,
    inLayerSpacingFactor: 2,
    borderSpacing: 100,
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

  if (selectedLayout.value === "compound") {
    cy.value.layout(compoundLayoutConfig.global).run();
    cy.value.nodes("[?parent]").layout(compoundLayoutConfig.compound).run();
  } else {
    cy.value.layout(currentLayoutConfig.value).run();
  }

  cy.value.ready(() => {
    assignEdgeColors();
    centerOnRoot();
    cy.value.fit(cy.value.elements(), 20);
    console.log("Graph fitted to viewport.");
  });

  cy.value.on("tap", (event) => {
    const node = event.target;
    const nodeData = node.data();
    console.log("Node tapped:", nodeData);
    if (!nodeData.isFamily && window.awaitSecondPerson) {
      window.dispatchEvent(
        new CustomEvent("second-person-selected", { detail: nodeData })
      );
    } else {
      emit("node-selected", nodeData);
    }
  });
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
      }, 10);
    }
  }
);

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
  // Listen for the global export-svg event dispatched from the SidePanel.
  window.addEventListener("export-svg", exportAsSVG);
});

onUnmounted(() => {
  window.removeEventListener("export-svg", exportAsSVG);
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

/* Stats panel now positioned at the top right */
.stats-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #333;
}
.stat-item.persons {
  background-color: #e0f7fa;
}
.stat-item.families {
  background-color: #fce4ec;
}
.stat-item.females {
  background-color: #f3e5f5;
}
.stat-item.males {
  background-color: #e8f5e9;
}
.stat-item.generation {
  background-color: #f5f1e8;
}
.stat-number {
  font-weight: 700;
  color: #007bff;
}
</style>
