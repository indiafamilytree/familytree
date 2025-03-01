<!-- App.vue -->
<template>
  <div class="app-container">
    <FamilyChart
      @node-selected="selectNode"
      :selected-node-id="selectedNodeData?.id"
      ref="familyChartRef"
      class="family-chart"
    />
    <SidePanel
      v-if="showSidePanel"
      :selectedNodeData="selectedNodeData"
      @close="closeSidePanel"
      class="side-panel"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import FamilyChart from "@/components/FamilyChart.vue";
import SidePanel from "@/components/SidePanel.vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import {
  signInWithRedirect,
  getCurrentUser,
  fetchUserAttributes,
} from "@aws-amplify/auth";
import "aws-amplify/auth/enable-oauth-listener";
import { Hub } from "aws-amplify/utils";

Hub.listen("auth", async ({ payload }) => {
  switch (payload.event) {
    case "signInWithRedirect":
      const user = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      console.log({ user, userAttributes });
      break;
    case "signInWithRedirect_failure":
      // handle sign in failure
      console.log("redirect failure event", payload);
      break;
    case "customOAuthState":
      const state = payload.data; // this will be customState provided on signInWithRedirect function
      console.log(state);
      break;
  }
});

const selectedNodeData = ref(null);
const familyChartRef = ref(null);
const store = useFamilyTreeStore();
const showSidePanel = ref(true);

function selectNode(nodeData) {
  selectedNodeData.value = nodeData;
}

function closeSidePanel() {
  selectedNodeData.value = null;
}

watch(
  () => selectedNodeData.value,
  (newValue) => {
    if (newValue === null && familyChartRef.value?.cy) {
      familyChartRef.value.cy.nodes().unselect();
    }
  }
);

onMounted(async () => {
  // Check for OAuth callback parameters to avoid infinite redirect loops.
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") || params.has("error")) {
    console.log("Detected OAuth callback parameters; skipping redirect.");
    return;
  }

  try {
    // Use getCurrentUser() to check for an existing session.
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      console.log("No user session detected, redirecting to Google sign-in...");
      await signInWithRedirect({ provider: "Google" });
    } else {
      const user = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      console.log({ user, userAttributes });
    }
  } catch (error) {
    console.error("Error checking user session:", error);
    try {
      await signInWithRedirect({ provider: "Google" });
    } catch (signInError) {
      console.error("Error during sign-in redirect:", signInError);
    }
  }
  // Initialize tree from S3
  await store.loadAmplifyDataFromS3();
});
</script>

<style>
.app-container {
  display: flex;
  height: 100vh;
}

/* Adjust the width of the chart to account for the wider side panel */
.family-chart {
  width: calc(100% - 400px); /* Changed from 350px to 400px */
}

.side-panel {
  width: 400px; /* Increased width for larger forms */
  overflow-y: auto;
}
</style>
