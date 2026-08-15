# Fiti Backend — Project Progress Log

**Project**: Fiti Smart Tailoring Platform (Backend)  
**Stack**: FastAPI · SQLAlchemy 2.0 (Async) · PostgreSQL · Firebase Auth · Pydantic V2  
**Last Updated**: 2026-08-15

---

## 🟢 Overall Status: Core Backend — Feature Complete

The backend is functionally complete with all core marketplace features implemented, tested, and documented.

---

## ✅ Completed Milestones

### 1. Project Foundation & Clean Architecture Setup
- [x] FastAPI application bootstrapped with `uv` package manager
- [x] Clean Architecture layering enforced: **Presentation → Use Cases → Domain ← Infrastructure**
- [x] Async SQLAlchemy 2.0 engine and session factory configured (`app/core/database.py`)
- [x] Pydantic V2 settings management (`app/core/config.py`)
- [x] CORS middleware and global exception handlers configured in `app/main.py`
- [x] PostgreSQL schema defined (`schema.sql`) with all domain tables and FK constraints

---

### 2. Firebase Authentication & Security Layer
- [x] Firebase Admin SDK integrated for stateless JWT Bearer Token verification
- [x] `get_current_user` and `get_current_user_uid` dependency functions implemented (`app/core/security.py`)
- [x] `MOCK_FIREBASE_AUTH` mode for local development (bypasses real Firebase token checks)
- [x] Role-Based Access Control (RBAC) — `require_role("client" | "tailor")` dependency guard
- [x] `user_roles` PostgreSQL table stores and enforces user roles independently of Firestore

---

### 3. Post-Login Gateway Endpoint
- [x] `GET /api/v1/auth/me/role` — verifies Firebase token, queries `user_roles` table, returns role string
- [x] Returns `404` (not `200` with null) for new users with no role record — compatible with frontend `if (res.ok)` check

---

### 4. Client & Tailor Profile System
- [x] `POST /api/v1/profiles/client` — registers client profile in PostgreSQL + inserts `user_roles` record
- [x] `POST /api/v1/profiles/tailor` — registers tailor profile in PostgreSQL + inserts `user_roles` record
- [x] `GET /api/v1/profiles/client/{id}` — fetch client profile (Client-role protected)
- [x] `GET /api/v1/profiles/tailor/{id}` — fetch public tailor profile
- [x] `GET /api/v1/profiles/tailor/{id}/verification` — check if tailor is verified
- [x] `PUT /api/v1/profiles/client/{id}/measurements` — save/update body measurements
- [x] `GET /api/v1/profiles/client/{id}/measurements` — retrieve body measurements
- [x] `409 Conflict` returned on duplicate profile registration (not `500`)

---

### 5. Tailor Shop Management
- [x] `POST /api/v1/shops/` — register a new tailor shop (Tailor-role protected)
- [x] `GET /api/v1/shops/nearby` — GPS bounding-box search (lat, lng, radius_km)
- [x] `GET /api/v1/shops/tailor/{id}` — list all shops owned by a specific tailor
- [x] `GET /api/v1/shops/{shop_id}` — get specific shop details
- [x] `PUT /api/v1/shops/{shop_id}` — update shop details (Tailor-role protected)
- [x] `DELETE /api/v1/shops/{shop_id}` — delete a shop (Tailor-role protected)
- [x] `POST /api/v1/shops/{shop_id}/images` — add portfolio image URL (Tailor-role protected)
- [x] Bounding-box geospatial algorithm implemented using latitude/longitude degree deltas (no PostGIS dependency)

---

### 6. Marketplace Order & Bidding System
- [x] `POST /api/v1/orders/requests` — client submits a clothing request (broadcast to target shops)
- [x] `GET /api/v1/orders/requests/open` — public marketplace listing of all open requests
- [x] `GET /api/v1/orders/requests/{id}` — get specific clothing request details
- [x] `GET /api/v1/orders/requests/client/{id}` — list all requests by a client
- [x] `PATCH /api/v1/orders/requests/{id}/cancel` — cancel an open request (Client-role protected)
- [x] `POST /api/v1/orders/bids` — tailor submits a bid (quote) on a shop request
- [x] `GET /api/v1/orders/shop-requests/{id}/bids` — list bids on a shop request (Tailor-role protected)
- [x] `POST /api/v1/orders/accept-bid` — client accepts a bid and creates an Order
- [x] **Bid-less (Direct) Order flow** supported: Order can be created from a `ShopRequest` without a `Bid` record
- [x] `ShopRequest` entity acts as the central junction between `ClothingRequest`, `Bid`, and `Order`

---

