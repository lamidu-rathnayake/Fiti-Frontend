# Frontend Architecture

This document outlines the high-level architecture of the Fiti Frontend application. The project is built using modern web development standards with a focus on performance, security, and developer experience.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **Authentication:** Firebase Auth (client-side identity and sessions)
- **Authorization:** Backend role lookup with PostgreSQL as the source of truth
- **Testing:** Playwright (End-to-End UI Testing)
- **Mapping:** Leaflet & React-Leaflet

## Project Structure

The codebase follows a standard Next.js App Router directory structure:

```text
app/
 ├── (auth)/         # Public authentication routes (Login, Register, Onboarding)
 ├── (protected)/    # Private routes requiring authentication
 │    ├── client/    # Client-specific dashboards and tools
 │    └── tailor/    # Tailor-specific dashboards and tools
 ├── layout.tsx      # Root layout containing the AuthProvider
 └── page.tsx        # Public landing page
```

## Authentication Flow

Authentication is handled via **Firebase Auth** purely on the client side to manage the session, while authorization and Role-Based Access Control (RBAC) are enforced by our custom backend API.

1. **Sign In/Sign Up:** The user authenticates via Email/Password or Google OAuth using the Firebase SDK. Registration supports separate client and tailor flows.
2. **Context Management:** The `AuthProvider` (`lib/firebase/AuthContext.ts`) listens to the Firebase `onAuthStateChanged` event.
3. **Role Resolution:** Once a user is authenticated, the context makes a request to `GET /api/v1/auth/me/role` to fetch the user's role from the PostgreSQL backend. The response is `{ role: "client" | "tailor" }`; route selection is performed by the frontend.
4. **Onboarding:** If the backend returns `404` because the authenticated user has no role, the frontend redirects them to onboarding.
5. **Route Guarding:**
    - `app/(protected)/layout.tsx` enforces that only users with a valid `dbRole` can access its children.
    - Cross-role access is prevented (e.g., a Client trying to access `/tailor/home` will be redirected).

## Data Fetching & API Interfacing

All communication with the custom Python backend is routed through a centralized wrapper in `lib/api/client.ts`.

- **`apiFetch` Wrapper:** Automatically attaches the Firebase JWT token to the `Authorization: Bearer` header of every outbound request that requires authentication.
- **Error Handling:** Standardizes all backend errors into a `FitiApiError` object for consistent `try/catch` UI handling across the app.
- **Media:** Cloudinary is used for profile, shop, NIC, and inspiration images. Voice notes use Firebase Storage where supported by the request flow.
- **Location:** Leaflet and React-Leaflet provide map selection; reverse geocoding fills address and city fields when available.

## End-to-End Testing

We use **Playwright** to test our UI flows automatically.

- Tests are located in the `tests/` directory.
- The framework boots up the Next.js development server and runs headless Chromium browsers to verify authentication, routing, and form submissions.
- Run tests via `npm run test:e2e`.

## Public and Protected Routes

Public authentication routes are `/login`, `/register`, `/register/client`, `/register/tailor`, and `/onboarding`. Client features live under `/client`, while tailor features live under `/tailor`. The shared protected layout owns session checks, role checks, navigation, and the loading lock screen.
