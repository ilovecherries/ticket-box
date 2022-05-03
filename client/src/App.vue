<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RouterLink, RouterView } from "vue-router";
import { useIdentityStore } from "./stores/identity";

const identity = useIdentityStore();

const { user } = storeToRefs(identity);

const testUsername = "Quack";
const testPassword = "Dingleson";

const register = async () => {
  await identity.register(testUsername, testPassword);
};

const login = async () => {
  await identity.login(testUsername, testPassword);
};
</script>

<template>
  <div class="h-100 w-100">
    <nav class="flex flex-row w-100 p-4 border-b">
      <div class="grow">
        <RouterLink class="text-black text-2xl no-underline" to="/">
          pBox
        </RouterLink>
      </div>
      <div v-if="!user">
        <o-button @click="register">Register</o-button>
        <o-button @click="login">Login</o-button>
      </div>
      <div>
        <span>{{ user?.username || "Not logged in" }}</span>
      </div>
    </nav>
    <RouterView />
  </div>
</template>

<style>
/* html, */
/* body {
  position: fixed;
  overflow: hidden;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
} */
</style>
