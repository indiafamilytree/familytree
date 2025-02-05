<!-- ./components/FamilyNodePopup.vue -->
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
          <BaseButton @click="addSon" variant="primary">Add Son</BaseButton>
          <ul>
            <li v-for="(son, index) in newFamilyMembers.sons" :key="index">
              {{ son.name }}
              <BaseButton @click="removeSon(index)" variant="danger"
                >Remove</BaseButton
              >
            </li>
          </ul>
        </div>

        <div class="form-group">
          <label for="daughter-name">Daughters:</label>
          <input type="text" id="daughter-name" v-model="newDaughterName" />
          <BaseButton @click="addDaughter" variant="primary"
            >Add Daughter</BaseButton
          >
          <ul>
            <li
              v-for="(daughter, index) in newFamilyMembers.daughters"
              :key="index"
            >
              {{ daughter.name }}
              <BaseButton @click="removeDaughter(index)" variant="danger"
                >Remove</BaseButton
              >
            </li>
          </ul>
        </div>

        <BaseButton
          @click="addAllFamilyMembers"
          :disabled="!canAddFamilyMembers"
          variant="primary"
        >
          Add All
        </BaseButton>
      </div>

      <BaseButton @click="closePopup" variant="danger">Close</BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";

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
    show.value = !!newFamilyData;
  },
  { immediate: true }
);

const hasHusband = computed(() => {
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
  return result;
});

const hasWife = computed(() => {
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
  return result;
});

const addSon = () => {
  if (newSonName.value) {
    newFamilyMembers.value.sons.push({
      name: newSonName.value,
      gender: "male",
    });
    newSonName.value = "";
  }
};

const removeSon = (index) => {
  newFamilyMembers.value.sons.splice(index, 1);
};

const addDaughter = () => {
  if (newDaughterName.value) {
    newFamilyMembers.value.daughters.push({
      name: newDaughterName.value,
      gender: "female",
    });
    newDaughterName.value = "";
  }
};

const removeDaughter = (index) => {
  newFamilyMembers.value.daughters.splice(index, 1);
};

const canAddFamilyMembers = computed(() => {
  const f = newFamilyMembers.value;
  return (
    f.husband.name || f.wife.name || f.sons.length > 0 || f.daughters.length > 0
  );
});

const addAllFamilyMembers = () => {
  if (!props.familyData) return;
  const familyId = props.familyData.id;
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
  newFamilyMembers.value = {
    husband: { name: "", gender: "male" },
    wife: { name: "", gender: "female" },
    sons: [],
    daughters: [],
  };
  closePopup();
};

const closePopup = () => {
  show.value = false;
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
  z-index: 10;
}
.popup-content {
  padding: 11px;
}
</style>
