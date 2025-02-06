<!-- ./components/PersonNodeForm.vue -->
<template>
  <div class="person-node-form">
    <!-- Family Option at the Top -->
    <div
      class="options-top"
      v-if="
        !awaitSecondPerson &&
        !showImmediateFamilyForm &&
        !showAncestralFamilyForm
      "
    >
      <label class="options-label">Family Option:</label>
      <select
        v-model="selectedFamilyOption"
        @change="handleOptionSelection"
        class="option-select"
      >
        <option disabled value="">-- Select an Option --</option>
        <option value="immediate">Immediate</option>
        <option value="ancestral">Ancestral</option>
        <option value="existing">Family with Existing Node</option>
      </select>
    </div>

    <!-- When awaiting a second person selection -->
    <div v-if="awaitSecondPerson" class="form-section">
      <h4>Family with Existing Node</h4>
      <p>Please select a second person from the chart.</p>
      <div class="button-group">
        <BaseButton
          @click="cancelExistingFamily"
          variant="danger"
          class="cancel-button"
        >
          Cancel
        </BaseButton>
      </div>
    </div>

    <!-- Immediate Family Form -->
    <div v-if="showImmediateFamilyForm" class="form-section">
      <h4>Add Immediate Family</h4>
      <div class="form-group">
        <label>Spouse Name:</label>
        <input type="text" v-model="spouseName" />
      </div>

      <div class="form-group">
        <label>New Son:</label>
        <div class="input-group">
          <input v-model="tempSonName" type="text" />
          <BaseButton
            @click="addSonLocally"
            variant="primary"
            class="add-button"
            >+</BaseButton
          >
        </div>
        <ul>
          <li v-for="(son, i) in newSons" :key="i" class="list-item">
            <span>{{ son.name }}</span>
            <BaseButton
              @click="removeSonLocally(i)"
              variant="danger"
              class="remove-button"
              >X</BaseButton
            >
          </li>
        </ul>
      </div>

      <div class="form-group">
        <label>New Daughter:</label>
        <div class="input-group">
          <input v-model="tempDaughterName" type="text" />
          <BaseButton
            @click="addDaughterLocally"
            variant="primary"
            class="add-button"
            >+</BaseButton
          >
        </div>
        <ul>
          <li v-for="(daughter, i) in newDaughters" :key="i" class="list-item">
            <span>{{ daughter.name }}</span>
            <BaseButton
              @click="removeDaughterLocally(i)"
              variant="danger"
              class="remove-button"
              >X</BaseButton
            >
          </li>
        </ul>
      </div>

      <div class="button-group">
        <BaseButton @click="confirmImmediateFamily" variant="primary"
          >Create Family</BaseButton
        >
        <BaseButton @click="cancel" variant="danger">Cancel</BaseButton>
      </div>
    </div>

    <!-- Ancestral Family Form -->
    <div v-if="showAncestralFamilyForm" class="form-section">
      <h4>Add Ancestral Family</h4>
      <div class="form-group">
        <label>Father Name:</label>
        <input type="text" v-model="fatherName" />
      </div>
      <div class="form-group">
        <label>Mother Name:</label>
        <input type="text" v-model="motherName" />
      </div>
      <div class="button-group">
        <BaseButton @click="confirmAncestralFamily" variant="primary"
          >Create Ancestral Family</BaseButton
        >
        <BaseButton @click="cancel" variant="danger">Cancel</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted } from "vue";
import { useFamilyForm } from "@/composables/useFamilyForm";
import BaseButton from "@/components/BaseButton.vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
const store = useFamilyTreeStore();

const props = defineProps({
  personData: { type: Object, required: true },
});
const emit = defineEmits(["update:personData", "close", "await-second-person"]);

const {
  spouseName,
  fatherName,
  motherName,
  newSons,
  newDaughters,
  tempSonName,
  tempDaughterName,
  addSonLocally,
  removeSonLocally,
  addDaughterLocally,
  removeDaughterLocally,
  createImmediateFamily,
  createAncestralFamily,
  resetForm,
} = useFamilyForm();

// New state for the dropdown and for awaiting second person selection.
const selectedFamilyOption = ref("");
const awaitSecondPerson = ref(false);
const showImmediateFamilyForm = ref(false);
const showAncestralFamilyForm = ref(false);

