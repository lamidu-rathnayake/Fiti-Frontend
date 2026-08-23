# Fiti Frontend

Welcome to the Fiti Frontend repository. This project is built using Next.js, Tailwind CSS, and integrates with Firebase Authentication and a custom Supabase/PostgreSQL backend.

## Documentation

The official project documentation is located in the `docs/` directory.

- [Entity Dictionary](./docs/ENTITY_DICTIONARY.md) - The core database entity schemas and relationships.
- [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md) - Overview of the frontend stack, routing, and authentication flow.
- [API Reference](./docs/API_REFERENCE.md) - Endpoints and payloads for communicating with the backend.
- [Frontend Roadmap](./docs/FRONTEND_ROADMAP.md) - The strategic, step-by-step roadmap for upcoming development.

## Testing

This project uses **Playwright** for automated end-to-end (E2E) testing. The test suite automatically boots up the Next.js development server and runs headless Chromium browsers to verify the UI and authentication flows.

To run the automated test suite, use:
```bash
npm run test:e2e
```
