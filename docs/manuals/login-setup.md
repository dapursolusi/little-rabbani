# Login Setup Manual

## The Problem

Login fails with:

```
http://localhost:3000/login?error=access_denied&error=signup_disabled
```

### Root Cause

The app uses `disableImplicitSignUp: true` in `src/lib/auth.ts`. This means BetterAuth rejects any Google sign-in attempt unless the Google account is already linked to a user in the database (an `account` table row must exist linking the Google account ID to a user).

The `account` table in the database is empty. No Google accounts are linked. So every Google sign-in attempt is rejected.

There are two solutions: the **dev bypass** (instant, no Google config needed) and the **Google OAuth setup** (for real authentication).

---

## Solution 1: Dev Auth Bypass (Fastest)

This uses a built-in dev-only endpoint (`POST /api/auth/dev-session`) that creates a session directly in the database without Google OAuth. It requires `DEV_AUTH_BYPASS=1` in `.env.development` (already set).

### Steps

1. **Ensure the dev server is running:**

   ```bash
   bun run dev
   ```

   Verify it starts on `http://localhost:3000`.

2. **Create a dev session for the Owner account:**

   Open a new terminal and run:

   ```bash
   curl -X POST http://localhost:3000/api/auth/dev-session \
     -H "Content-Type: application/json" \
     -d '{"email": "owner@littlerabbani.com"}'
   ```

   You should see a response like:

   ```json
   {
     "success": true,
     "user": {
       "id": "30641d4f-...",
       "email": "owner@littlerabbani.com",
       "name": "Owner",
       "role": "owner"
     },
     "session": { ... }
   }
   ```

   The response sets a `better-auth.session_token` cookie. However, `curl` does not share cookies with your browser, so this alone won't log you into the browser.

3. **Extract the session token and inject it into your browser:**

   Run this to get just the cookie value:

   ```bash
   curl -s -X POST http://localhost:3000/api/auth/dev-session \
     -H "Content-Type: application/json" \
     -d '{"email": "owner@littlerabbani.com"}' \
     -D - -o /dev/null 2>/dev/null | grep -i set-cookie
   ```

   This prints the `Set-Cookie` header. Copy the full cookie value (the part after `better-auth.session_token=` up to the first `;`).

