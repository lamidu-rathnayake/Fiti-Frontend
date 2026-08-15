# Fiti Backend — Architecture & File Structure

**Stack**: FastAPI · SQLAlchemy 2.0 (Async) · PostgreSQL · Firebase Auth · Pydantic V2

This document is the single source of truth for the Clean Architecture design of the Fiti Backend. It covers the layer diagram, key principles, full directory layout, and a file-by-file breakdown of every component.

---

## 1. Architecture Overview

The application is structured into strict concentric layers based on **Clean Architecture** (Uncle Bob / Domain-Driven Design). Dependencies flow strictly **inward**:

```
Presentation → Use Cases → Domain ← Infrastructure
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     1. API / Presentation Layer                         │
│       app/api/  — FastAPI endpoints, Pydantic schemas, routing          │
├─────────────────────────────────────────────────────────────────────────┤
│                     2. Application / Use Cases Layer                    │
│       app/use_cases/  — Orchestration logic, DTOs                       │
├─────────────────────────────────────────────────────────────────────────┤
│                     3. Domain Layer (Pure Python Core)                  │
│       app/domain/  — Entities, abstract repositories, exceptions        │
├─────────────────────────────────────────────────────────────────────────┤
│                     4. Infrastructure Layer                             │
│       app/infrastructure/  — SQLAlchemy ORM models & repositories       │
│       app/core/            — Firebase Auth, DB engine, config           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Dependency Inversion** — High-level business logic (Domain/Use Cases) never depends on low-level details (SQLAlchemy/FastAPI). Low-level adapters implement abstract interfaces defined in the domain.
2. **Framework-Agnostic Domain** — `app/domain/` contains only pure Python dataclasses with zero FastAPI or SQLAlchemy imports.
3. **Decoupled Identity** — Authentication (passwords, JWTs) is offloaded to Firebase Auth. PostgreSQL manages business entity data using the Firebase `uid` string as a primary key reference.
4. **Testability** — Every use case can be unit-tested in isolation by mocking the domain repository interfaces without running a real database or server.

---

## 2. Directory Layout

```
.
├── app/
│   ├── api/                        # Presentation Layer (HTTP / REST)
│   │   ├── dependencies.py         # FastAPI Dependency Injection wiring
│   │   ├── schemas/                # Pydantic Request/Response Models (DTOs)
│   │   └── v1/
│   │       ├── router.py           # Central API v1 Router
│   │       └── endpoints/          # Route Controllers
│   │           ├── auth.py         # POST-login gateway
│   │           ├── profiles.py     # Client & tailor profiles
│   │           ├── shops.py        # Shop management & geosearch
│   │           ├── orders.py       # Marketplace requests, bids, orders
│   │           ├── support.py      # Notifications & favorites
│   │           └── health.py       # Liveness check
│   ├── core/                       # Infrastructure Core & Config
│   │   ├── config.py               # App settings (pydantic-settings)
│   │   ├── database.py             # SQLAlchemy async engine & session
│   │   └── security.py             # Firebase token verification & RBAC guards
│   ├── domain/                     # Domain Layer (Enterprise Rules)
│   │   ├── entities/               # Pure Python domain dataclasses
│   │   ├── exceptions/             # Domain-specific exceptions
│   │   └── repositories/           # Abstract repository interfaces (ABCs)
│   ├── infrastructure/             # Database & External Adapters
│   │   └── db/
│   │       ├── models/             # SQLAlchemy ORM Models
│   │       └── repositories/       # SQLAlchemy concrete implementations
│   ├── use_cases/                  # Application Business Logic
│   │   ├── dtos/                   # Internal Data Transfer Objects
│   │   ├── user/manage_profile.py
│   │   ├── shop/manage_shop.py
│   │   ├── order/manage_order.py
│   │   └── rbac/manage_rbac.py
│   └── main.py                     # FastAPI app entrypoint
├── tests/                          # Automated test suites
├── schema.sql                      # PostgreSQL DDL (all tables & triggers)
├── pyproject.toml                  # Dependencies (uv)
└── .env                            # Environment configuration
```

---

## 3. Layer-by-Layer File Breakdown

### Layer 1 — Domain (`app/domain/`) *Enterprise Core*

Contains pure Python business logic with no framework dependencies.

#### Entities (`app/domain/entities/`)
Pure dataclasses representing core domain objects.

| File | Contents |
|---|---|
| `user.py` | `Client`, `Tailor`, `MeasurementProfile`, `GenderEnum` |
| `shop.py` | `Shop`, `ShopImage` |
| `order.py` | `ClothingRequest`, `ShopRequest`, `Bid`, `Order`, `Payment`, `Rating`, all status enums |
| `rbac.py` | `Role`, `Permission`, `UserRole` |
| `support.py` | `Notification`, `FavoriteShop` |

#### Repository Contracts (`app/domain/repositories/`)
Abstract Base Classes (ABCs) defining required persistence operations. The domain never calls SQLAlchemy directly — only these interfaces.

| File | Interface |
|---|---|
| `profile_repository.py` | `AbstractClientRepository`, `AbstractTailorRepository`, `AbstractMeasurementProfileRepository` |
| `shop_repository.py` | `AbstractShopRepository` |
| `order_repository.py` | `AbstractOrderRepository` |
| `rbac_repository.py` | `AbstractRBACRepository` |
| `notification_repository.py` | `AbstractNotificationRepository` |

#### Domain Exceptions (`app/domain/exceptions/`)

| File | Exceptions |
|---|---|
| `user.py` | `ProfileAlreadyExistsError`, `ProfileNotFoundError` |
| `shop.py` | `ShopNotFoundError` |
| `order.py` | `OrderNotFoundError`, `InvalidOrderStateError`, `BidNotFoundError` |
| `rbac.py` | `RoleNotFoundError`, `PermissionDeniedError` |

---

### Layer 2 — Use Cases (`app/use_cases/`) *Business Workflows*

Orchestrates domain entities to execute application business workflows.

#### DTOs (`app/use_cases/dtos/`)
Internal Data Transfer Objects that carry data between the API layer and use cases.

| File | Contents |
|---|---|
| `user_dto.py` | Client/tailor registration DTOs, measurement DTOs |
| `shop_dto.py` | Shop creation and update DTOs |
| `order_dto.py` | Clothing request, bid, order, payment, and rating DTOs |
| `rbac_dto.py` | Role assignment DTOs |

#### Workflows

| File | Class | Responsibilities |
|---|---|---|
| `user/manage_profile.py` | `ManageProfileUseCase` | Profile creation, measurement upserts |
| `shop/manage_shop.py` | `ManageShopUseCase` | Shop CRUD, GPS search, verification toggling |
| `order/manage_order.py` | `ManageOrderUseCase` | Full marketplace flow: request → bid → order → payment → rating |
| `rbac/manage_rbac.py` | `ManageRBACUseCase` | Role assignment and permission verification |

---

### Layer 3 — Infrastructure (`app/infrastructure/`) *DB & External Adapters*

Handles all technical details: SQLAlchemy ORM models and concrete repository implementations.

#### ORM Models (`app/infrastructure/db/models/`)

| File | SQLAlchemy Models |
|---|---|
| `user_model.py` | `ClientModel`, `TailorModel`, `MeasurementProfileModel` |
| `shop_model.py` | `ShopModel`, `ShopImageModel` |
| `order_model.py` | `ClothingRequestModel`, `ShopRequestModel`, `BidModel`, `OrderModel`, `PaymentModel`, `RatingModel` |
| `rbac_model.py` | `RoleModel`, `PermissionModel`, `UserRoleModel` |
| `support_model.py` | `NotificationModel`, `FavoriteShopModel` |

#### Repository Implementations (`app/infrastructure/db/repositories/`)

| File | Implements |
|---|---|
| `sqlalchemy_profile_repository.py` | `AbstractClientRepository`, `AbstractTailorRepository`, `AbstractMeasurementProfileRepository` |
| `sqlalchemy_shop_repository.py` | `AbstractShopRepository` (includes GPS bounding-box query) |
| `sqlalchemy_order_repository.py` | `AbstractOrderRepository` (complex relational queries for orders, bids, status transitions) |
| `sqlalchemy_rbac_repository.py` | `AbstractRBACRepository` |
| `sqlalchemy_support_repository.py` | `AbstractNotificationRepository` |

---

### Layer 4 — API / Presentation (`app/api/`) *HTTP Delivery*

#### Request/Response Schemas (`app/api/schemas/`)

| File | Pydantic Schemas |
|---|---|
| `user_schema.py` | `ClientRegisterRequest`, `TailorRegisterRequest`, `MeasurementProfileRequest` |
| `shop_schema.py` | `ShopCreateRequest`, `ShopResponse` |
| `order_schema.py` | `ClothingRequestCreate`, `BidSubmitRequest`, `AcceptBidRequest`, `MockPaymentRequest`, `RatingCreateRequest` |

#### HTTP Endpoints (`app/api/v1/endpoints/`)

| File | Routes |
|---|---|
| `auth.py` | `GET /api/v1/auth/me/role` — post-login gateway |
| `profiles.py` | `/api/v1/profiles/client`, `/api/v1/profiles/tailor` |
| `shops.py` | `/api/v1/shops/` — CRUD + GPS search |
| `orders.py` | `/api/v1/orders/` — requests, bids, orders, payments, ratings |
| `support.py` | `/api/v1/support/` — notifications, favorites |
| `health.py` | `GET /api/v1/health` |

#### Wiring

- **`app/api/v1/router.py`** — Aggregates all endpoint routers under `/api/v1`.
- **`app/api/dependencies.py`** — FastAPI Dependency Container: wires `AsyncSession → Repository → UseCase → Endpoint`.

---

### Configuration & Security (`app/core/`)

| File | Purpose |
|---|---|
| `config.py` | Environment variable management via `pydantic-settings` (`DATABASE_URL`, `FIREBASE_CREDENTIALS_PATH`, `MOCK_FIREBASE_AUTH`) |
| `database.py` | Configures `create_async_engine` and `async_sessionmaker`; exposes `get_db_session()` FastAPI dependency |
| `security.py` | Firebase JWT verification via `firebase-admin` SDK (`get_current_user`, `get_current_user_uid`); `require_role()` RBAC guard factory |

---

## 4. Real-World Data Flow Trace

To make the architecture concrete, here is how data moves through **every layer** for a single marketplace transaction.

### Scenario
1. Tailor *Kamal* registers via `POST /api/v1/profiles/tailor`.
2. Kamal creates *"Kamal Royal Tailors"* via `POST /api/v1/shops/`.
3. Client *Nimal* broadcasts a suit request via `POST /api/v1/orders/requests`.
4. Kamal bids LKR 25,000 via `POST /api/v1/orders/bids`.
5. Nimal accepts via `POST /api/v1/orders/accept-bid`.

### Execution Chain

```
[ HTTP Request arrives ]
       │
       ▼
