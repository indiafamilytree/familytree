<template>
  <div
    v-if="show"
    class="popup"
    :style="{ top: popupY, left: popupX, display: show ? 'block' : 'none' }"
  >
    <div class="popup-content">
      <div v-if="familyData">
        <h3>{{ familyData.label }}</h3>
        <p>ID: {{ familyData.id }}</p>

        <h4>Add Family Members:</h4>

        <div class="form-group">
          <label for="husband-name">Husband:</label>
          <input
            type="text"
            id="husband-name"
            v-model="newFamilyMembers.husband.name"
            :disabled="hasHusband"
          />
        </div>

        <div class="form-group">
          <label for="wife-name">Wife:</label>
          <input
            type="text"
            id="wife-name"
            v-model="newFamilyMembers.wife.name"
            :disabled="hasWife"
          />
        </div>

        <div class="form-group">
          <label for="son-name">Sons:</label>
          <input type="text" id="son-name" v-model="newSonName" />
          <button @click="addSon">Add Son</button>
          <ul>
            <li v-for="(son, index) in newFamilyMembers.sons" :key="index">
              {{ son.name }}
              <button @click="removeSon(index)">Remove</button>
            </li>
          </ul>
        </div>

        <div class="form-group">
          <label for="daughter-name">Daughters:</label>
          <input type="text" id="daughter-name" v-model="newDaughterName" />
          <button @click="addDaughter">Add Daughter</button>
          <ul>
            <li
              v-for="(daughter, index) in newFamilyMembers.daughters"
              :key="index"
            >
              {{ daughter.name }}
              <button @click="removeDaughter(index)">Remove</button>
            </li>
          </ul>
        </div>

        <button @click="addAllFamilyMembers" :disabled="!canAddFamilyMembers">
          Add All
        </button>
      </div>

      <button @click="closePopup">Close</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";

const props = defineProps({
  familyData: {
    type: Object,
    required: false,
    default: null,
  },
  popupX: {
    type: String,
    required: true,
  },
  popupY: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const familyTreeStore = useFamilyTreeStore();
const newSonName = ref("");
const newDaughterName = ref("");
const show = ref(false);

const newFamilyMembers = ref({
  husband: { name: "", gender: "male" },
  wife: { name: "", gender: "female" },
  sons: [],
  daughters: [],
});

watch(
  () => props.familyData,
  (newFamilyData) => {
    console.log("familyData changed:", newFamilyData);
    show.value = !!newFamilyData;
  },
  { immediate: true }
);

const hasHusband = computed(() => {
  console.log("Checking for existing husband...");
  if (!props.familyData) return false;
  const family = familyTreeStore.families.find(
    (f) => f.id === props.familyData.id
  );
  const result = family?.members.some((memberId) => {
    const person = familyTreeStore.persons.find((p) => p.id === memberId);
    const edge = familyTreeStore.edges.find(
      (e) => e.data.source === memberId && e.data.target === props.familyData.id
    );
    return person && edge?.data.label === "Husband";
  });
  console.log("Has husband:", result);
  return result;
});

const hasWife = computed(() => {
  console.log("Checking for existing wife...");
  if (!props.familyData) return false;
  const family = familyTreeStore.families.find(
    (f) => f.id === props.familyData.id
  );
  const result = family?.members.some((memberId) => {
    const person = familyTreeStore.persons.find((p) => p.id === memberId);
    const edge = familyTreeStore.edges.find(
      (e) => e.data.source === memberId && e.data.target === props.familyData.id
    );
    return person && edge?.data.label === "Wife";
  });
  console.log("Has wife:", result);
  return result;
});

const addSon = () => {
  console.log("Adding son...");
  if (newSonName.value) {
    newFamilyMembers.value.sons.push({
      name: newSonName.value,
      gender: "male",
    });
    newSonName.value = "";
  }
  console.log("Current sons:", newFamilyMembers.value.sons);
};

const removeSon = (index) => {
  console.log("Removing son at index:", index);
  newFamilyMembers.value.sons.splice(index, 1);
};

const addDaughter = () => {
  console.log("Adding daughter...");
  if (newDaughterName.value) {
    newFamilyMembers.value.daughters.push({
      name: newDaughterName.value,
      gender: "female",
    });
    newDaughterName.value = "";
  }
  console.log("Current daughters:", newFamilyMembers.value.daughters);
};

const removeDaughter = (index) => {
  console.log("Removing daughter at index:", index);
  newFamilyMembers.value.daughters.splice(index, 1);
};

const canAddFamilyMembers = computed(() => {
  const f = newFamilyMembers.value;
  const result =
    f.husband.name ||
    f.wife.name ||
    f.sons.length > 0 ||
    f.daughters.length > 0;
  console.log("Can add family members:", result);
  return result;
});

const addAllFamilyMembers = () => {
  console.log("Adding all family members to store...");
  if (!props.familyData) return;
  const familyId = props.familyData.id;

  // Add husband and wife immediately
  if (newFamilyMembers.value.husband.name && !hasHusband.value) {
    familyTreeStore.addPerson(
      {
        ...newFamilyMembers.value.husband,
        relation: "Husband",
        linkedFamilyId: familyId,
      },
      true
    );
  }

  if (newFamilyMembers.value.wife.name && !hasWife.value) {
    familyTreeStore.addPerson(
      {
        ...newFamilyMembers.value.wife,
        relation: "Wife",
        linkedFamilyId: familyId,
      },
      true
    );
  }

  // Add sons
  newFamilyMembers.value.sons.forEach((son) => {
    familyTreeStore.addPerson(
      {
        ...son,
        relation: "Son",
        linkedFamilyId: familyId,
      },
      true
    );
  });

  // Add daughters
  newFamilyMembers.value.daughters.forEach((daughter) => {
    familyTreeStore.addPerson(
      {
        ...daughter,
        relation: "Daughter",
        linkedFamilyId: familyId,
      },
      true
    );
  });

  // Reset the form and close the popup after adding members
  newFamilyMembers.value = {
    husband: { name: "", gender: "male" },
    wife: { name: "", gender: "female" },
    sons: [],
    daughters: [],
  };

  closePopup();
};

const closePopup = () => {
  console.log("Closing popup");
  show.value = false; // Update the local show ref
  emit("close");
};
</script>

<style scoped>
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
