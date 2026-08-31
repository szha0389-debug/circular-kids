import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
// Self-hosted font faces, loaded before the stylesheet that uses them.
import "@fontsource/fraunces/latin-700.css";
import "@fontsource/fraunces/latin-900.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "./styles/main.scss";

createApp(App).use(createPinia()).use(router).mount("#app");
