<template>
  <div class="person-form">
    <form @submit.prevent="addPerson" class="form-layout">
      <div class="form-group">
        <!-- Use googleName as a placeholder if available -->
        <input
          v-model="name"
          id="name"
          :placeholder="googleName || 'Name'"
          required
          class="form-input"
        />
      </div>
      <div class="form-group">
        <select v-model="gender" id="gender" required class="form-input">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div class="button-group">
        <BaseButton type="submit" variant="primary">Add Person</BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
import BaseButton from "@/components/BaseButton.vue";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";

const store = useFamilyTreeStore();

// We'll use a local ref for the name and gender.
const name = ref("");
const gender = ref("male");

// We'll also hold the Google user's name.
const googleName = ref("");

// On mount, fetch the current user's attributes from Google.
onMounted(async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      const attrs = await fetchUserAttributes();
      // Adjust this based on which attribute holds the user's name.
      googleName.value = attrs?.given_name || attrs?.name || "";
      // If there is no data from S3 (store.persons is empty), prefill the input.
      if (store.persons.length === 0) {
        name.value = googleName.value;
      }
    }
  } catch (error) {
    console.error("Error fetching user attributes:", error);
  }
});

function addPerson() {
  // Initialize the root person.
  store.initializeRootPerson({
    name: name.value,
    gender: gender.value,
  });
  // Reset form fields.
  name.value = "";
  gender.value = "male";
}
</script>

<style scoped>
.person-form {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 15px;
}
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.button-group {
  display: flex;
  gap: 10px;
}
</style>
