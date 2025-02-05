<!-- ./components/BaseButton.vue -->
<template>
  <component
    :is="tag"
    :class="computedClasses"
    :style="extraStyle"
    v-bind="$attrs"
  >
    <slot></slot>
  </component>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "primary", // Options: primary (blue), secondary, danger (red), inprogress (green)
  },
  tag: {
    type: String,
    default: "button", // Defaults to <button>; can be set to "label" if needed
  },
});

const baseClasses =
  "inline-block py-2 px-4 rounded font-medium focus:outline-none";

const computedClasses = computed(() => {
  switch (props.variant) {
    case "primary": // Blue (for Import, Add, etc.)
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    case "inprogress": // Green (for download actions)
      return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
    case "danger": // Red (for Cancel actions)
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    case "secondary": // Gray (if needed)
      return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
    default:
      return baseClasses;
  }
});

// If the tag is "label", add extra style to force inline-block display and pointer cursor.
const extraStyle = computed(() => {
  return props.tag === "label"
    ? { display: "inline-block", cursor: "pointer" }
    : {};
});
</script>
