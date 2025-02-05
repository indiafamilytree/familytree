// ./main.js
import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import "./assets/main.css"; // Import Tailwind CSS

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
