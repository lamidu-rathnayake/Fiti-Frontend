# Fiti Platform — Comprehensive Test Cases Documentation

This document provides a detailed index of all test cases implemented across the **Backend (FastAPI & Pytest)** and **Frontend (Next.js & Cypress E2E)** test suites.

---

## 1. Backend Test Cases (Pytest & FastAPI)

### A. API Integration & Endpoint Suite (`Fiti/tests/test_api.py`)

| Test Case Function | API Endpoint / Resource | Objective & Description |
|---|---|---|
| `test_health_check_endpoint` | `GET /api/v1/health` | Verifies that the backend health check endpoint returns HTTP 200 with `status: "healthy"`. |
| `test_option2_client_registration_without_body_id` | `POST /api/v1/profiles/client` | Validates automatic extraction of Firebase UID from the authentication security context when `id` is omitted in request body. |
| `test_full_marketplace_workflow_api` | End-to-End API Flow | Validates complete multi-step marketplace lifecycle: <br>1. Client Profile Registration (`POST /api/v1/profiles/client`) <br>2. Tailor Profile Registration with NIC (`POST /api/v1/profiles/tailor`) <br>3. Duplicate Registration Prevention (Expects HTTP 409 Conflict) <br>4. Client Body Measurements Update (`PUT /api/v1/profiles/client/{id}/measurements`) <br>5. Shop Creation (`POST /api/v1/shops/`) <br>6. Clothing Request Creation (`POST /api/v1/orders/requests`) <br>7. Tailor Bid Submission (`POST /api/v1/orders/bids`) <br>8. Bid Acceptance & Order Creation (`POST /api/v1/orders/accept-bid`) <br>9. Payment Processing (`POST /api/v1/orders/payments/mock`) <br>10. Order Completion (`PATCH /api/v1/orders/{id}/status?order_status=completed`) <br>11. Rating & Review (`POST /api/v1/orders/ratings`) |
| `test_support_endpoints` | `/api/v1/support/*` | Verifies notification creation, reading, client favorite shop adding, listing, and deletion endpoints. |
| `test_shop_listing_and_update_endpoints` | `/api/v1/shops/*` | Verifies shop CRUD, shop image uploads, GPS radius proximity search (`GET /api/v1/shops/nearby`), tailor shop filtering, RBAC authorization guard (unauthorized shop update returns 403/404), and shop deletion. |

---

### B. Domain & Use Case Unit Tests (`Fiti/tests/test_use_cases.py`)

| Test Case Function | Domain Unit / Use Case | Objective & Description |
|---|---|---|
| `test_register_client_profile` | `ManageProfileUseCase` | Verifies client profile registration logic and DTO mapping. |
| `test_register_client_duplicate_raises_error` | `ManageProfileUseCase` | Asserts `ProfileAlreadyExistsError` exception when trying to re-register an existing client ID. |
| `test_register_tailor_profile` | `ManageProfileUseCase` | Verifies tailor profile registration and default `is_verified: False` status. |
| `test_shop_crud_operations` | `ManageShopUseCase` | Tests shop creation, retrieval by ID, updating shop fields, listing by tailor ID, and shop deletion. |
| `test_rbac_operations` | `ManageRBACUseCase` | Verifies role assignment, user access overview generation, route authorization checks, and throwing `AccessDeniedError` on unauthorized section access. |
| `test_order_workflow_and_rating_recalc` | `ManageOrderUseCase` | Verifies order placement, bid acceptance, and automatic calculation of a shop's average star rating upon client review submission. |
| `test_direct_order_workflow_without_bids` | `ManageOrderUseCase` | Tests direct (offline/negotiated) order placement directly from a targeted shop request, bypassing the broadcast bidding phase. |
| `test_support_operations` | `ManageSupportUseCase` | Tests notification repository operations, read status toggles, and client favorite shop list management. |

---

## 2. Frontend Test Cases (Cypress E2E)

### A. Authentication & Public Pages (`cypress/e2e/auth_and_public.cy.ts` & `cypress/e2e/auth.cy.ts`)

| Spec / Test Name | Target Route / Feature | Objective & Description |
|---|---|---|
| **Home Page Verification** | `/` (Landing Page) | Verifies brand logo, header links ("Fabrics", "Ateliers", "How It Works"), hero banner slides, CTA buttons, and process section. |
| **Theme Switcher Toggle** | All Pages | Toggles light and dark modes via theme switcher button, verifying `dark` class on root `<html>` element. |
| **Terms of Service Page** | `/terms` | Verifies rendering of Terms of Service title and "Back to Home" navigation link. |
| **Privacy Policy Page** | `/privacy` | Verifies rendering of Privacy Policy title and navigation links. |
| **Contact Us Form** | `/contact` | Fills out contact form inputs (Name, Email, Subject, Message), submits form, and asserts confirmation state ("Message Dispatched"). |
| **Unauthenticated Route Guard** | `/client/home` | Attempts unauthenticated access to protected `/client/home` route and asserts automatic redirect to `/login`. |
| **Login Form Interface** | `/login` | Verifies email and password input fields, sign-in button, and password visibility toggling. |
| **Invalid Credentials Alert** | `/login` | Intercepts Firebase authentication endpoint with HTTP 400 error and verifies inline error banner ("Incorrect email or password"). |
| **Registration Link Navigation** | `/login` -> `/register` | Clicks "Create an account" link and verifies navigation to role selection page. |

