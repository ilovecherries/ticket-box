import { createApp } from "vue";
import { createPinia } from "pinia";
import Oruga from "@oruga-ui/oruga-next";

import App from "./App.vue";
import router from "./router";

import "@/assets/global.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.use(Oruga, {
  iconPack: "fas",
});

app.mount("#app");
