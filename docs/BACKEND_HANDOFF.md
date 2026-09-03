# Fiti Backend Alignment Handoff

## Purpose

This document is the implementation contract from the current Fiti frontend to the backend agent. Use it to align the backend routes, authentication, database behavior, response shapes, validation, and error codes with the frontend in this repository.

The frontend is a Next.js App Router application. It uses Firebase Authentication for identity and sessions, and the backend API as the source of truth for PostgreSQL business profiles, roles, shops, requests, bids, orders, payments, ratings, favorites, and notifications.

All API routes are expected under:

```text
/api/v1
```

The frontend base URL is configured with `NEXT_PUBLIC_API_URL` and defaults to `http://localhost:8000` when absent.

## 1. Authentication Contract

### Firebase token verification

For every authenticated request:

```http
Authorization: Bearer <firebase-id-token>
```

The backend must validate the Firebase ID token and use the Firebase UID from the token as the authenticated identity. The client does not send passwords, Firebase secrets, or a trusted role value.

The frontend refreshes the token after `updateProfile` during onboarding with `getIdToken(true)`. It then sends the refreshed token to profile and shop endpoints.

### Role endpoint

```http
GET /api/v1/auth/me/role
Authorization: Bearer <firebase-id-token>
```

Successful response:

```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "role": "client"
}
```

Valid roles currently are `client` and `tailor`.

Required behavior:

- Return `200` when the authenticated user has a role.
- Return `404` when the Firebase user exists but has no application profile/role yet. The frontend sends this user to `/onboarding`.
- Return `401` for a missing, malformed, expired, or invalid Firebase token.
- The frontend owns route selection. The backend should not require a `target_url` or `redirect_to` field. Extra fields are tolerated, but the frontend only relies on `role`.
- Role mappings must be unique per user unless multi-role support is explicitly introduced in both projects.

### Role protection

The backend must enforce role authorization independently of frontend route guards:

- Client-only operations must reject tailor users with `403`.
- Tailor-only operations must reject client users with `403`.
- Ownership checks must reject access to another user's profile, shop, request, bid, or order even when the caller has a valid role.

## 2. Registration and Onboarding

Registration creates the Firebase account in the browser first, then creates the PostgreSQL profile using the Firebase token.

### Client profile

```http
POST /api/v1/profiles/client
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Payload:

```json
{
  "phone": "+94771234567",
  "city": "Colombo",
  "address": "45 Temple Road",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "photo_url": "https://res.cloudinary.com/..."
}
```

All fields are optional or nullable. The backend derives the Firebase UID, email, and identity association from the token/Firebase record. The frontend expects a `201` profile response with `id`, profile fields, and `created_at`/`updated_at`.

### Tailor profile

```http
POST /api/v1/profiles/tailor
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Payload:

```json
{
  "phone": "+94771234567",
  "city": "Colombo",
  "address": "45 Temple Road",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "nic_front": "https://res.cloudinary.com/...",
  "nic_rear": "https://res.cloudinary.com/..."
}
```

The response must include the profile fields plus `is_verified`. NIC URLs are uploaded by the frontend and should be stored as URLs, not raw file data.

### Duplicate registration

The frontend treats `409` from profile creation as an existing profile. Return a useful JSON error body such as:

```json
{
  "detail": "A client profile already exists for this user."
}
```

Do not create a second role/profile row for the same Firebase UID.

### Shop creation during tailor onboarding

