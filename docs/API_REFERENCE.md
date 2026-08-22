# API Reference

This document outlines how the frontend communicates with the custom Python backend. While the absolute source of truth for the API contracts is the backend's Swagger/OpenAPI documentation, this guide covers the core concepts and endpoints implemented in the frontend's `lib/api/` directory.

## Core Setup (`lib/api/client.ts`)

All requests to the backend are routed through a custom `apiFetch` wrapper.

- **Base URL:** Defined by the `NEXT_PUBLIC_API_URL` environment variable.
- **Authentication:** By default, `apiFetch` expects the request to be authenticated. It retrieves the current Firebase User, requests a JWT token (`user.getIdToken()`), and injects it into the `Authorization: Bearer <token>` header.
- **Error Handling:** If the backend returns a non-2xx status code, `apiFetch` parses the error and throws a `FitiApiError` object containing the `status` and `message`.

## Auth Endpoints (`lib/api/endpoints/auth.ts`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me/role` | Retrieves the authenticated user's role (`client` or `tailor`). Required for protected routing. |

## Profile Endpoints (`lib/api/endpoints/profiles.ts`)

These endpoints manage user identities and business data, entirely replacing the legacy Firestore implementations.

### Client Profiles
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/profiles/client` | Creates a new client profile (requires `city`, `displayName`). |
| `GET` | `/api/v1/profiles/client/{id}` | Fetches the client's own profile data. |
| `PATCH` | `/api/v1/profiles/client/{id}` | Updates specific client fields. |
| `PUT` | `/api/v1/profiles/client/{id}/measurements` | Saves or updates standard body measurements. |
| `GET` | `/api/v1/profiles/client/{id}/measurements` | Fetches a client's saved body measurements. |

### Tailor Profiles
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/profiles/tailor` | Creates a new tailor profile. |
| `GET` | `/api/v1/profiles/tailor/{id}` | **Public:** Fetches a tailor's public profile data. |
| `PATCH` | `/api/v1/profiles/tailor/{id}` | Updates specific tailor fields. |
| `GET` | `/api/v1/profiles/tailor/{id}/verification` | **Public:** Checks the verification status of a tailor. |

## Shop Endpoints (`lib/api/endpoints/shops.ts`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/shops` | Creates a new shop entity linked to the authenticated tailor. |
| `GET` | `/api/v1/shops/{id}` | **Public:** Retrieves public details for a specific shop. |
| `GET` | `/api/v1/shops/my-shop` | Retrieves the authenticated tailor's shop details. |
| `PATCH` | `/api/v1/shops/{id}` | Updates shop details. |
| `POST` | `/api/v1/shops/{id}/images` | Adds an image to the shop's gallery. |
| `DELETE`| `/api/v1/shops/{id}/images/{imageId}` | Removes an image from the gallery. |

## Asset Uploads
Currently, assets (like Profile Pictures, Shop Images, and NICs) are uploaded directly from the client frontend to **Cloudinary** via unsigned presets. The resulting secure URL is then sent to the backend endpoints listed above.
