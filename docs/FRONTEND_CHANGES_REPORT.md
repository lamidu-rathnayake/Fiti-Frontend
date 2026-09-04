# Frontend Changes & E2E Test Suite Stabilization Report

**Date**: September 4, 2026  
**Project**: Fiti-Frontend  
**Scope**: Frontend Application Logic & Cypress E2E Suite Stabilization  

---

## Executive Summary
To eliminate intermittent test failures, DOM state race conditions, and outdated selector assertions across the **Fiti-Frontend** application, targeted updates were implemented in both component rendering logic and Cypress E2E specification files. 

Following these enhancements, all **33 E2E test cases across 6 test specifications** execute deterministically and pass with a **100% success rate**.

---

## 1. Application Code Modifications (`app/` & `components/`)

### A. Accessibility & Form Input Selectors
* **File**: `components/auth/register-forms.tsx`
* **Changes Made**:
  - Added explicit `aria-label="Account email"` and `aria-label="Password"` attributes to the email and password `<input>` fields in both `ClientRegisterForm` and `TailorRegisterForm`.
* **Rationale**:
  - Email and password inputs previously relied on placeholder text (`placeholder="name@domain.com"` and `placeholder="••••••••••••"`).
  - Adding proper `aria-label` attributes improves WCAG 2.2 accessibility compliance for screen readers and provides robust, explicit element selectors for testing (`cy.get('[aria-label="Account email"]')`), eliminating reliance on fragile placeholder strings.

---

### B. Dashboard State Initialization & Re-render Anti-Flicker Fix
* **File**: `app/(protected)/client/home/page.tsx`
* **Changes Made**:
  1. Added an initial `useEffect` hook to invoke `loadNearbyShops(6.9271, 79.8612)` immediately when `ClientHomePage` mounts.
  2. Modified `loadNearbyShops` to set `loadingShops(true)` **only when `nearbyShops` is empty**:
     ```tsx
     const loadNearbyShops = async (lat: number, lng: number) => {
         if (nearbyShops.length === 0) {
             setLoadingShops(true);
         }
         try {
             const shops = await listNearbyShops({ lat, lng, radius_km: 25 });
             setNearbyShops(shops);
         } catch {
             setNearbyShops([]);
         } finally {
             setLoadingShops(false);
         }
     };
     ```
* **Rationale**:
  - **Initial Load Race Condition**: Previously, shop data fetching depended entirely on the `MapWithOverlay` component initializing map coordinates. If the map load was delayed, shop listings remained unpopulated during test execution. Adding initial load on mount ensures instant dashboard population.
  - **Re-render Flicker**: When `MapWithOverlay` later fired location updates, `loadNearbyShops` reset `loadingShops` to `true`, unmounting store cards and showing a loading skeleton. This caused Cypress assertions checking for shop names (e.g. `Savile Row Lanka`) to fail intermittently. Suppressing the loading skeleton when shops already exist allows smooth background updates without DOM unmounting.

---

## 2. E2E Test Suite Modifications (`cypress/e2e/`)

### A. Form Input & Button Matcher Synchronization
* **File**: `cypress/e2e/registration.cy.ts`
* **Changes Made**:
  1. Updated input field placeholders (`input[placeholder="PERERA"]`, `input[placeholder="45 TEMPLE ROAD, MAHARAGAMA"]`, `input[placeholder="77 900 0000"]`, etc.) to match current component placeholders in `register-forms.tsx`.
  2. Replaced exact step heading string assertions with flexible case-insensitive regex matchers (`cy.contains(/step 01/i)`, `cy.contains(/step 02/i)`).
  3. Updated submit button selectors to match component button text (`/create account/i` instead of `/create client account/i`, and `/complete registration/i` instead of `/complete registration & launch shop/i`).
* **Rationale**:
  - Outdated test specs contained stale placeholder text and button labels from prior UI iterations. Synchronizing test selectors with the active UI components eliminated selector timeout failures.

---

