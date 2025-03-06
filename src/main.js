// ./main.js
import { debug } from "debug";
// Set the debug level using localStorage
//localStorage.setItem("debug", "familyTree:save");
//debug.enable("familyTree:save");

import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import "./assets/main.css"; // Import Tailwind CSS
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const app = createApp(App);
app.use(createPinia());
app.mount("#app");

// Initialize auto-save logic for the family tree store.
import { useFamilyTreeStore } from "@/stores/family-tree-store/index";
const familyTreeStore = useFamilyTreeStore();
familyTreeStore.initAutoSave();
