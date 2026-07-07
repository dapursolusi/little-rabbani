import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    FF_NEW_DASHBOARD: z.enum(['0', '1', 'true', 'false']).optional(),
    FF_NEW_AUTH_FLOW: z.enum(['0', '1', 'true', 'false']).optional(),
    FF_NEW_ONBOARDING: z.enum(['0', '1', 'true', 'false']).optional(),
    FF_EXPERIMENTAL_SEARCH: z.enum(['0', '1', 'true', 'false']).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    FF_NEW_DASHBOARD: process.env.FF_NEW_DASHBOARD,
    FF_NEW_AUTH_FLOW: process.env.FF_NEW_AUTH_FLOW,
    FF_NEW_ONBOARDING: process.env.FF_NEW_ONBOARDING,
    FF_EXPERIMENTAL_SEARCH: process.env.FF_EXPERIMENTAL_SEARCH,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
