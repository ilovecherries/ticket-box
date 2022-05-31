import type { UserView } from "../../../services/user";
import { defineStore } from "pinia";

export type IdentityStoreState = {
  user?: UserView;
  token?: string;
};

export const useIdentityStore = defineStore({
  id: "identity",
  state: () => {
    return {
      user: undefined,
      token: undefined,
    } as IdentityStoreState;
  },
  getters: {
    headers: (state): { Authorization?: string } => {
      if (state.token) return { Authorization: `Bearer ${state.token}` };
      else return {};
    },
  },
  actions: {
    async login(username: string, password: string): Promise<string> {
      const res = await fetch("/api/v1/login", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      this.token = data.token;
      this.user = data.user;
      return data.token;
    },
    async register(username: string, password: string): Promise<string> {
      const res = await fetch("/api/v1/register", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      await res.json();
      return await this.login(username, password);
    },
  },
});
