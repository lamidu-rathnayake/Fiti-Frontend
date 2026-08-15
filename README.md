# Fiti Frontend

The Next.js frontend for the **Fiti** tailor marketplace platform. It handles Firebase-based authentication, role-based onboarding, protected routing, and REST API integration with the Fiti backend.

---

## Documentation

| Document | Description |
|---|---|
| [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md) | Auth flow, RBAC design, route structure, and AuthContext spec |
| [Backend Handoff](./docs/BACKEND_HANDOFF.md) | API contract for the backend — exact endpoints, payloads, and implementation requirements |
| [Project Progress](./docs/PROJECT_PROGRESS.md) | What's completed, what's in progress, and known constraints |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Identity | Firebase Authentication |
| Profile Cache | Firebase Firestore |
| Authoritative Roles | PostgreSQL via Fiti Backend API |

---

## Project Structure

```
app/
├── (auth)/
│   ├── login/          — Login page (email/password + Google SSO)
│   └── onboarding/     — Role selection & profile completion form
├── (protected)/
│   ├── layout.tsx      — Auth + RBAC guard for all protected routes
│   ├── client/
│   │   └── home/       — Client dashboard
│   └── tailor/
│       └── home/       — Tailor dashboard
lib/
├── api.ts              — Generic fetch wrapper + TypeScript API types
└── firebase/
    ├── config.ts       — Firebase app initialization
    └── AuthContext.ts  — Auth state provider (user, dbRole, loading)
```

---

## User Roles

| Role | Protected Path |
|---|---|
| `client` | `/client/*` |
| `tailor` | `/tailor/*` |

Role assignment is authoritative from the PostgreSQL `user_roles` table via `GET /api/v1/auth/me/role`. A Firestore cache is used as a fallback if the backend is unreachable.

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Make sure the backend is running at the URL configured in `NEXT_PUBLIC_API_URL` before testing authentication flows.

---

## Important Notes

- Always use the same Firebase project for both the frontend config and the backend Firebase Admin SDK. Mismatched projects will cause silent auth failures.
- Users who begin Google sign-in but close the browser before completing onboarding will be redirected back to `/onboarding` on next login — this is intentional.
- The `NEXT_PUBLIC_API_URL` value in `README.md` and `lib/api.ts` differs slightly — `README.md` shows the base URL (`http://localhost:8000`) while `lib/api.ts` uses `${API_BASE}/endpoint` to build full paths. Ensure the `.env` value does **not** include a trailing slash.
