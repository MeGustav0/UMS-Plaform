import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

const app = createApp(App);

app.use(store);
app.use(router);

// 🧠 Восстанавливаем пользователя
const savedUser = localStorage.getItem("auth");
if (savedUser) {
  store.commit("auth/SET_USER", JSON.parse(savedUser));

  // ⛓ Загружаем организации и пользователей
  store.dispatch("organizations/fetchOrganizations").then(() => {
    const orgs = store.state.organizations.organizations;
    const userIds = new Set();

    orgs.forEach((org) => {
      org.members?.forEach((m) => userIds.add(m.userId));
    });

    store.dispatch("users/fetchUsersByIds", Array.from(userIds));
  });
}

app.mount("#app");