```http
POST /api/v1/shops/
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Payload fields:

```json
{
  "shop_name": "Atelier Example",
  "specialty": "Bridal wear",
  "shop_bio": "Bespoke tailoring studio",
  "shop_address": "45 Temple Road",
  "city": "Colombo",
  "contact_number": "+94771234567",
  "registration_number": "REG-001",
  "latitude": 6.9271,
  "longitude": 79.8612
}
```

Ownership must come from the authenticated tailor, not from a client-supplied `tailor_id`. Return a shop object containing `shop_id`, `tailor_id`, all payload fields, `average_rating`, `images`, and timestamps.

## 3. Profiles, Measurements, and Media

Expected profile routes:

| Method | Route | Required role | Frontend use |
|---|---|---|---|
| `GET` | `/profiles/client/{uid}` | Client owner | Load client profile |
| `PATCH` | `/profiles/client/{uid}` | Client owner | Update phone, city, address, photo URL |
| `POST` | `/profiles/client` | Authenticated user | Create client profile |
| `GET` | `/profiles/tailor/{uid}` | Public or authenticated | Load tailor profile |
| `PATCH` | `/profiles/tailor/{uid}` | Tailor owner | Update tailor profile |
| `POST` | `/profiles/tailor` | Authenticated user | Create tailor profile |
| `GET` | `/profiles/client/{uid}/measurements` | Client owner | Load saved measurements |
| `PUT` | `/profiles/client/{uid}/measurements` | Client owner | Replace or upsert saved measurements |
| `POST` | `/profiles/cloudinary-image/delete` | Authenticated user | Securely delete an old Cloudinary image |

Measurement fields are nullable numeric values: `chest`, `waist`, `shoulder`, `sleeve`, `neck`, `hip`, `inseam`, `length`, plus nullable `notes`. The frontend expects the saved measurement response to include an `id` and `client_id`.

The frontend uploads images directly to Cloudinary using an unsigned upload preset. It sends the returned `secure_url` to the backend. Profile and shop image deletion must be ownership-checked before removal.

Voice notes are uploaded by the frontend to Firebase Storage under a path similar to:

```text
voice_notes/{firebase_uid}_{timestamp}.webm
```

The backend stores the resulting download URL in `voice_note_url`; it does not receive the audio binary from the API request.

## 4. Shops and Discovery

| Method | Route | Auth | Expected result |
|---|---|---|---|
| `GET` | `/shops/` | Public | Array of shops |
| `GET` | `/shops/nearby?lat=&lng=&radius_km=` | Public | Shops within the requested radius |
| `GET` | `/shops/tailor/{tailor_uid}` | Public | Shops owned by a tailor |
| `GET` | `/shops/{shop_id}` | Public | One shop with image list |
| `POST` | `/shops/` | Tailor | Create owned shop |
| `PUT` | `/shops/{shop_id}` | Tailor owner | Update owned shop |
| `DELETE` | `/shops/{shop_id}` | Tailor owner | Delete owned shop, preferably `204` |
| `POST` | `/shops/{shop_id}/images` | Tailor owner | Add `{ "image_url": "..." }` |

`radius_km` is optional for nearby discovery. Invalid coordinates or negative radius values should return `422` with a field-level error.

## 5. Clothing Requests

### Request creation

```http
POST /api/v1/orders/requests
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

The frontend sends this shape:

```json
{
  "client_id": "firebase-uid",
  "service_type": "online",
  "request_type": "bidding",
  "target_date": "2026-10-01",
  "target_budget": 50000,
  "clothing_category": "TWO-PIECE SUIT",
  "gender": "male",
  "fabric_status": "shop_provides",
  "description": "Navy suit for an event",
  "voice_note_url": "https://firebasestorage.googleapis.com/...",
  "request_location": "Colombo",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "radius_km": 10,
  "design_image_urls": ["https://res.cloudinary.com/..."],
  "target_shop_ids": [12],
  "measurement_profile_id": 4,
  "measurement": {
    "chest": 96,
    "waist": 84,
    "shoulder": 44,
    "sleeve": 61,
    "neck": 39,
    "hip": 98,
    "inseam": 80,
    "length": 74,
    "notes": "Regular fit"
  }
}
```

The value `"inseam": 80` above is illustrative; the actual frontend sends a number. Backend validation should reject non-numeric measurement values.

Supported values currently used by the frontend:

- `service_type`: `online`, `physical_visit`
- `request_type`: `bidding`, `direct`
- `fabric_status`: `client_provided`, `shop_provides`
- `gender`: `male`, `female`, `unisex` in the current UI; support `other` only if both projects standardize it
- request status: `open`, `in_progress`, `completed`, `cancelled`

For a broadcast/bidding request, `request_type` is `bidding` and `target_shop_ids` is omitted. The backend should match eligible shops using the location/radius rules.

For a direct request, `request_type` is `direct` and `target_shop_ids` contains the selected shop ID. The backend should validate that the shop exists and is eligible to receive the request.

The backend should derive the requesting client from the Firebase token and validate any supplied `client_id` against that UID. Do not trust `guest_client` in authenticated production requests; the current frontend fallback should be replaced or rejected during integration.

### Request endpoints

| Method | Route | Auth | Frontend use |
|---|---|---|---|
| `POST` | `/orders/requests` | Client | Create broadcast or direct request |
| `GET` | `/orders/requests/open` | Tailor or public, as policy allows | Marketplace open requests |
| `GET` | `/orders/requests/client/{uid}` | Client owner | Client request history |
| `GET` | `/orders/requests/{request_id}` | Authenticated/authorized | Request details |
| `PATCH` | `/orders/requests/{request_id}/cancel` | Client owner | Cancel open request |

Request detail responses may include nested `design_images`, `measurement`, `bids`, `shop_requests`, and client summary data. Keep field names consistent with the frontend types, especially `status`, `voice_note_url`, and `design_images`.

## 6. Bids, Quotes, and Orders

### Bids and shop requests

| Method | Route | Auth | Expected behavior |
|---|---|---|---|
| `GET` | `/orders/shop-requests/shop/{shop_id}` | Tailor owner | List requests assigned to the shop |
| `GET` | `/orders/shop-requests/{shop_request_id}/bids` | Tailor/client authorized | List bid history |
| `POST` | `/orders/bids` | Tailor owner | Submit `{ shop_request_id, bid_amount, message }` |
| `PATCH` | `/orders/shop-requests/{shop_request_id}/reject` | Client owner | Reject a quotation |

