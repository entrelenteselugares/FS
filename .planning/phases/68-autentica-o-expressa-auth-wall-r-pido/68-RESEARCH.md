# Research: Phase 68 - Autenticação Expressa (Auth Wall Rápido)

## 1. Stack and Libraries
- **Frontend Auth**: React Context (`AuthContext.tsx`) which calls a custom backend API (`/auth/login`, `/auth/register`).
- **Backend Auth**: Supabase GoTrue Auth under the hood (`supabaseAdmin`), synchronized with Prisma (`User` table).
- **Social Login Flow**: We will use Supabase's built-in OAuth support for Google and Apple.

## 2. Architecture & Implementation Approach

### Google One-Tap & Apple Sign-In Integration
Because the backend uses Supabase Auth synced to Prisma, we can use the `@supabase/supabase-js` client on the frontend (or redirect via backend) to trigger OAuth.

**Flow:**
1. Frontend calls Supabase OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Supabase handles the OAuth handshake and creates the user in `auth.users`.
3. Frontend receives the session/cookie.
4. When the frontend hits `/auth/me`, the backend's Prisma synchronization logic (already present in `auth.controller.ts`) will detect the Supabase user and automatically create/upsert the Prisma record.

**Modifications needed:**
1. `AuthContext.tsx` needs new methods: `loginWithGoogle()` and `loginWithApple()`.
2. Supabase project needs Google and Apple providers enabled in its Dashboard (Client IDs & Secrets).
3. `AuthModal.tsx`, `LoginPage.tsx`, and `RegisterPage.tsx` will be redesigned to emphasize the Social Login buttons (Google/Apple) over the standard Email/Password forms.

## 3. Pitfalls & Watch-Outs
- **Apple Rejection Risk**: Apple enforces that if you offer Google Sign-In, you MUST offer Apple Sign-In. Also, any app demanding login without clear context might be rejected. The Auth Wall UI must clearly state: "Log in to securely access your private event photos".
- **Cookie Synchronization**: Since the backend uses custom cookies (`API.post('/auth/login')` sets HttpOnly cookies), when using Supabase OAuth on the frontend, we must ensure the backend receives the Supabase Session and generates the same HttpOnly cookie. Or, we change the backend to read the Supabase JWT directly instead of the custom cookie.
- **Role Defaults**: New OAuth users must default to the standard user role (`CLIENTE` or `Público`), allowing them to consume photos but not upload them until they complete the professional application (`/auth/apply-role`).
