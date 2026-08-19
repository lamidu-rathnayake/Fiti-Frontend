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

### 1.1 Registration Flow

Users can register through role-specific registration pages (`/register` for Clients, `/register/tailor` for Tailors). The process consists of two synchronized phases:

**Phase 1 — Firebase Authentication & Firestore (Cache):**
- User creates an account via email/password.
- Firebase Auth creates the user and returns a `UserCredential` with a `uid`.
- The frontend immediately creates a `users/{uid}` document in Firestore to cache the profile (see Data Separation below).

**Phase 2 — Backend Sync & Role Assignment:**
- Frontend retrieves the Firebase ID Token (`getIdToken()`).
- Depending on the selected role, the frontend POSTs to backend APIs to create authoritative profiles and shop data in PostgreSQL.
- To prevent race conditions where the auth state resolves before the Firestore document is fully written, `AuthContext` uses a real-time `onSnapshot` listener on the Firestore `users/{uid}` document. This instantly syncs the newly written role into the local state.
- `setRole` handles the fallback to `auth.currentUser` if the context hasn't fully hydrated yet.
- The user is seamlessly redirected to their respective dashboard (`/client/home` or `/tailor/home`).
- *Note: If a user logs in but lacks an authoritative role or incomplete profile, they are redirected to `/onboarding`.*

### 1.2 Data Separation: Firebase vs Backend

To maintain a clear separation of concerns, data is distributed across three systems during registration:

#### Firebase Authentication (Identity)
- **Data stored:** Email, Password (hashed), `uid`, Display Name, Photo URL.

#### Firebase Firestore (Profile Cache)
Used as a fast, client-side accessible profile cache for the frontend UI. Stored in the `users` collection:
- **Client Data:** `uid`, `email`, `displayName`, `photoURL`, `role: "client"`, `phone`, `city`, `address`, `createdAt`, `updatedAt`.
- **Tailor Data:** `uid`, `email`, `displayName`, `photoURL`, `role: "tailor"`, `shopName`, `specialty`, `city`, `phone`, `address`, `createdAt`, `updatedAt`.

#### PostgreSQL via Backend APIs (Authoritative Domain)
The authoritative source for RBAC, relational data, and domain logic.
- **Roles:** The backend automatically manages the `user_roles` table, tracking the authoritative role for each `uid`.
- **Client Profile:** Created via `POST /api/v1/profiles/client`.
- **Tailor Profile:** Created via `POST /api/v1/profiles/tailor` (Payload: `specialty`, `nic_front`, `nic_rear`).
- **Tailor Shop:** Created via `POST /api/v1/shops/` (Payload: `tailor_id` (uid), `shop_name`, `shop_address`, `city`, `contact_number`, `profile_picture_url`).

### 1.3 Login Flow

1. User logs in via email/password (`signInWithEmailAndPassword`) or Google (`signInWithPopup`).
2. Firebase SDK persists the session in Local Storage / IndexedDB.
3. `AuthContext` sets up a real-time `onSnapshot` listener to fetch the cached profile from Firestore.
4. Concurrently, the frontend calls `GET /api/v1/auth/me/role` with the Firebase JWT Bearer token to fetch the authoritative role from PostgreSQL.
5. The router's layout (`ProtectedLayout`) redirects based on the authoritative `dbRole`:
   - `"client"` → `/client/home`
   - `"tailor"` → `/tailor/home`
   - No role / 404 → `/onboarding`

### 1.4 Logout Flow

1. Frontend calls `signOut(auth)` from Firebase.
2. `AuthContext` cleans up the `onSnapshot` listener and sets `user` and `dbRole` to `null`.
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