### 7. Order Lifecycle, Payments & Ratings
- [x] `GET /api/v1/orders/{order_id}` — get order details
- [x] `PATCH /api/v1/orders/{order_id}/status` — update order status (`in_progress` → `completed`)
- [x] `GET /api/v1/orders/shop/{shop_id}` — list all orders for a shop
- [x] `GET /api/v1/orders/client/{client_id}` — list all orders for a client
- [x] `GET /api/v1/orders/{order_id}/payment` — get payment status
- [x] `POST /api/v1/orders/payments/mock` — mock payment processing (simulates real payment gateway)
- [x] `POST /api/v1/orders/ratings` — client submits a rating for a completed order

---

### 8. Support & Notifications
- [x] `POST /support/notifications` — create a system notification for a user
- [x] `GET /support/notifications/{id}` — list a user's notifications
- [x] `PATCH /support/notifications/{id}/read` — mark notification as read
- [x] `POST /support/favorites` — add a shop to favorites
- [x] `DELETE /support/favorites/{c_id}/{s_id}` — remove a shop from favorites
- [x] `GET /support/favorites/{id}` — view a client's favorite shops

---

### 9. System Health & Infrastructure
- [x] `GET /api/v1/health` — liveness check endpoint (returns API version + DB connectivity status)
- [x] Dependency Injection container wired: `DB Session → Repository → Use Case → Endpoint` (`app/api/dependencies.py`)
- [x] Full async request handling throughout the stack (no blocking I/O)

---

### 10. Database Schema
- [x] `schema.sql` finalized with all tables: `clients`, `tailors`, `user_roles`, `shops`, `shop_images`, `clothing_requests`, `shop_requests`, `bids`, `orders`, `payments`, `ratings`, `notifications`, `favorite_shops`
- [x] Foreign key cascade rules set (`ON DELETE CASCADE` where appropriate)
- [x] `UNIQUE` constraint on `orders.shop_request_id` (enforces one order per shop request)
- [x] `updated_at` auto-update triggers defined for all mutable tables

---

### 11. Testing
- [x] Test suite in `tests/` covering API and use case layers
- [x] Use case unit tests with in-memory mocks (no live DB required)
- [x] `test_order_workflow_and_rating_recalc` — covers full Broadcast → Bid → Order flow
- [x] `test_direct_order_workflow_without_bids` — covers Direct Shop Request → skip Bid → Order flow
- [x] 13 test cases — **all passing**

---

### 12. Documentation & Dev Manuals
- [x] All markdown documentation reorganized into `docs/` folder with category sub-folders
- [x] `docs/overview/` — README and project structure
- [x] `docs/architecture/` — clean architecture and frontend architecture reports
- [x] `docs/api/` — API documentation and frontend handoff contract
- [x] `docs/features/` — login system, bidding system, nearby shops feature reports
- [x] `docs/progress/` — this progress log

---

## 🔄 In Progress / Partially Complete

| Area | Status | Notes |
|---|---|---|
| Frontend–Backend Compatibility | 🔄 Reviewed | Auth flow, role check, and profile registration endpoints verified to be compatible with frontend contract defined in `BACKEND_HANDOFF.md` |
| Database Schema Stabilization | 🔄 Stable | Schema has been refactored; `shop_requests` is now the central link for bids and orders |

---

## 📋 Planned / Not Yet Started

| Area | Priority | Description |
|---|---|---|
| **Real Payment Gateway** | Medium | Replace `POST /orders/payments/mock` with an actual payment provider (e.g., Stripe, PayHere) |
| **Image Upload** | Medium | Replace image URL strings with actual file upload endpoints (e.g., Firebase Storage or S3) |
| **Chat / Messaging** | Low | In-platform client–tailor negotiation chat (currently assumed to happen outside the app) |
| **Push Notifications** | Low | Real-time push delivery for order status changes and new bid notifications |
| **Frontend Deployment** | TBD | Next.js frontend deployment linked to this backend |
| **Production Deployment** | TBD | Backend deployment to cloud (e.g., Railway, Render, or GCP) with production Firebase credentials |
| **API Rate Limiting** | TBD | Throttle public endpoints to prevent abuse |

---

## 🔢 Progress Summary

| Category | Done | Total | % |
|---|---|---|---|
| Core Infrastructure | 9 | 9 | **100%** |
| Authentication & Security | 6 | 6 | **100%** |
| Profile Management | 7 | 7 | **100%** |
| Shop Management | 8 | 8 | **100%** |
| Orders & Bidding | 10 | 10 | **100%** |
| Payments & Ratings | 4 | 5 | **80%** (mock only) |
| Support / Notifications | 6 | 6 | **100%** |
| Testing | 13 | 13 | **100%** |
| **Overall** | **63** | **64** | **~98%** |