---

### B. User Onboarding & Registration (`cypress/e2e/registration.cy.ts`)

| Spec / Test Name | Target Route / Feature | Objective & Description |
|---|---|---|
| **Role Choice Presentation** | `/register` | Verifies selection cards for "Client" ("I WANT CUSTOM CLOTHES") and "Tailor" ("I AM A TAILOR / ARTISAN"). |
| **Role Selection Navigation** | `/register` | Clicks role cards and verifies routing to `/register/client` or `/register/tailor`. |
| **Client Registration Rendering** | `/register/client` | Verifies all client input fields (Full Name, Address, City, WhatsApp, Gender, Age, Email, Password). |
| **Client Registration Submission** | `/register/client` | Fills out client form, mocks Firebase user creation & `/api/v1/profiles/client` backend API calls, and verifies account creation flow. |
| **Tailor Step 1 Completion** | `/register/tailor` | Fills Step 01 (Personal Profile: Name, Address, City, Bio, WhatsApp, Gender, Age) and advances to Step 02 via "Continue to Shop Details". |
| **Tailor Multi-Step Submission** | `/register/tailor` | Completes Step 01 & Step 02 (Shop Name, Shop Bio, Shop Address, Shop City, Shop Contact, Reg Number, Email, Password), mocks Firebase & backend APIs, and verifies shop launch flow. |

---

### C. Client User Flow & Features (`cypress/e2e/client_flow.cy.ts`)

| Spec / Test Name | Target Route / Feature | Objective & Description |
|---|---|---|
| **Client Home Dashboard** | `/client/home` | Mocks authenticated client session, verifies client navigation header (Home, Orders, Tailors, Broadcast), search inputs, and shop listings. |
| **Mobile Drawer Sidebar** | `/client/home` | Simulates mobile viewport, opens hamburger navigation drawer menu, and closes drawer menu. |
| **Direct Request Form** | `/client/directRequest` | Loads direct custom garment request form for targeted tailor ordering. |
| **Broadcast Request Form** | `/client/biddingRequest` | Loads broadcast request form for posting open briefs to the atelier marketplace. |
| **Client Orders Management** | `/client/orders` | Displays active orders tab, broadcast request briefs, and order status indicators (`in_progress`, `completed`, `cancelled`). |
| **Body Measurements Profile** | `/client/profile` | Displays personal profile details and standard body measurement inputs (Chest, Waist, Hips, Inseam, Neck, Shoulder). |

---

### D. Tailor Artisan & Shop Management (`cypress/e2e/tailor_flow.cy.ts`)

| Spec / Test Name | Target Route / Feature | Objective & Description |
|---|---|---|
| **Tailor Home Dashboard** | `/tailor/home` | Mocks authenticated tailor session, verifies tailor navigation header (Dashboard, Orders, Shop profile link), and statistics overview cards. |
| **Tailor Shop Creation** | `/tailor/add-shop` | Loads shop registration form for tailors to add new ateliers. |
| **Atelier Location Setup** | `/tailor/location` | Loads Leaflet interactive map picker for setting atelier GPS coordinates and reverse geocoding shop address. |
| **Tailor Orders & Broadcast Market** | `/tailor/orders` | Verifies tailor orders management interface, active client orders list, and open broadcast marketplace bidding tab. |

---

### E. Security Guards & System Themes (`cypress/e2e/navigation_and_theme.cy.ts`)

| Spec / Test Name | Target Route / Feature | Objective & Description |
|---|---|---|
| **Client RBAC Redirect Guard** | `/tailor/orders` | Mocks client user role, attempts visiting tailor-only route `/tailor/orders`, and asserts automatic redirect to `/client/home`. |
| **Tailor RBAC Redirect Guard** | `/client/biddingRequest` | Mocks tailor user role, attempts visiting client-only route `/client/biddingRequest`, and asserts automatic redirect to `/tailor/home`. |
| **Theme Class Persistence** | All Routes | Toggles dark mode on main page, navigates to `/terms`, and verifies that `dark` class remains persisted on root HTML element. |

---

## 3. Test Suite Execution Commands

### Running Backend Tests (Pytest)
```bash
# Run all backend unit & API tests
cd Fiti
pytest -v

# Run with coverage report
pytest --cov=app tests/
```

### Running Frontend Tests (Cypress E2E)
```bash
# Run Cypress E2E tests headless (starts Next.js server automatically)
cd Fiti-Frontend
npm run test:e2e

# Open Cypress interactive GUI test runner
npm run test:e2e:open
```
