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
import { onMounted, ref, watch, nextTick } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

// Register the fcose layout
cytoscape.use(fcose);

const familyTreeStore = useFamilyTreeStore();
const cy = ref(null);

// Popup state
const showPopup = ref(false);
const popupX = ref(0);
const popupY = ref(0);
const selectedNodeData = ref({}); // To store data of the selected node

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
    // Disable zooming
    zoomingEnabled: false,
    // Enable panning
    panningEnabled: true,
  });

  cy.value.layout(layoutConfig).run();

  // --- Click to Show Popup ---
  const showPersonDetails = (node, event) => {
    console.log("showPersonDetails called");
    selectedNodeData.value = node.data();
    console.log("Selected node data:", selectedNodeData.value);

    // Ensure the canvas is correctly selected
    const canvas = document.querySelector("#cy canvas");
    if (!canvas) {
      console.error("Canvas element not found within #cy");
      return;
    }

    const rect = canvas.getBoundingClientRect();
    console.log("Canvas bounding rect:", rect);

    // Calculate the position relative to the canvas
    const position = event.position || event.cyPosition;
    popupX.value = rect.left + position.x + window.scrollX + "px";
    popupY.value = rect.top + position.y + window.scrollY - 100 + "px"; // Adjust position as needed
    console.log("Popup position (X, Y):", popupX.value, popupY.value);

    showPopup.value = true;
    console.log("showPopup set to:", showPopup.value);
  };

  let clickTimeout = null; // Timeout to differentiate between single and double click

  cy.value.on("tap", "node", (event) => {
    console.log("Node tapped:", event.target.data());

    if (!clickTimeout) {
      // If no timeout is set, set one and show the popup
      clickTimeout = setTimeout(() => {
        showPersonDetails(event.target, event);
        clickTimeout = null; // Clear timeout
      }, 300); // Delay to differentiate from double click, adjust as needed
    } else {
      // If a timeout is already set, it means this is a second click (double click)
      clearTimeout(clickTimeout);
      clickTimeout = null;
      // Handle double click (e.g., edit name)
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

  // Close the popup if clicking outside of it
  const handleWindowClick = (event) => {
    console.log("Window clicked");
    if (showPopup.value) {
      const popupElement = document.querySelector(".popup");
      if (popupElement && !popupElement.contains(event.target)) {
        closePopup();
      }
    }
  };

  // Use a watcher to add/remove the event listener based on showPopup
  watch(showPopup, (newValue, oldValue) => {
    if (newValue) {
      // Add the event listener when showPopup becomes true
      nextTick(() => {
        window.addEventListener("click", handleWindowClick);
      });
    } else {
      // Remove the event listener when showPopup becomes false
      window.removeEventListener("click", handleWindowClick);
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

onMounted(() => {
  initializeChart();
});

function exportAsHighResPNG() {
  const desiredWidthInches = 10; // Example: 10 inches wide (adjust as needed)
  const desiredHeightInches = 8; // Example: 8 inches high (adjust as needed)
  const dpi = 300;

  const desiredWidthPixels = desiredWidthInches * dpi;
  const desiredHeightPixels = desiredHeightInches * dpi;

  // Get the bounding box of the entire graph
  const bounds = cy.value.elements().boundingBox();
  const currentWidth = bounds.w;
  const currentHeight = bounds.h;

  // Calculate the scale factor to fit the graph within the desired dimensions
  const scale = Math.max(
    desiredWidthPixels / currentWidth,
    desiredHeightPixels / currentHeight
  );

  // Export the PNG at the calculated scale
  const pngBlob = cy.value.png({
    output: "blob",
    bg: "transparent", // Or your desired background color
    full: true, // Capture the entire graph
    scale: scale,
  });

  // Create a download link for the high-resolution PNG
  const url = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "family-tree.png"; // Name of the file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const closePopup = () => {
  console.log("closePopup called");
  showPopup.value = false;
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
  padding: 10px;
}
</style>
