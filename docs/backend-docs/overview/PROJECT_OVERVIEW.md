# Fiti Backend — Smart Tailoring Platform

Production-ready backend application built with **FastAPI**, **SQLAlchemy 2.0 (Async)**, and **Clean Architecture** principles.

---

## 📖 Project Overview

Fiti is a Smart Tailoring and Custom Fashion Platform connecting **Clients** with **Tailors**. 

This backend service handles all core business logic for clients and tailors, including:
- Profile management & body measurements
- Tailor shop discovery (GPS-based) and management
- Clothing requests (marketplace) and bidding
- Order lifecycle, mock payments, and ratings

### Post-Login Gateway Role
This backend serves as the **single post-login gateway** for Fiti users (Clients and Tailors). 

---

## 🏛️ Architecture & RBAC

### Firebase Authentication
Fiti relies on **Firebase Authentication** for identity management. The backend does not store passwords or manage sessions. Instead:
1. The frontend obtains a Firebase ID Token upon sign-in.
2. The token is sent as a `Bearer` token in the `Authorization` header.
3. The backend verifies the token and extracts the `firebase_uid`.

### Role-Based Access Control (RBAC)
Endpoints are protected using a strict RBAC system. The `require_role("role_name")` dependency ensures that a user has the appropriate role (`client` or `tailor`) before granting access to specific operations.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Default |
|---|---|---|
| `CONNECTION_STRING` | PostgreSQL database connection URL | (Required) |
| `MOCK_FIREBASE_AUTH` | Set to `True` for local testing to bypass real Firebase token verification. **MUST be `False` in production.** | `False` |
| `FIREBASE_CREDENTIALS_PATH` | Path to the Firebase Admin SDK service account JSON file. | `None` |
| `FRONTEND_ORIGINS` | Comma-separated list of allowed origins for CORS. | `*` |

---

## 🌐 Core API Endpoints

### Authentication & Gateway
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/auth/me/role` | Valid Token | Verifies user and returns role + redirect URL. |

### Profiles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/profiles/client` | Valid Token | Register a new client profile. |
| GET | `/api/v1/profiles/client/{id}` | Client | Get a client's own profile. |
| POST | `/api/v1/profiles/tailor` | Valid Token | Register a new tailor profile. |
| GET | `/api/v1/profiles/tailor/{id}` | Public | Get a tailor's public profile. |
| GET | `/api/v1/profiles/tailor/{id}/verification` | Public | Check if a tailor is verified. |

### Shops
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/shops/nearby` | Public | Search tailors by GPS radius. |
| GET | `/api/v1/shops/tailor/{id}` | Public | List all shops owned by a tailor. |
| POST | `/api/v1/shops/` | Tailor | Register a new shop. |

### Orders & Requests
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/orders/requests` | Client | Submit a new clothing request. |
| GET | `/api/v1/orders/requests/open` | Public | List all open requests (marketplace). |
| PATCH| `/api/v1/orders/requests/{id}/cancel` | Client | Cancel an open request. |
| POST | `/api/v1/orders/bids` | Tailor | Submit a bid on a shop request. |
| GET | `/api/v1/orders/shop-requests/{id}/bids`| Tailor | View bids on a shop request. |
| POST | `/api/v1/orders/accept-bid` | Client | Accept a bid and create an order. |

---

## 📁 Directory Structure

```
.
├── app/
│   ├── api/                    # Presentation Layer (HTTP / REST)
│   │   ├── dependencies.py     # FastAPI Dependency Injection
│   │   ├── schemas/            # Pydantic Models (DTOs)
│   │   └── v1/
│   │       ├── router.py       # API v1 Router
│   │       └── endpoints/      # API Route Controllers (auth, profiles, shops, orders)
│   ├── core/                   # Infrastructure & Config
│   │   ├── config.py           # App Settings
│   │   ├── database.py         # SQLAlchemy Engine
│   │   └── security.py         # Firebase Auth & RBAC Guards
│   ├── domain/                 # Domain Layer (Enterprise Rules)
│   │   ├── entities/           # Pure Domain Entities
│   │   ├── exceptions/         # Domain Exceptions
│   │   └── repositories/       # Abstract Interfaces
│   ├── infrastructure/         # DB & External Adapters
│   │   └── db/
│   │       ├── models/         # SQLAlchemy ORM Models
│   │       └── repositories/   # SQLAlchemy Implementations
│   ├── use_cases/              # Application Business Logic
│   └── main.py                 # Application Entrypoint
├── schema.sql                  # PostgreSQL Schema & Seed Data
├── pyproject.toml              # Dependencies (uv)
└── .env                        # Environment Configuration
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Using `uv`:
```bash
uv sync
```

### 2. Database Setup
Execute the `schema.sql` file against your local PostgreSQL instance to create tables and seed default roles.

### 3. Run the Application
```bash
uv run uvicorn app.main:app --reload
```

### 4. Documentation
Visit the interactive Swagger UI:
- **Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
