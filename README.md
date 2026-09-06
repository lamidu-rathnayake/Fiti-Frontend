# Fiti Frontend

Fiti is a role-based bespoke tailoring marketplace. The Next.js App Router frontend combines Firebase Authentication with a backend API backed by Supabase/PostgreSQL. Clients can discover tailors, submit custom clothing requests, compare bids, and track orders. Tailors can manage shops, review marketplace requests, submit bids, and manage orders.

## Features

- Email/password and Google sign-in through Firebase Authentication.
- Frontend-driven role routing for `client` and `tailor` users.
- New-user onboarding with profile, location, image, NIC, and shop details.
- Client storefront, tailor discovery, shop profiles, direct requests, broadcast requests, profile, and orders.
- Tailor dashboard, shop creation, location, marketplace requests, and order views.
- Clothing requests with measurements, service type (`online` or `physical_visit`), voice notes, and inspiration images.
- Responsive UI with Leaflet location picking, Cloudinary media uploads, and theme switching.

## Setup

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Configure the Firebase public settings, backend URL, and Cloudinary upload settings in `.env.local`:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

The backend must be running at `NEXT_PUBLIC_API_URL`. Firebase Email/Password and Google providers must be enabled in the Firebase project.

## Routes

Public routes include `/`, `/login`, `/register`, `/register/client`, `/register/tailor`, `/onboarding`, `/contact`, `/privacy`, and `/terms`.

Protected client routes are under `/client`; tailor routes are under `/tailor`. The protected layout verifies Firebase authentication, fetches the database role from `/api/v1/auth/me/role`, redirects incomplete users to `/onboarding`, and prevents cross-role access.

## Documentation

- [Entity Dictionary](./docs/ENTITY_DICTIONARY.md) - Core entities and relationships.
- [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md) - Stack, routing, authentication, and data flow.
- [API Reference](./docs/API_REFERENCE.md) - Backend endpoints used by the frontend.
- [Backend Handoff](./docs/BACKEND_HANDOFF.md) - Exact backend contract and alignment checklist for the backend agent.
- [Project Progress](./docs/PROJECT_PROGRESS.md) - Current implementation status and remaining work.
- [Frontend Features Handoff](./docs/frontend_features_handoff.md) - Feature ownership and integration notes.

## Project Structure

```text
app/
├── (auth)/          # Authentication pages (login, onboarding, register)
├── (protected)/     # Role-based protected routes
│   ├── client/      # Client views (home, orders, tailor discovery, shops)
│   └── tailor/      # Tailor views (dashboard, orders, shop management)
├── globals.css      # Global styles
└── layout.tsx       # Root layout

components/
├── auth/            # Authentication form components
├── map/             # Leaflet maps and location pickers
├── navigation/      # Sidebars, nav controls, and layout headers
└── (UI)/            # Reusable UI elements (ThemeToggle, Logo, FullPageLock)

lib/
├── api/             # API client and backend endpoint definitions
│   └── types/       # Frontend type definitions for API payloads
├── firebase/        # Firebase initialization and AuthContext
├── cloudinary.ts    # Image upload utility
├── geocoding.ts     # Map coordinates utilities
└── phone.ts         # Phone validation utilities
```

## Validation

Run the checks used by the project:

```bash
npm run lint
npx tsc --noEmit
npm run test:e2e
npm run build
```

Cypress starts the Next.js development server automatically for the E2E suite. Tests are in `cypress/e2e/`. To use the interactive runner, start the app with `npm run dev` and run `npm run test:e2e:open` in another terminal.

The previous Playwright suite remains available through `npm run test:e2e:playwright`.
