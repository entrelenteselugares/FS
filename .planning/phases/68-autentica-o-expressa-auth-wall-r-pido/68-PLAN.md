# Plan: Phase 68 - Autenticação Expressa (Auth Wall Rápido)

## 1. Goal

Implementar Social Login de 1-click (Apple e Google) com redesign do modal de Auth Wall para reduzir ao máximo a fricção de entrada dos usuários no app.

## 2. Requirements Addressed

- AUTH-01: O usuário deve poder criar conta ou fazer login com apenas 1 clique usando sua conta Google.
- AUTH-02: O usuário deve poder criar conta ou fazer login com apenas 1 clique usando sua conta Apple.
- AUTH-03: Os modais de Auth Wall devem ser redesenhados para dar destaque absoluto aos botões de Social Login.

## 3. Implementation Steps

### Step 1: Update AuthContext for Social Login (Logic)

- **Target File:** `frontend/src/contexts/AuthContext.tsx`
- **Action:** Import `supabase` from `lib/supabase` (create it if not exported).
- **Action:** Add `loginWithGoogle` function which calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
- **Action:** Add `loginWithApple` function which calls `supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } })`.
- **Action:** Update the `useEffect` initialization to correctly detect a Supabase OAuth session on callback, extract the JWT, and post it to the backend to establish the HttpOnly cookie, or simply rely on `API.get('/auth/me')` to trigger Prisma synchronization.

### Step 2: Redesign AuthModal (UI)

- **Target File:** `frontend/src/components/AuthModal.tsx`
- **Action:** Reorder elements to place large, prominent "Continue with Google" and "Continue with Apple" buttons at the top of the modal.
- **Action:** Move the standard Email/Password form below a visual divider ("ou use seu e-mail").
- **Action:** Connect the new buttons to `loginWithGoogle` and `loginWithApple` from `AuthContext`.

### Step 3: Redesign Login and Register Pages (UI)

- **Target Files:** `frontend/src/pages/LoginPage.tsx` & `frontend/src/pages/RegisterPage.tsx`
- **Action:** Apply the same prominent Social Login buttons at the top of the forms.
- **Action:** Use Lucide icons (`IconBrandGoogle`, `IconBrandApple` or generic placeholders if using a different icon set) for visual polish.

### Step 4: Backend OAuth Sync Compatibility

- **Target File:** `backend/src/controllers/auth.controller.ts`
- **Action:** Ensure the `/auth/me` or a dedicated `/auth/oauth-callback` endpoint can accept a Supabase JWT from the frontend, verify it using `supabaseAdmin.auth.getUser(token)`, and set the standard HttpOnly `session` cookie. This bridges the frontend OAuth flow with the backend's cookie-based authentication.

## 4. Verification

- Verify that clicking Google opens the Google consent screen.
- Verify that after consent, the user is redirected back to the app and is logged in.
- Verify `AuthModal` visual hierarchy.
