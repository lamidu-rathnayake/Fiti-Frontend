# Fiti Backend — API Reference

This document is the complete REST API reference for the Fiti Backend. It covers all endpoints, their authentication requirements, and the exact request/response contracts the frontend relies on.

> [!NOTE]
> All endpoints are prefixed with `/api/v1` (e.g., `/api/v1/auth/me/role`).

---

## Common Headers

```http
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json
```

The Firebase ID Token is obtained via `user.getIdToken()` from the Firebase Web SDK after sign-in.

---

## Error Handling Contract

All error responses use this format — the frontend reads the `detail` field for display:

```json
{
  "detail": "A human-readable error message here"
}
```

---

## Valid Roles

| Role | Access |
|---|---|
| `client` | `/client/*` routes |
| `tailor` | `/tailor/*` routes |

Any other role string returned from the backend is treated as "no role" and the user is redirected to onboarding.

---

## 1. Authentication Gateway (`/auth`)

### `GET /api/v1/auth/me/role`

Called **immediately after every login** and on every app load to rehydrate the session. This is the **single source of truth** for the user's role.

**Auth**: Valid Firebase ID Token required.

**Success (200) — User has a registered role:**
```json
{ "role": "client" }
```
or
```json
{ "role": "tailor" }
```

**Not Found (404) — New user with no role yet:**
```json
{ "detail": "User role not found" }
```

> **Important**: Return `404`, never `{ "role": null }`. The frontend uses the non-`200` status to detect new users and redirect to onboarding.

**Backend implementation:**
- Verify Firebase ID Token → extract `uid`.
- Query: `SELECT role FROM user_roles WHERE uid = $1`.
- Return role string if found; `404` if not.

---

## 2. Profiles & Measurements (`/profiles`)

### `POST /api/v1/profiles/client`

Called during onboarding when the user selects the **client** role.

**Auth**: Valid Firebase ID Token.

**Request Body:**
```json
{}
```
> Firebase UID is automatically extracted from the token.


**Success (201):**
```json
{ "message": "Client profile created successfully" }
```

**Conflict (409):** Profile already exists for this `uid`.

---

### `POST /api/v1/profiles/tailor`

Called during onboarding when the user selects the **tailor** role.

**Auth**: Valid Firebase ID Token.

**Request Body:**
```json
{
  "specialty": "Custom Suits",
  "nic_front": "https://firebasestorage...",
  "nic_rear": "https://firebasestorage..."
}
```

**Success (201):**
```json
{ "message": "Tailor profile created successfully" }
```

**Backend implementation for both profile endpoints:**
- Verify token → extract `uid`, `email`, `displayName`, `photoURL`.
- Insert into `clients` or `tailors` table.
- **CRITICAL**: Also insert into `user_roles`: `INSERT INTO user_roles (uid, role) VALUES ($1, 'client')`.
- Return `409 Conflict` if profile already exists (not `500`).

---

### `GET /api/v1/profiles/client/{id}`
**Auth**: Client Role · Fetch a client's profile.

### `GET /api/v1/profiles/tailor/{id}`
**Auth**: Public · View a tailor's public profile.

### `GET /api/v1/profiles/tailor/{id}/verification`
**Auth**: Public · Check if a tailor's profile has been verified.

### `PUT /api/v1/profiles/client/{id}/measurements`
**Auth**: Client Role · Save or update a client's standard body measurements.

### `GET /api/v1/profiles/client/{id}/measurements`
**Auth**: Client Role · Fetch a client's body measurements.

---

## 3. Shops (`/shops`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/shops/` | Public | List all shops (optional pagination & city filters) |
| `GET` | `/shops/nearby?lat=&lng=&radius_km=` | Public | Discover shops within a GPS radius |
| `GET` | `/shops/tailor/{tailor_id}` | Public | List all shops owned by a specific tailor |
| `GET` | `/shops/{shop_id}` | Public | Get details of a specific shop |
| `POST` | `/shops/` | Tailor Role | Register a new tailor shop |
| `PUT` | `/shops/{shop_id}` | Tailor Role | Update an existing shop |
| `DELETE` | `/shops/{shop_id}` | Tailor Role | Delete a shop |
| `POST` | `/shops/{shop_id}/images` | Tailor Role | Add a portfolio/shop image URL |

