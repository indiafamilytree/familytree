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
      <BaseButton @click="saveTree" variant="primary"> Save </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
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
const emit = defineEmits(["close"]);
const store = useFamilyTreeStore();
const selectedPerson = ref(null);
const selectedFamily = ref(null);

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

function saveTree() {
  store.saveTreeToS3();
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
  const personIndex = store.persons.findIndex((p) => p.id === updatedPerson.id);
  if (personIndex > -1) {
    store.persons[personIndex] = updatedPerson;
    const node = store.nodes.find((n) => n.data.id === updatedPerson.id);
    if (node) {
      node.data.label = updatedPerson.name;
    }
  }
}

function closePanel() {
  // Optionally save on close as well.
  store.saveTreeToS3();
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
</style>