1. app/api/v1/endpoints/orders.py
       │  Validates JSON → app/api/schemas/order_schema.py
       │  Verifies token → app/core/security.py (Firebase verify_id_token)
       │  Resolves deps  → app/api/dependencies.py
       ▼
2. app/use_cases/order/manage_order.py  (ManageOrderUseCase)
       │  Converts schema → app/use_cases/dtos/order_dto.py
       │  Applies rules   → app/domain/entities/order.py
       ▼
3. app/domain/repositories/order_repository.py  (Abstract interface call)
       ▼
4. app/infrastructure/db/repositories/sqlalchemy_order_repository.py
       │  Maps entity → app/infrastructure/db/models/order_model.py
       │  Executes   → app/core/database.py  (PostgreSQL)
       ▼
[ HTTP 201 Created JSON Response ]
```

---

## 5. Architecture Benefits

| Benefit | How it's achieved |
|---|---|
| **Testability** | Use cases unit-tested by mocking abstract repository interfaces — no DB or server needed |
| **Security** | Firebase handles auth identity; backend statelessly verifies tokens in `security.py` |
| **Flexibility** | Swapping PostgreSQL for another DB only requires new implementations in `app/infrastructure/` — zero changes to business logic |
| **Maintainability** | Each layer has a single responsibility; changes are localized and don't cascade across layers |