A bid response should include `bid_id`, `shop_request_id`, `bid_amount`, `message`, and `created_at`. Prevent duplicate active bids unless counter-bids are explicitly supported.

### Accepting a quote

```http
POST /api/v1/orders/accept-bid
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

The frontend sends an `AcceptBidPayload` associated with a `shop_request_id`. The endpoint must authorize the client who owns the original request, atomically mark the selected quote/request accepted, and create exactly one order. It also supports the direct-order path where an agreed price is accepted without a traditional bid.

### Orders and payment

| Method | Route | Auth | Notes |
|---|---|---|---|
| `GET` | `/orders/client/{client_uid}` | Client owner | Client order list |
| `GET` | `/orders/shop/{shop_id}` | Tailor owner | Shop order list |
| `GET` | `/orders/{order_id}` | Authorized token | Order details |
| `PATCH` | `/orders/{order_id}/status?order_status={status}` | Authorized token | Status is a query parameter, not JSON body |
| `GET` | `/orders/{order_id}/payment` | Authorized token | Payment status |
| `POST` | `/orders/payments/mock` | Client owner | Body `{ "order_id": 123 }` |
| `POST` | `/orders/ratings` | Client owner | Submit completed-order rating |

Supported order status values used by the frontend are `in_progress`, `completed`, and `cancelled`. Status transitions must be authorized and validated server-side.

Mock payment should be deterministic for development and return a payment object with `payment_id`, `order_id`, `amount`, `payment_method`, `payment_status`, and timestamps.

## 7. Support and Engagement

| Method | Route | Auth | Payload/response |
|---|---|---|---|
| `POST` | `/support/notifications` | Authenticated | `{ user_id, message }` |
| `GET` | `/support/notifications/{uid}` | User owner | Array of notifications |
| `PATCH` | `/support/notifications/{notification_id}/read` | Notification owner | Updated notification |
| `POST` | `/support/favorites` | Client owner | `{ client_id, shop_id }` |
| `DELETE` | `/support/favorites/{client_uid}/{shop_id}` | Client owner | Prefer `204` |
| `GET` | `/support/favorites/{client_uid}` | Client owner | Array of favorite shops |

Use `notification_id`, `user_id`, `message`, `is_read`, and `created_at` consistently. Favorite creation should be idempotent or return a clear `409` for duplicates.

## 8. Error Contract

Return JSON errors with a `detail` field. The frontend maps the HTTP status and detail into UI messages.

Recommended statuses:

- `400`: valid authentication but invalid business operation
- `401`: missing or invalid Firebase token
- `403`: valid user lacks the required role or ownership
- `404`: missing resource, or missing role for `/auth/me/role`
- `409`: duplicate profile, shop, bid, favorite, or conflicting state transition
- `422`: request validation failure; preserve field-level details when possible
- `500`: unexpected server error without leaking credentials or internal stack traces

Enable CORS for the frontend development and production origins. Allow `Authorization` and `Content-Type` headers and the required methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`).

## 9. Alignment Checklist

- [ ] Firebase Admin token verification is configured in the backend.
- [ ] `/auth/me/role` returns `404` for authenticated users without a role and `role` for completed users.
- [ ] Profile creation derives UID from the token and prevents duplicate role rows.
- [ ] Client and tailor role guards are enforced server-side.
- [ ] Shop ownership is derived from the authenticated tailor.
- [ ] Direct and broadcast request semantics are implemented and validated.
- [ ] `voice_note_url` and `design_image_urls` are accepted and persisted.
- [ ] Nested request/order response field names match the frontend types.
- [ ] Order status accepts `order_status` as a query parameter.
- [ ] `409`, `404`, `401`, `403`, and `422` responses include useful `detail` values.
- [ ] CORS and Firebase project configuration work in local development.
- [ ] Backend integration tests cover registration, role lookup, request creation, bidding, order acceptance, and ownership failures.

## Known Frontend Integration Items

These should be resolved while aligning both projects:

1. The direct request screen currently displays a placeholder shop name (`Selected Atelier`) until the shop lookup is wired to `GET /shops/{shop_id}`.
2. Some list endpoints are currently called without authentication in the frontend. The backend must still apply privacy and ownership rules rather than relying on the client flag.
3. The frontend API types still allow an optional `target_url`, but login routing uses role-based local destinations. Treat `role` as the contract unless both projects intentionally add a redirect field.
4. The onboarding and registration screens upload media directly, so the backend should validate URL format, ownership context, and acceptable media metadata rather than expecting multipart uploads.
5. The backend should publish an OpenAPI schema or example responses for the endpoint contracts above so the frontend types can be kept synchronized.
