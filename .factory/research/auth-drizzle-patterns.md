# BetterAuth + Drizzle + Neon Auth Research Report

> Research conducted: 2026-07-07
> Sources: BetterAuth official docs, Drizzle ORM docs, MakerKit SaaS Kit docs, Drizzle PostgreSQL Best Practices Guide

---

## 1. BetterAuth Setup with Google OAuth

### File Structure

```
src/
├── lib/
│   ├── auth.ts              # Server-side Better Auth instance
│   ├── auth-client.ts       # Client-side auth client
│   └── db/
│       ├── index.ts         # DB client (Drizzle + Neon)
│       └── schema.ts        # Drizzle schema (auth + app tables)
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts  # Better Auth API route handler
│   └── ...
└── middleware.ts             # Auth protection (or proxy.ts for Next.js 16)
```

### Server-Side Auth Instance (`src/lib/auth.ts`)

```ts
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

import { db } from '@/lib/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  plugins: [nextCookies()], // must be last plugin
  // --- Role-based access (see Section 3) ---
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'teacher',
        input: false, // server-set only, not from signup
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

### Client-Side Auth Client (`src/lib/auth-client.ts`)

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});
```

### API Route Handler (`src/app/api/auth/[...all]/route.ts`)

```ts
import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';

export const { GET, POST } = toNextJsHandler(auth.handler);
```

### Environment Variables

```
# Required
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Optional but recommended
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Callback URL

- **Default path:** `http://localhost:3000/api/auth/callback/google`
- **Production:** `https://your-domain.com/api/auth/callback/google`
- Must be registered in Google Cloud Console > Credentials > OAuth 2.0 Client > Authorized redirect URIs.
- Better Auth constructs this automatically from `baseURL` + `basePath` (default: `/api/auth`) + `/callback/google`.

### Key Points

