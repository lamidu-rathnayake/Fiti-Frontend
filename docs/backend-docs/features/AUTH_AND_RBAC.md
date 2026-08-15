# Fiti — Authentication, User Profiles & RBAC

This document covers the complete authentication architecture for the Fiti platform: how users register and log in via Firebase, how roles are stored in PostgreSQL, how the frontend enforces route access, and what the backend must do to be compatible.

---

## 1. Authentication Strategy

| Layer | Responsible Service | Description |
|---|---|---|
| **Authentication** | **Firebase Auth** | Handles Google SSO and Email/Password auth, issues session tokens (Firebase ID Tokens / JWTs) |
| **User Profile Storage** | **Firebase Firestore DB** | Stores personal profile data (`uid`, `email`, `displayName`, `photoURL`, etc.) in the `users` collection |
| **Role & Domain Data** | **PostgreSQL via Fiti Backend** | Stores role assignments (`user_roles` table) and all business domain data (shops, orders, etc.) |

> **Key principle**: Firebase owns *who* the user is. PostgreSQL owns *what role* they have and all business data.

---

## 2. Supported Authentication Methods

### Google OAuth (Google SSO)
- Handled via `signInWithPopup(auth, googleProvider)` in the browser.
- Automatically extracts `uid`, `email`, `displayName`, and `photoURL`.
- If no Firestore user document exists, the user is routed to the onboarding form.

### Email & Password
- **Sign-Up**: `createUserWithEmailAndPassword(auth, email, password)` — creates the Firebase Auth credential.
- **Sign-In**: `signInWithEmailAndPassword(auth, email, password)` — verifies credentials and logs the user in.

---

## 3. Registration Flow (Two-Phase)

Registration happens in two sequential phases.

### Phase 1 — Firebase Authentication
1. User inputs email, password (or clicks Google SSO).
2. Frontend calls `createUserWithEmailAndPassword` (or `signInWithPopup`).
3. Firebase returns a `UserCredential` with a `uid`.
4. Frontend writes a Firestore user document (`users/{uid}`) with profile data.

#### Client Profile — Firestore Write
```typescript
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

async function handleClientFormSubmit(uid: string, formData: ClientFormData) {
  await setDoc(doc(db, "users", uid), {
    uid, email: formData.email,
    displayName: `${formData.firstName} ${formData.lastName}`,
    role: "client",
    phone: formData.phone, address: formData.address, city: formData.city,
    gender: formData.gender, age: Number(formData.age),
    photoURL: formData.photoURL || "",
    createdAt: serverTimestamp(),
  }, { merge: true });
}
```

#### Seller/Tailor Profile — Firestore Write
```typescript
async function handleTailorFormSubmit(uid: string, formData: TailorFormData) {
  await setDoc(doc(db, "users", uid), {
    uid, email: formData.email,
    displayName: `${formData.firstName} ${formData.lastName}`,
    role: "tailor",
    phone: formData.phone, address: formData.address, city: formData.city,
    shopName: formData.shopName || "",
    specialty: formData.specialty || "",
    photoURL: formData.photoURL || "",
    createdAt: serverTimestamp(),
  }, { merge: true });
}
```

### Phase 2 — Backend Sync (PostgreSQL Role Assignment)
1. Frontend calls `user.getIdToken()` to obtain the Firebase ID Token.
2. Frontend sends a `POST` request to the backend with `Authorization: Bearer <token>`.
3. Depending on the selected role:
   - `POST /api/v1/profiles/client` → backend creates a `clients` record + inserts into `user_roles`
   - `POST /api/v1/profiles/tailor` → backend creates a `tailors` record + inserts into `user_roles`
4. The backend returns `201 Created` on success, `409 Conflict` if the profile already exists.

> **Critical**: The backend **must** insert into `user_roles` during profile creation. This is what makes `GET /api/v1/auth/me/role` return the correct role on all subsequent logins.

---

## 4. Login Flow

1. User logs in via `signInWithEmailAndPassword` or Google SSO.
2. Firebase SDK persists the session (Local Storage / IndexedDB).
3. Frontend calls `GET /api/v1/auth/me/role` (with Firebase Bearer token).
4. Backend queries the `user_roles` PostgreSQL table and returns the `role`.
5. Frontend redirects based on the role:
   - `client` → `/client/dashboard`
   - `tailor` → `/tailor/dashboard`
   - `404` (no role yet) → `/register` onboarding form

---

## 5. Logout Flow

1. Frontend calls `firebase.auth().signOut()`.
2. Frontend clears any cached user state (Context / Redux).
3. Redirect user to `/login` or `/`.

---

## 6. Role-Based Access Control (RBAC)

### 6.1 Route Structure

```
/login
/register
/client
   /dashboard
   /orders
   /measurements
/tailor
   /dashboard
   /requests
   /shop-profile
```

### 6.2 Auth Context & State

Your `AuthContext.ts` should export:

| Field | Type | Description |
|---|---|---|
| `user` | `FirebaseUser` | The Firebase User object |
| `profile` | `UserProfile` | The Firestore user document |
| `dbRole` | `string \| null` | Role fetched from PostgreSQL via `GET /api/v1/auth/me/role` |
| `loading` | `boolean` | Auth initialization state |

### 6.3 ProtectedRoute Component

```tsx
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useEffect } from 'react';

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, dbRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (dbRole && !allowedRoles.includes(dbRole)) {
        // Wrong role — redirect to their own dashboard
        router.push(dbRole === 'tailor' ? '/tailor/dashboard' : '/client/dashboard');
      }
    }
  }, [user, dbRole, loading, router]);

  if (loading || !user || !allowedRoles.includes(dbRole || '')) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
```

### 6.4 Usage on Pages

```tsx
// pages/client/dashboard.tsx
export default function ClientDashboard() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div>Client Dashboard Content</div>
    </ProtectedRoute>
  );
}

// pages/tailor/dashboard.tsx
export default function TailorDashboard() {
  return (
    <ProtectedRoute allowedRoles={['tailor']}>
      <div>Tailor Dashboard Content</div>
    </ProtectedRoute>
  );
}
```

---

## 7. Firestore User Document Schema

**Collection**: `users` · **Document ID**: `{uid}`

| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Authentication User ID |
| `email` | string | Email address |
| `displayName` | string | Full name (First + Last) |
| `role` | string | `"client"` \| `"tailor"` |
| `phone` | string | Contact/WhatsApp number |
| `address` | string | Street address |
| `city` | string | City |
| `gender` | string | Gender (client profiles) |
| `age` | number | Age (client profiles) |
| `photoURL` | string | Cloud storage URL for profile picture |
| `shopName` | string | Shop name (tailor profiles) |
| `specialty` | string | Tailor specialty (tailor profiles) |
| `createdAt` | timestamp | Server timestamp on profile creation |
| `updatedAt` | timestamp | Server timestamp on profile update |

---

## 8. Backend Compatibility Requirements

For the backend to be fully compatible with this architecture:

1. **`GET /api/v1/auth/me/role`** — must query the `user_roles` PostgreSQL table (not Firestore) and return the role. Must return `404` (not `{ "role": null }`) for users with no role record.

2. **`POST /api/v1/profiles/client` and `POST /api/v1/profiles/tailor`** — must insert into `user_roles` automatically upon profile creation so the role endpoint works correctly on subsequent logins.

3. **`require_role` in `security.py`** — must query the `user_roles` PostgreSQL table to verify the user's role, not Firestore.

> These changes have already been implemented. See [`API_REFERENCE.md`](../api/API_REFERENCE.md) for the full endpoint contracts.
