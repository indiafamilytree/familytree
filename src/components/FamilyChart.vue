<template>
  <div>
    <div
      id="cy"
      style="width: 100%; height: 100vh; background-color: #f9f9f9"
    ></div>
    <button @click="exportAsHighResPNG">Export as PNG (300 DPI)</button>
    <div v-if="showPopup" class="popup" :style="{ top: popupY, left: popupX }">
      <div class="popup-content">
        <h3>{{ selectedNodeData.label }}</h3>
        <p>ID: {{ selectedNodeData.id }}</p>
        <button @click="closePopup">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import { onMounted, ref, watch, nextTick, onUnmounted } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

// Register the fcose layout
cytoscape.use(fcose);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);

// Initialize root person if not already initialized
if (!familyTreeStore.rootPerson) {
  familyTreeStore.initializeRootPerson({
    name: "Kannaiyan",
    gender: "male",
  });
}

// Popup state
const showPopup = ref(false);
const popupX = ref(0);
const popupY = ref(0);
const selectedNodeData = ref({}); // To store data of the selected node

// Form data for adding a new related person - NOW IN TOP-LEVEL SCOPE
const newPersonName = ref("");
const newPersonRelation = ref("father");

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

// Define handleWindowClick *outside* of initializeChart and *before* onMounted
const handleWindowClick = (event) => {
  console.log("Window clicked");
  if (showPopup.value) {
    const popupElement = document.querySelector(".popup");
    const cyContainer = document.querySelector("#cy");
    if (
      popupElement &&
      !popupElement.contains(event.target) &&
      cyContainer &&
      !cyContainer.contains(event.target)
    ) {
      closePopup();
    }
  }
};

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

  // --- Click to Show Popup ---
  const showPersonDetails = (node) => {
    selectedNodeData.value = node.data();

    // Get the rendered position of the node
    const renderedPosition = node.renderedPosition();

    // Get the container of Cytoscape
    const container = cy.value.container();

    // Calculate the position of the popup
    popupX.value = renderedPosition.x + container.offsetLeft + "px";
    popupY.value = renderedPosition.y + container.offsetTop + "px";

    showPopup.value = true;
  };

  let clickTimeout = null;

  cy.value.on("tap", "node", (event) => {
    if (!clickTimeout) {
      clickTimeout = setTimeout(() => {
        showPersonDetails(event.target);
        clickTimeout = null;
      }, 300);
    } else {
      clearTimeout(clickTimeout);
      clickTimeout = null;
      const node = event.target;
      const newName = prompt("Edit Name:", node.data("label"));
      if (newName) {
        node.data("label", newName);
        const storeNode = familyTreeStore.nodes.find(
          (n) => n.data.id === node.data("id")
        );
        if (storeNode) storeNode.data.label = newName;
      }
    }
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
  () => {
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

// Call initializeChart in onMounted *after* handleWindowClick is defined
onMounted(() => {
  initializeChart();
  window.addEventListener("click", handleWindowClick);
});

onUnmounted(() => {
  window.removeEventListener("click", handleWindowClick);
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

const closePopup = () => {
  showPopup.value = false;
  newPersonName.value = "";
  newPersonRelation.value = "father";
};

const addRelatedPerson = () => {
  let gender;
  if (
    newPersonRelation.value === "father" ||
    newPersonRelation.value === "son" ||
    newPersonRelation.value === "husband"
  ) {
    gender = "male";
  } else if (
    newPersonRelation.value === "mother" ||
    newPersonRelation.value === "daughter" ||
    newPersonRelation.value === "wife"
  ) {
    gender = "female";
  }
  familyTreeStore.addPerson({
    name: newPersonName.value,
    gender: gender,
    relation: newPersonRelation.value,
    linkedPersonId: selectedNodeData.value.id, // Use the selected node's ID
  });

  closePopup();
};

const downloadJson = () => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(familyTreeStore.persons));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "family-tree.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const handleFileImport = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        familyTreeStore.importPersons(importedData, familyTreeStore);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        // Handle error, e.g., show an error message to the user
      }
    };
    reader.readAsText(file);
  }
};
</script>

<style scoped>
#cy {
  width: 100%;
  height: 100vh;
}
.popup {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 10; /* Ensure the popup is above the Cytoscape canvas */
}

.popup-content {
  padding: 11px;
}
</style>