**Shop Request Body (POST / PUT):**
```json
{
  "tailor_id": "firebase_uid_here",
  "shop_name": "Stitch & Sew",
  "shop_bio": "Premium tailoring services",
  "shop_address": "45 Temple Street",
  "city": "Kandy",
  "contact_number": "+94771234567",
  "registration_number": "BR-12345",
  "latitude": 7.2906,
  "longitude": 80.6337,
  "profile_picture_url": "https://firebasestorage..."
}
```
> `tailor_id` and `shop_name` are required for POST. All fields can be updated via PUT.

---

## 4. Orders & Requests (`/orders`)

### Clothing Requests (Client-side)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/orders/requests` | Client Role | Submit a new clothing request (marketplace broadcast) |
| `GET` | `/orders/requests/open` | Public | View all open marketplace requests |
| `GET` | `/orders/requests/client/{id}` | Public | View all requests made by a specific client |
| `GET` | `/orders/requests/{id}` | Public | Get details of a specific clothing request |
| `PATCH` | `/orders/requests/{id}/cancel` | Client Role | Cancel an open request before a bid is accepted |

**Clothing Request Request Body (POST):**
```json
{
  "client_id": "firebase_uid_here",
  "target_date": "2026-10-01",
  "target_budget": 15000.0,
  "clothing_category": "Suit",
  "gender": "male",
  "fabric_status": "client_provided",
  "description": "Looking for a custom 3-piece suit.",
  "voice_note_url": "https://firebasestorage...",
  "service_type": "physical_visit",
  "request_location": "Colombo",
  "design_image_urls": [
    "https://firebasestorage.../image1.png"
  ],
  "target_shop_ids": [1, 2]
}
```
> All fields except `client_id` and `service_type` (which defaults to `"online"`) are optional.

### Bids & Shop Requests (Tailor-side)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/orders/shop-requests/shop/{id}` | Public | View all requests assigned to a specific shop |
| `GET` | `/orders/shop-requests/{id}/bids` | Tailor Role | List all bids on a shop request |
| `POST` | `/orders/bids` | Tailor Role | Submit a bid (price & message) on a client's request |

**Bid Request Body:**
```json
{
  "shop_request_id": 123,
  "bid_amount": 25000.0,
  "message": "We can finish in 3 days."
}
```

### Orders & Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/orders/accept-bid` | Client Role | Accept a bid (or direct price) and create an Order |
| `GET` | `/orders/shop/{shop_id}` | Public | List all orders for a shop |
| `GET` | `/orders/client/{client_id}` | Public | List all orders for a client |
| `GET` | `/orders/{order_id}` | Valid Token | Get specific order details |
| `PATCH` | `/orders/{order_id}/status` | Valid Token | Update order status (`in_progress`, `completed`) |
| `GET` | `/orders/{order_id}/payment` | Valid Token | Get payment status of an order |
| `POST` | `/orders/payments/mock` | Client Role | Process a mock simulated payment |
| `POST` | `/orders/ratings` | Client Role | Rate and review a shop upon order completion |

**Accept Bid / Create Order Request Body:**
```json
{
  "shop_request_id": 123,
  "accepted_price": 25000.0
}
```

> Note: A `Bid` record is never strictly required. The `shop_request_id` is the central link — this endpoint works for both bid-based and direct (bid-less) orders. See [`bidding_system_report.md`](../features/bidding_system_report.md) for the full flow.

---

## 5. Support & Engagement (`/support`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/support/notifications` | Valid Token | Create a system notification for a user |
| `GET` | `/support/notifications/{id}` | Valid Token | List a user's notifications |
| `PATCH` | `/support/notifications/{id}/read` | Valid Token | Mark a notification as read |
| `POST` | `/support/favorites` | Valid Token | Add a shop to favorites |
| `DELETE` | `/support/favorites/{c_id}/{s_id}` | Valid Token | Remove a shop from favorites |
| `GET` | `/support/favorites/{id}` | Valid Token | View a client's favorite shops |

---

## 6. System Health (`/health`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Ping the server — returns uptime, API version, and DB connectivity |
