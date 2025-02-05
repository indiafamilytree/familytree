// File: src/utils/arrayUtils.js

import { ref } from "vue";

export function useArrayManipulation() {
  const tempName = ref("");

  function addItemLocally(array, gender) {
    if (!tempName.value) return;
    array.value.push({ name: tempName.value, gender });
    tempName.value = "";
  }

  function removeItemLocally(array, index) {
    array.value.splice(index, 1);
  }

  return {
    tempName,
    addItemLocally,
    removeItemLocally,
  };
}
