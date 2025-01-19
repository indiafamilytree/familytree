<!-- filepath: /Users/nkannaiyan/Code/ChatGPTApps/FamilyTree/family-tree-app/src/App.vue -->
<template>
  <div class="relative">
    <PersonForm />
    <FamilyChart />
  </div>
</template>

<script setup>
import FamilyChart from "@/components/FamilyChart.vue";
import PersonForm from "@/components/PersonForm.vue";
</script>
