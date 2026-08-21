import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import type { User } from "@supabase/supabase-js";

const authUserStorage = new AsyncLocalStorage<User>();

export const RequestAuthContextService = {
  getAuthUser() {
    return authUserStorage.getStore() ?? null;
  },

  runWithAuthUser<T>(user: User, operation: () => Promise<T>) {
    return authUserStorage.run(user, operation);
  },
};
