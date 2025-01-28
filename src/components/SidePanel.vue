<template>
  <div class="side-panel">
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
    <div v-else>
      <h3 class="text-lg font-bold mb-4">Select a node</h3>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import PersonForm from "@/components/PersonForm.vue";
import PersonNodeForm from "@/components/PersonNodeForm.vue";
import FamilyNodeForm from "@/components/FamilyNodeForm.vue";

const props = defineProps({
  selectedNodeData: {
    type: Object,
    required: false,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const store = useFamilyTreeStore();
const selectedPerson = ref(null);
const selectedFamily = ref(null);

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
  selectedPerson.value = null;
  selectedFamily.value = null;
  emit("close");
}
</script>

<style scoped>
.side-panel {
  width: 350px; /* Adjust width as needed, was 300 */
  height: 100vh;
  overflow-y: auto;
  border-left: 1px solid #ccc;
  padding: 1rem;
  background-color: #f8f8f8;
  /* No need for float: right; as flexbox handles positioning */
}

.form-heading {
  margin-top: 0; /* Remove default top margin */
  margin-bottom: 1rem;
}

/* Add more styles for form elements within SidePanel as needed */
</style>
