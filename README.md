# Fiti Frontend

This is the Next.js frontend for the Fiti marketplace platform. It handles authentication, role-based registration, protected admin access, and API calls to the backend services used by clients, tailors, and administrators.

## Project purpose

The frontend is split into three main user journeys:

- Client-facing experience
- Tailor-facing experience
- Admin experience

The application uses Firebase Authentication for user identity and Next.js App Router for route-based UI organization.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Authentication
- REST API integration for backend services

## Architecture overview

### 1. App Router structure

The project is organized around the App Router under the `app/` directory:

- `app/(auth)/login/page.tsx` — login page
- `app/(auth)/register/page.tsx` — choose between client or tailor registration
- `app/(auth)/register/[role]/page.tsx` — role-specific registration form
- `app/(auth)/verify-email/page.tsx` — verification screen (available if needed in future flows)
- `app/(protected)/layout.tsx` — protected route wrapper for authenticated pages
- `app/(protected)/admin/page.tsx` — admin dashboard placeholder
- `providers/AuthProvider.tsx` — Firebase auth session provider
- `lib/firebase/client.ts` — Firebase initialization
- `lib/api.ts` — generic backend request wrapper and API helpers

### 2. Authentication model

Firebase is used as the authentication provider for user identity.

- `AuthProvider` listens to `onAuthStateChanged(auth, ...)`
- the current user is shared through React context
- protected pages check `user` and `loading` before rendering

This prevents unauthenticated users from reaching protected pages such as the admin area.

### 3. Role-based registration flow

The registration flow is intentionally split by user type:

- `Client` registration form collects client-specific fields
- `Tailor` registration form collects tailor-specific fields
- users choose a role first, then continue into the matching form

This helps keep the data model separate for each user type instead of forcing all users into one combined schema.

## Backend integration

The frontend connects to multiple backend services via environment variables.

### Client / Tailor backend

The main application backend is configured with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

This is used by helpers in `lib/api.ts` for the client/tailor APIs such as:

- profile creation
- shop creation
- order request creation
- bid submissions

The generic request wrapper builds URLs as:

```ts
fetch(`${API_BASE}${endpoint}`, { ...options });
```

So the frontend calls endpoints relative to the client/tailor backend base URL.

### Admin backend

The admin service is configured with:

```bash
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:9000/api/v1
```

This is reserved for admin-related services and analytics or internal admin operations.

In the current implementation, the frontend keeps the admin URL available for future admin-specific endpoints and dashboard logic.

## Firebase configuration

Firebase is initialized in `lib/firebase/client.ts`:

```ts
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

The Firebase project should match the same project used for the app authentication flow.

## Environment setup

Create a `.env` file in the project root and add the variables below:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Client / Tailor backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Admin backend
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:9000/api/v1
```

A sample file is also included as `.env.example`.

## Local development workflow

1. Start the backend services for:
    - client/tailor API
    - admin API
2. Configure `.env` with correct values
3. Install dependencies:

```bash
npm install
```

4. Start the frontend:

```bash
npm run dev
```

5. Open the app in the browser:

```text
http://localhost:3000
```

## Notes on flow

- Login uses Firebase authentication
- Registration is role-based
- Protected pages are guarded by `AuthProvider`
- API base URLs are environment-driven so the same frontend can target different backend environments
- The design keeps authentication separate from business profile data so client/tailor onboarding remains modular

## Important caution

The frontend should always use the same Firebase project that the auth users were created in. If the app points to a different Firebase project, login and auth behavior may appear inconsistent even if the password and email are correct.

## Example backend mapping

- Client requests → `NEXT_PUBLIC_API_URL`
- Tailor requests → `NEXT_PUBLIC_API_URL`
- Admin dashboard calls → `NEXT_PUBLIC_ADMIN_API_URL`

This keeps frontend API usage clean while allowing different services to be separated by purpose.
