# Project Progress

> **Notice:** This document tracks the current development state of the Fiti Frontend.

## ✅ Completed

- Re-architected data layer to remove Firestore dependency.
- Synced Client and Tailor profile forms directly with Supabase via Backend API.
- Implemented robust JWT-based authentication flow with Firebase Auth.
- Fixed layout centering and styling issues on the registration and login pages.
- Integrated Playwright for automated End-to-End UI testing.
- Created automated test scripts for authentication, registration, and protected routing flows.
- **Auth Architecture Update:** Uses frontend-driven routing from the backend `/auth/me/role` endpoint. Missing roles go to `/onboarding`; valid roles go to `/client/home` or `/tailor/home`.
- Added user-facing Firebase error handling for invalid credentials, disabled accounts, rate limits, network failures, and missing provider configuration.
- Added accessible labels and stable action names for login and client/tailor registration flows.
- **Clothing Request Engine (V2):** Developed the core request form featuring a multi-step media UI, including:
    - Client-side voice note recording and direct-to-Firebase Storage upload.
    - Multi-image Inspiration Gallery uploads via Cloudinary.
    - Granular toggles for Service Types (Online vs Physical Visit).

## ✅ Available Screens

- Client storefront, tailor discovery, shop profiles, direct requests, broadcast/bidding requests, profile, and orders.
- Tailor home/dashboard, shop creation, location, and orders.
- Public contact, privacy, and terms pages.

## 🚧 In Progress / Next Steps

- Connect remaining marketplace and order screens to production backend data where mocks or incomplete integrations remain.
- Complete Tailor Job Board and Bidding & Order Negotiation UI integrations.
- Complete mock payment, ratings, bookmarks, and notification workflows.
