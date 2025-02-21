// ./main.js
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