- `@better-auth/drizzle-adapter` package must be installed (`bun add @better-auth/drizzle-adapter`)
- `nextCookies()` plugin handles setting cookies in server actions (without it, server actions can't set auth cookies)
- `drizzleAdapter(db, { provider: "pg" })` — provider must match your dialect
- Enable experimental joins with `experimental: { joins: true }` for 2-3x better performance on read endpoints
- Better Auth generates schema via CLI: `bunx auth@latest generate` — then run `bunx drizzle-kit generate` + `bunx drizzle-kit migrate`

---

## 2. Drizzle + Neon Serverless Setup

### Package Installation

```bash
bun add drizzle-orm@rc @neondatabase/serverless
bun add -D drizzle-kit@rc
```

### Drizzle Config (`drizzle.config.ts`)

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### DB Client (`src/lib/db/index.ts`)

Two options for Neon:

**Option A: Neon HTTP (recommended for serverless — faster for single queries)**

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

**Option B: Neon WebSockets (for transactions / interactive sessions)**

```ts
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### Migrations

```bash
# After schema changes:
bunx drizzle-kit generate    # Generate SQL migration files
bunx drizzle-kit migrate     # Apply migrations

# For rapid dev (no migration files):
bunx drizzle-kit push
```

### Schema Location

- `src/lib/db/schema.ts` — single schema file (simpler) or split into multiple files
- `src/lib/db/` directory keeps DB-related code together, following project conventions
- The `@/*` alias maps to `./src/*`

### Import Pattern

```ts
// DB client
import { db } from "@/lib/db";

// Schema tables
import { users, sessions, etc } from "@/lib/db/schema";

// In auth.ts
import { db } from "@/lib/db";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
```

---

## 3. BetterAuth Role-Based Access Control

### Extending User Schema with Roles

Better Auth supports `additionalFields` on the user object:

```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  // ... database, socialProviders, etc.
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'teacher', // default role
        input: false, // users cannot set this during signup
      },
    },
  },
});
```

After adding `additionalFields`, run:

```bash
bunx auth@latest generate   # Updates Drizzle schema with new columns
bunx drizzle-kit generate   # Generate migration
bunx drizzle-kit migrate    # Apply migration
```

**IMPORTANT:** The `generateId` option in Better Auth defaults to generating random base62 IDs. Better Auth by default does NOT use UUID for the `id` column in PostgreSQL, even though it says "for PG we let database generate UUID." For `text` type IDs, Better Auth generates them client-side. If you want proper UUID columns, configure:

```ts
advanced: {
  database: {
    generateId: "uuid", // or false to let DB handle it
  },
}
```

But the best approach for Better Auth is to let it generate IDs (default) since the Drizzle schema it generates uses `text` type. If you want PG-native UUIDs, use `generateId: "uuid"`.

### Server-Side Role Checks

In server components / server actions:

```ts
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

// Getting session with role
const session = await auth.api.getSession({
  headers: await headers(),
});

// Role check
if (session?.user.role !== 'owner') {
  throw new Error('Unauthorized');
}
```

### Middleware/Proxy Role Protection

**Cookie-based check (fast for redirect):**

```ts
import { NextRequest, NextResponse } from 'next/server';

import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // NOTE: Cookie-only check is NOT secure for role validation.
  // Full session validation is done in each page/server action.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

**Full session validation in middleware (Next.js 15.2+ / 16):**

```ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Role-based route protection
  const url = request.nextUrl.pathname;

  if (url.startsWith('/admin') && session.user.role !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
```

### Manual User Role Assignment (No Self-Registration)

Since `input: false`, users can't set role during signup. Assign via:

**Option A: Database seed script:**

```ts
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';

await db
  .update(user)
  .set({ role: 'owner' })
  .where(eq(user.email, 'admin@example.com'));
```

**Option B: Server action (for admins to assign roles):**

```ts
'use server';
import { headers } from 'next/headers';

import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';

export async function assignUserRole(userId: string, role: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.role !== 'owner') {
    throw new Error('Only owners can assign roles');
  }

  await db.update(user).set({ role }).where(eq(user.id, userId));
}
```

### Roles for the Project

Based on requirements:

- **`owner`** — full access, admin panel
- **`teacher`** — standard user, can manage their classes/students
- **`student`** — learning portal access only (if applicable)

---

## 4. Next.js 16 Specific Considerations

### Middleware → Proxy

Next.js 16 renames `middleware.ts` to `proxy.ts` and `middleware()` function to `proxy()`.

```bash
# Auto-migrate:
npx @next/codemod@canary middleware-to-proxy .
```

**Before (Next.js 15):** `middleware.ts` with `export async function middleware()`
**After (Next.js 16):** `proxy.ts` with `export async function proxy()`

### Better Auth with Next.js 16

- Fully compatible. The `toNextJsHandler` works the same.
- The Next.js 16+ proxy supports Node.js runtime natively, so full session validation via `auth.api.getSession()` works directly in proxy.
- The `nextCookies()` plugin from `better-auth/next-js` is the recommended way to handle server action cookies.

### API Route Handler

The `src/app/api/auth/[...all]/route.ts` pattern is unchanged from Next.js 15.

### Key Changes in Next.js 16

1. **Proxy replaces middleware** — rename file and function
2. **Node.js runtime is default** in proxy — no need for `runtime: "nodejs"` config
3. **Server Actions remain the same** — `"use server"` directive works as before
4. **`headers()` and `cookies()`** from `next/headers` — same API

### Matcher Pattern for Proxy

```ts
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|sign-in|sign-up|$).*)',
  ],
};
```

---

## 5. Drizzle Schema Patterns

### Enums (pgEnum)

```ts
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Using const array pattern (preferred — simpler)
export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'teacher',
  'student',
]);

// Using TypeScript enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
export const userStatusEnum = pgEnum(
  'user_status',
  Object.values(UserStatus) as [string, ...string[]]
);
```

### UUID Primary Keys

```ts
import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(), // Better Auth uses text IDs by default
  // ... OR if using DB-generated UUIDs:
  // id: uuid("id").defaultRandom().primaryKey(),
  // id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
});
```

### JSONB Columns

```ts
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  preferences: jsonb('preferences').$type<{
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  }>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});
```

### Timestamps

```ts
import { timestamp } from 'drizzle-orm/pg-core';

// Reusable timestamp pattern
export const timestamps = {
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
};
```

### Relations

```ts
import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Example app-specific table
export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const classesRelations = relations(classes, ({ one }) => ({
  teacher: one(user, {
    fields: [classes.teacherId],
    references: [user.id],
  }),
}));
```

### Complete Schema Example

```ts
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ── Enums ──
export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'teacher',
  'student',
]);

// ── Better Auth Core Tables ──
// These are the fields Better Auth expects for the `user` table.
// When you run `bunx auth@latest generate`, Better Auth generates the
// Drizzle schema. The `role` field is added via `additionalFields` in auth config.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // role is added automatically when configured in auth.ts additionalFields
  role: userRoleEnum('role').default('teacher').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    mode: 'date',
  }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// ── Relations ──
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
```

### Key Drizzle Patterns Summary

| Feature          | Pattern                                                  |
| ---------------- | -------------------------------------------------------- |
| Enum             | `pgEnum("name", ["val1", "val2"])`                       |
| UUID PK          | `uuid("id").defaultRandom().primaryKey()`                |
| Text PK          | `text("id").primaryKey()`                                |
| JSONB with types | `jsonb("col").$type<{ ... }>()`                          |
| Timestamps       | `timestamp("col", { mode: "date", withTimezone: true })` |
| Default now      | `.defaultNow().notNull()`                                |
| Auto-update      | `.$onUpdateFn(() => new Date())`                         |
| Foreign key      | `.references(() => table.id, { onDelete: "cascade" })`   |
| Relations        | `relations(table, ({ one, many }) => ({ ... }))`         |
| Index            | `index("name").on(table.column)`                         |

---

## Summary: Implementation Order

1. **Install packages:** `bun add drizzle-orm@rc @neondatabase/serverless @better-auth/drizzle-adapter better-auth` and `bun add -D drizzle-kit@rc`
2. **Create `drizzle.config.ts`** pointing to `./src/lib/db/schema.ts`
3. **Create DB client** in `src/lib/db/index.ts` using `drizzle-orm/neon-http`
4. **Create auth server instance** in `src/lib/auth.ts` with Google OAuth + Drizzle adapter + `additionalFields.role`
5. **Create auth client** in `src/lib/auth-client.ts`
6. **Create API route** at `src/app/api/auth/[...all]/route.ts`
7. **Generate schema:** `bunx auth@latest generate` then `bunx drizzle-kit generate` + `bunx drizzle-kit migrate`
8. **Set up proxy/middleware** for route protection
9. **Set environment variables** (see Section 1)