4. **Set the cookie in your browser:**

   - Open `http://localhost:3000` in Chrome/Firefox.
   - Open DevTools (F12) > Application > Cookies > `http://localhost:3000`.
   - Add a new cookie:
     - **Name:** `better-auth.session_token`
     - **Value:** (paste the decoded value from step 3 - it looks like `UUID.BASE64SIG`)
     - **Path:** `/`
     - **HttpOnly:** yes (browsers don't enforce this in DevTools)
   - Refresh the page. You should be redirected to `/dashboard/owner`.

   Alternatively, use a browser extension like "EditThisCookie" to set it.

5. **For Teacher login**, repeat with:

   ```bash
   curl -X POST http://localhost:3000/api/auth/dev-session \
     -H "Content-Type: application/json" \
     -d '{"email": "teacher@littlerabbani.com"}'
   ```

### Available Test Accounts

| Email                       | Role    | Name         |
| --------------------------- | ------- | ------------ |
| `owner@littlerabbani.com`   | Owner   | Owner        |
| `teacher@littlerabbani.com` | Teacher | Teacher Satu |

---

## Solution 2: Google OAuth Setup (Real Authentication)

To enable real Google OAuth login, you need to link your Google account to a database user.

### Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project.
3. Navigate to **APIs & Services > Credentials**.
4. Find your OAuth 2.0 Client ID (starts with `343603746353-`).

5. Under **Authorized redirect URIs**, ensure these are listed:

   ```
   http://localhost:3000/api/auth/callback/google
   https://localhost:3000/api/auth/callback/google
   ```

   For production, also add:

   ```
   https://your-domain.com/api/auth/callback/google
   ```

6. Under **Authorized JavaScript origins**, ensure:

   ```
   http://localhost:3000
   ```

7. Save.

### Step 2: Temporarily Disable Sign-Up Block

To link your Google account for the first time, you need to temporarily allow implicit sign-up.

1. Edit `src/lib/auth.ts`.
2. Change `disableImplicitSignUp` from `true` to `false`:

   ```typescript
   socialProviders: {
     google: {
       clientId: process.env.GOOGLE_CLIENT_ID as string,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
       disableImplicitSignUp: false, // <-- temporarily false
     },
   },
   ```

3. Restart the dev server.

### Step 3: Sign In with Google to Create the Account Link

1. Go to `http://localhost:3000/login`.
2. Click "Masuk dengan Google".
3. Sign in with your Google account (use the email `owner@littlerabbani.com` if you own that Google account, or your personal Gmail).
4. After successful login, check the `account` table in the database:

   ```sql
   SELECT id, user_id, provider_id, account_id FROM "account";
   ```

   You should see a row with `provider_id = 'google'` linking your Google account ID to a user.

### Step 4: Re-Enable Sign-Up Block

1. Edit `src/lib/auth.ts` again.
2. Change `disableImplicitSignUp` back to `true`:

   ```typescript
   disableImplicitSignUp: true,
   ```

3. Restart the dev server.

Now only Google accounts that are already linked to a database user can sign in. New Google accounts will be rejected.

### Step 5: Link Additional Google Accounts (Optional)

If you want to link more Google accounts (e.g., for the Teacher):

1. Temporarily set `disableImplicitSignUp: false`.
2. Sign in with the new Google account.
3. Manually update the user role if needed:

   ```sql
   UPDATE "user" SET role = 'teacher' WHERE email = 'newteacher@gmail.com';
   ```

4. Set `disableImplicitSignUp: true` again.

---

## Environment Variables Checklist

Ensure your `.env.development` has all of these:

| Variable                       | Required | Description                                        |
| ------------------------------ | -------- | -------------------------------------------------- |
| `DATABASE_URL`                 | Yes      | Neon Postgres connection string                    |
| `BETTER_AUTH_SECRET`           | Yes      | Random secret string for session signing           |
| `NEXT_PUBLIC_BETTER_AUTH_URL`  | Yes      | `http://localhost:3000` for local dev              |
| `GOOGLE_CLIENT_ID`             | Yes      | Google OAuth Client ID                             |
| `GOOGLE_CLIENT_SECRET`         | Yes      | Google OAuth Client Secret                         |
| `OPENROUTER_API_KEY`           | Yes      | OpenRouter API key for AI features                 |
| `OPENROUTER_MODEL`             | Yes      | Model name (default: `deepseek/deepseek-v4-flash`) |
| `VAPID_PUBLIC_KEY`             | Yes      | Web Push VAPID public key                          |
| `VAPID_PRIVATE_KEY`            | Yes      | Web Push VAPID private key                         |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes      | Same as `VAPID_PUBLIC_KEY`                         |
| `DEV_AUTH_BYPASS`              | Optional | Set to `1` to enable dev session bypass            |

---

## Troubleshooting

### "Akun Anda tidak terdaftar" (Access Denied)

This means `disableImplicitSignUp: true` is blocking your Google account because it is not linked in the `account` table. Use Solution 1 (dev bypass) or Solution 2 Step 2 (temporarily disable the block).

### OAuth redirect mismatch error

Ensure the redirect URI in Google Cloud Console exactly matches:

```
http://localhost:3000/api/auth/callback/google
```

### Cookie not working after dev-session

The cookie value is URL-encoded. Make sure you decode it before pasting into the browser DevTools cookie editor. The raw value looks like:

```
UUID_TOKEN.HMAC_SIGNATURE
```

### Logout

To log out, either:

- Click the logout button in the dashboard.
- Delete the `better-auth.session_token` cookie from browser DevTools.
- Run: `curl -X POST http://localhost:3000/api/auth/sign-out`
