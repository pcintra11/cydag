import { createAuthClient } from 'better-auth/react';

import { EnvDeployConfig } from '../app_base/envs';

export const authClient = createAuthClient({
  baseURL: EnvDeployConfig().app_url,
  // process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});