### B. Endpoint Interception Pattern Fix
* **File**: `cypress/e2e/client_flow.cy.ts`
* **Changes Made**:
  - Converted glob string intercept `cy.intercept("GET", "**/api/v1/shops*", ...)` to RegExp intercept `cy.intercept("GET", /\/api\/v1\/shops/, ...)`.
* **Rationale**:
  - In minimatch glob matching (used by Cypress string pattern intercepts), single asterisk `*` does **not** match across path slashes (`/`). As a result, `"**/api/v1/shops*"` intercepted `/api/v1/shops` but ignored `/api/v1/shops/nearby`.
  - Switching to RegExp ensures all shop subpaths (`/api/v1/shops/nearby`, `/api/v1/shops/tailor/*`) are intercepted reliably during testing.

---

## 3. Test Execution Verification

Executed full E2E test suite (`npm run test:e2e`):

| Spec File | Tests Passed | Status |
| :--- | :---: | :---: |
| `cypress/e2e/auth.cy.ts` | 4 / 4 | PASS |
| `cypress/e2e/auth_and_public.cy.ts` | 9 / 9 | PASS |
| `cypress/e2e/client_flow.cy.ts` | 6 / 6 | PASS |
| `cypress/e2e/navigation_and_theme.cy.ts` | 3 / 3 | PASS |
| `cypress/e2e/registration.cy.ts` | 7 / 7 | PASS |
| `cypress/e2e/tailor_flow.cy.ts` | 4 / 4 | PASS |
| **TOTAL** | **33 / 33** | **100% PASS** |

---

## 4. Light Theme Restoration & UX Consistency
* **Target Pages**: Landing Page (`/`), Login (`/login`), Registration (`/register`, `/register/[role]`), Onboarding (`/onboarding`).
* **Changes Made**:
  - Restored clean, high-contrast light theme aesthetic across all authentication, onboarding, and public marketing pages.
  - Retained warm beige (`bg-warm-beige`), rich earth text (`text-earth-text`), and terracotta accent styling (`bg-accent`), eliminating dark mode overrides from public landing pages.
* **Rationale**:
  - Ensures a welcoming, accessible visual identity across the main user entry points while reserving dark luxury themes strictly for specialized interactive showcase modals.

---

## 5. Shop Portfolio Work Sample Card Refactoring
* **Target Pages & Types**:
  - `lib/api/types/shop.ts` (Added `parseShopImage` backward-compatible parsing helper)
  - `app/(protected)/client/shop/[shopId]/page.tsx` (Public Client Shop View)
  - `app/(protected)/tailor/home/page.tsx` (Tailor Dashboard Portfolio Management)
  - `app/(protected)/tailor/shop/[shopId]/page.tsx` (Tailor Shop Profile Management)
* **Changes Made**:
  1. **Structure over Cover Image**: Converted the shop work sample section from simple uncaptioned image grids to a card-by-card showcase where each work sample item is rendered as a standalone card featuring a photo, item index, and text description.
  2. **Dedicated Hero Banner**: Removed using portfolio work photos as the shop cover photo. The hero section now features a dedicated atelier luxury hero pattern, keeping portfolio photos strictly within the work showcase section.
  3. **"Add Work Card" Modal Flow**: Implemented a mandatory modal flow when tailors add a work sample to their shop. Tailors must provide both a photo (uploaded via Cloudinary) and a text description describing the custom garment, embroidery, or tailoring work.
  4. **Data Model Compatibility (`parseShopImage`)**:
     - `ShopImage` backend models store `image_url` strings. To support descriptions without requiring schema migrations, images uploaded with descriptions are stored as structured JSON strings (`{"url":"...","description":"..."}`).
     - Developed `parseShopImage(img)` to safely parse both legacy plain URL strings and new JSON metadata strings, falling back gracefully for backwards compatibility.
  5. **Enhanced Lightbox Modal**: Updated full-screen lightbox inspection modals across client and tailor views to display the high-resolution garment photo alongside its full text description.

