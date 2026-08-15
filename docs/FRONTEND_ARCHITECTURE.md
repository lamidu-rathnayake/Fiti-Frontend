# Fiti Frontend Architecture & Authentication Flow

> **Status:** Implemented — this document reflects the current live codebase.

This document outlines the frontend architecture for authentication (registration, login, logout) and Role-Based Access Control (RBAC) designed to handle a clear separation between **Firebase Authentication** (identity), **Firestore** (profile cache), and **PostgreSQL via the Fiti Backend API** (authoritative roles and domain data).

---

## 1. Authentication Strategy

| Layer | Technology | Purpose |
|---|---|---|
| Identity Provider | Firebase Authentication | Email/Password & Google SSO |
| Profile Cache | Firebase Firestore | Stores `UserProfile` as fallback while backend is being called |
| Authorization & Domain Data | PostgreSQL via Fiti Backend | Authoritative roles stored in `user_roles` table |

### 1.1 Registration Flow (Onboarding)

New users land on `/onboarding` after their first Google or email sign-in. Registration is a two-phase process:

**Phase 1 — Firebase Authentication:**
- User signs in via Google (`signInWithPopup`) or creates an account via email/password.
- Firebase creates the user and returns a `UserCredential` with a `uid`.
- If no role exists in PostgreSQL yet, the user is redirected to `/onboarding`.

**Phase 2 — Backend Sync (Onboarding form submission):**
- User selects their role (`client` or `tailor`) and fills in profile fields (including `profile_picture_url`).
- Frontend calls `firebaseUser.getIdToken()` to get the Firebase ID Token.
- Depending on the selected role, the frontend POSTs to:
  - `POST /api/v1/profiles/client` (Payload includes `profile_picture_url`)
  - `POST /api/v1/profiles/tailor` (Payload includes `profile_picture_url`)
- The backend creates the profile record in PostgreSQL **and** inserts a row into `user_roles`.
- The Firestore `users` document is also updated as a local cache.
- `dbRole` is set in `AuthContext` and the user is redirected to their dashboard.

### 1.2 Login Flow

1. User logs in via email/password (`signInWithEmailAndPassword`) or Google (`signInWithPopup`).
2. Firebase SDK persists the session in Local Storage / IndexedDB.
3. Frontend calls `GET /api/v1/auth/me/role` with the Firebase JWT Bearer token.
4. Backend queries PostgreSQL `user_roles` and returns the role.
5. Frontend redirects:
   - `"client"` → `/client/home`
   - `"tailor"` → `/tailor/home`
   - No role / 404 → `/onboarding`

### 1.3 Logout Flow

1. Frontend calls `signOut(auth)` from Firebase.
2. `AuthContext` sets both `user` and `dbRole` to `null`.
3. User is redirected to `/login`.

---

## 2. Role-Based Page Access Control (RBAC)

### 2.1 Current Route Structure

```
/login
/onboarding
/client
   /home
/tailor
   /home
```

### 2.2 Auth Context & State

`AuthContext.ts` exports the following from `useAuth()`:

| Export | Type | Source |
|---|---|---|
| `user` | `UserProfile \| null` | Firebase + Firestore profile data |
| `dbRole` | `Role \| null` | PostgreSQL via `GET /api/v1/auth/me/role` |
| `loading` | `boolean` | Auth initialization state |
| `logout` | `() => Promise<void>` | Signs out of Firebase, clears state |
| `setRole` | `(role: Role) => Promise<void>` | Sets `dbRole` locally after onboarding |

> **Note:** `dbRole` is the authoritative role from PostgreSQL and is kept separate from `user.role` (which is the Firestore-cached copy). Protected routes use `dbRole` for all access decisions.

### 2.3 Protected Route Implementation

Protection is handled by `app/(protected)/layout.tsx` (Next.js App Router layout pattern — equivalent to a `ProtectedRoute` wrapper):

```
Not authenticated  →  redirect to /login
Authenticated, no dbRole  →  redirect to /onboarding
Client trying /tailor/*  →  redirect to /client/home
Tailor trying /client/*  →  redirect to /tailor/home
```

---

## 3. Backend Compatibility Requirements

The backend must implement the following to be compatible with this frontend:

1. **`GET /api/v1/auth/me/role`** — Verify Firebase JWT, query `user_roles` PostgreSQL table, return `{ "role": "client" }` or `{ "role": "tailor" }`. Return `404` if no role found.

2. **`POST /api/v1/profiles/client`** and **`POST /api/v1/profiles/tailor`** — Verify Firebase JWT, insert profile into PostgreSQL, and insert a row into `user_roles` to assign the role.

3. **`require_role` dependency (security.py)** — Must query PostgreSQL `user_roles`, not Firestore.

> See [`docs/api/API_REFERENCE.md`](./docs/api/API_REFERENCE.md) for the full API contract with exact request/response shapes.