function handleOptionSelection() {
  console.log("Dropdown changed, value:", selectedFamilyOption.value);
  if (selectedFamilyOption.value === "immediate") {
    showImmediateFamilyForm.value = true;
    showAncestralFamilyForm.value = false;
    awaitSecondPerson.value = false;
    window.awaitSecondPerson = false;
    console.log("Immediate Family option selected.");
  } else if (selectedFamilyOption.value === "ancestral") {
    showAncestralFamilyForm.value = true;
    showImmediateFamilyForm.value = false;
    awaitSecondPerson.value = false;
    window.awaitSecondPerson = false;
    console.log("Ancestral Family option selected.");
  } else if (selectedFamilyOption.value === "existing") {
    awaitSecondPerson.value = true;
    window.awaitSecondPerson = true; // Set the global flag for FamilyChart to detect.
    emit("await-second-person", true);
    showImmediateFamilyForm.value = false;
    showAncestralFamilyForm.value = false;
    console.log(
      "Family with Existing Node option selected. Awaiting second person selection."
    );
  }
}

function cancelExistingFamily() {
  console.log("Cancel existing family option.");
  awaitSecondPerson.value = false;
  window.awaitSecondPerson = false; // Reset global flag.
  emit("await-second-person", false);
  selectedFamilyOption.value = "";
}

function confirmImmediateFamily() {
  console.log("Confirming immediate family for", props.personData);
  createImmediateFamily(props.personData);
  emit("update:personData", { ...props.personData });
  emit("close");
  showImmediateFamilyForm.value = false;
  resetForm();
}

function confirmAncestralFamily() {
  console.log("Confirming ancestral family for", props.personData);
  createAncestralFamily(props.personData);
  emit("update:personData", { ...props.personData });
  emit("close");
  showAncestralFamilyForm.value = false;
  resetForm();
}

function cancel() {
  console.log("Cancel family form.");
  showImmediateFamilyForm.value = false;
  showAncestralFamilyForm.value = false;
  selectedFamilyOption.value = "";
  resetForm();
  emit("close");
}

// Global event listener for second person selection.
function secondPersonEventHandler(e) {
  console.log("Received 'second-person-selected' event with detail:", e.detail);
  if (awaitSecondPerson.value && e.detail) {
    onSecondPersonSelected(e.detail);
  } else {
    console.log("Not awaiting second person selection or no detail provided.");
  }
}

function onSecondPersonSelected(secondPerson) {
  console.log("Second person selected:", secondPerson);
  createFamilyFromNodes(props.personData, secondPerson);
  awaitSecondPerson.value = false;
  window.awaitSecondPerson = false; // Reset global flag.
  emit("await-second-person", false);
  emit("close");
  resetForm();
}

// Example function: Create a family node from two person nodes.
function createFamilyFromNodes(person1, person2) {
  let husbandId, wifeId;
  if (person1.gender === "male" && person2.gender === "female") {
    husbandId = person1.id;
    wifeId = person2.id;
  } else if (person1.gender === "female" && person2.gender === "male") {
    husbandId = person2.id;
    wifeId = person1.id;
  } else {
    // For same-gender cases, assign arbitrarily (or add custom logic)
    husbandId = person1.id;
    wifeId = person2.id;
  }
  const familyId = `family-${Date.now()}`;
  const newFamily = {
    id: familyId,
    husbandId,
    wifeId,
    sons: [],
    daughters: [],
  };

  // Push the new family into the store
  store.families.push(newFamily);
  console.log("New family created from nodes:", newFamily);

  // Add a family node so that it appears in the chart
  store.nodes.push({
    data: { id: familyId, label: "Family", isFamily: true },
  });

  // Create edges for the spouses
  store.edges.push({
    data: { source: husbandId, target: familyId, label: "Husband" },
  });
  store.edges.push({
    data: { source: wifeId, target: familyId, label: "Wife" },
  });

  // If your chart is reactive (watching store.families/nodes/edges), it should now update automatically.
}

onMounted(() => {
  console.log(
    "PersonNodeForm mounted, adding event listener for 'second-person-selected'"
  );
  window.addEventListener("second-person-selected", secondPersonEventHandler);
});
onUnmounted(() => {
  console.log(
    "PersonNodeForm unmounted, removing event listener for 'second-person-selected'"
  );
  window.removeEventListener(
    "second-person-selected",
    secondPersonEventHandler
  );
});
</script>

<style scoped>
.person-node-form {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  font-family: sans-serif;
}
.options-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
}
.options-label {
  font-weight: 600;
  margin-bottom: 5px;
}
.option-select {
  padding: 5px;
  font-size: 1rem;
  width: 100%;
  max-width: 250px;
}
.form-section {
  margin-bottom: 15px;
}
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
label {
  margin-bottom: 5px;
  font-weight: 500;
}
input[type="text"] {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}
.input-group {
  display: flex;
  align-items: center;
  gap: 5px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 5px 0;
}
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
}
.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
