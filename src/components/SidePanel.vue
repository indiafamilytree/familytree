<!-- ./src/components/SidePanel.vue -->
<template>
  <div class="side-panel">
    <div class="main-content">
      <div v-if="selectedPerson">
        <h3 class="form-heading">Edit Person: {{ selectedPerson.name }}</h3>
        <PersonNodeForm
          :personData="selectedPerson"
          @update:personData="updatePerson"
          @close="closePanel"
        />
      </div>
      <div v-else-if="selectedFamily">
        <h3 class="form-heading">Edit Family: {{ selectedFamily.label }}</h3>
        <FamilyNodeForm :familyData="selectedFamily" @close="closePanel" />
      </div>
      <div v-else-if="store.persons.length === 0">
        <h3 class="form-heading">Add Person</h3>
        <PersonForm />
      </div>
      <div v-else>
        <h3 class="form-heading">Select a node</h3>
      </div>
    </div>
    <!-- Footer actions -->
    <div class="footer-actions">
      <BaseButton @click="downloadTree" variant="inprogress">
        Download
      </BaseButton>
      <BaseButton @click="saveTree" variant="primary">
        {{ saveButtonText }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import PersonForm from "@/components/PersonForm.vue";
import PersonNodeForm from "@/components/PersonNodeForm.vue";
import FamilyNodeForm from "@/components/FamilyNodeForm.vue";
import BaseButton from "@/components/BaseButton.vue";

const props = defineProps({
  selectedNodeData: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(["close", "node-selected"]);
const store = useFamilyTreeStore();
const selectedPerson = ref(null);
const selectedFamily = ref(null);

// Reactive state for Save button: "idle", "saving", "saved"
const saveStatus = ref("idle");

const saveButtonText = computed(() => {
  if (saveStatus.value === "saving") return "Saving…";
  if (saveStatus.value === "saved") return "Saved";
  return "Save";
});

function downloadTree() {
  const treeData = {
    persons: store.persons,
    families: store.families,
    nodes: store.nodes,
    edges: store.edges,
    rootPerson: store.rootPerson,
  };
  const jsonStr = JSON.stringify(treeData, null, 2);
  const dataUrl = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
  const link = document.createElement("a");
  link.setAttribute("href", dataUrl);
  link.setAttribute("download", "family-tree.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function saveTree() {
  try {
    saveStatus.value = "saving";
    await store.saveTreeToS3();
    saveStatus.value = "saved";
    setTimeout(() => {
      saveStatus.value = "idle";
    }, 2000);
  } catch (error) {
    console.error("Error in saveTree:", error);
    saveStatus.value = "idle";
  }
}

watch(
  () => props.selectedNodeData,
  (newNodeData) => {
    if (newNodeData) {
      if (newNodeData.isFamily) {
        selectedFamily.value = newNodeData;
        selectedPerson.value = null;
      } else {
        selectedPerson.value = store.persons.find(
          (p) => p.id === newNodeData.id
        );
        selectedFamily.value = null;
      }
    } else {
      selectedPerson.value = null;
      selectedFamily.value = null;
    }
  },
  { immediate: true }
);

function updatePerson(updatedPerson) {
  const index = store.persons.findIndex((p) => p.id === updatedPerson.id);
  if (index > -1) {
    store.persons[index] = updatedPerson;
    const node = store.nodes.find((n) => n.data.id === updatedPerson.id);
    if (node) {
      node.data.label = updatedPerson.name;
    }
  }
}

function closePanel() {
  // Optionally trigger save on close.
  saveTree();
  selectedPerson.value = null;
  selectedFamily.value = null;
  emit("close");
}
</script>

<style scoped>
.side-panel {
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #ccc;
  width: 350px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.footer-actions {
  display: flex;
  gap: 1rem;
  border-top: 1px solid #ccc;
  padding: 0.75rem 1rem;
  justify-content: flex-end;
}

/* Optional transition for button text changes */
.footer-actions button {
  transition: all 0.3s ease;
}
</style>
