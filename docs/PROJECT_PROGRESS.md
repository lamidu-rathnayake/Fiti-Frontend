# Fiti Frontend — Project Progress

This document tracks the current development state of the Fiti Frontend. It is kept up-to-date as features are implemented.

> **Last Updated:** 2026-08-15

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Identity | Firebase Authentication (Email/Password & Google SSO) |
| Profile Cache | Firebase Firestore |
| Authoritative Roles | PostgreSQL via Fiti Backend API |

---

## ✅ Completed

### Authentication System
- Login page — Email/Password and Google SSO (`signInWithPopup`)
- Onboarding flow — role selection, profile form, backend sync
- `AuthContext.ts` — exports `user`, `dbRole`, `loading`, `logout`, `setRole`
- `dbRole` fetched from `GET /api/v1/auth/me/role` (backend PostgreSQL) with Firestore fallback
- Fully compliant with the backend OpenAPI schema.

### Onboarding → Backend Sync
- POST to `/api/v1/profiles/client` or `/api/v1/profiles/tailor` on form submission
- Payload sends `profile_picture_url` and handles `null` fallbacks to satisfy strict OpenAPI validation
- Firebase ID Token sent as Bearer token in `Authorization` header
- Firestore `users` document updated as local profile cache

### Route Protection & RBAC
- `app/(protected)/layout.tsx` guards all authenticated routes
- Unauthenticated users → `/login`
- Authenticated users with no `dbRole` (incomplete onboarding) → `/onboarding`
- Clients accessing `/tailor/*` → `/client/home`
- Tailors accessing `/client/*` → `/tailor/home`

### API Utility
- `lib/api.ts` — generic `fetch` wrapper with error handling
- TypeScript interfaces: `Profile`, `Shop`, `ClothingRequest`, `Bid`

---

## 🚧 In Progress / Next Steps

| Feature | Notes |
|---|---|
| Client Dashboard (`/client/home`) | UI and API integration for posting clothing requests, viewing bids, managing orders |
| Tailor Dashboard (`/tailor/home`) | UI and API integration for browsing requests, submitting bids, shop profile management |
| Backend endpoints live | ✅ Backend profile and role endpoints are fully synced and tested |
| Firestore deprecation | Once backend is stable, remove Firestore fallback for roles — PostgreSQL becomes sole source of truth |

---

## Known Constraints

- The Firestore fallback for role lookup means the system still works offline from the backend, but roles set only in Firestore may be slightly out of sync from PostgreSQL. The PostgreSQL role always takes precedence when the backend is reachable.
- Google SSO users who close the browser mid-onboarding will land back on `/onboarding` on next login (correct behavior — no partial profiles are accepted).
