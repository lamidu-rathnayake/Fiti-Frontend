# Project Progress

> **Notice:** This document tracks the current development state of the Fiti Frontend. 

## ✅ Completed
- Re-architected data layer to remove Firestore dependency.
- Synced Client and Tailor profile forms directly with Supabase via Backend API.
- Implemented robust JWT-based authentication flow with Firebase Auth.
- Fixed layout centering and styling issues on the registration and login pages.
- Integrated Playwright for automated End-to-End UI testing.
- Created automated test scripts for authentication, registration, and protected routing flows.
- **Auth Architecture Update:** Migrated to strict industry-standard frontend-driven routing using the backend `/auth/me/role` endpoint, removing legacy fallback logic.
- **Clothing Request Engine (V2):** Developed the core request form featuring a multi-step media UI, including:
  - Client-side voice note recording and direct-to-Firebase Storage upload.
  - Multi-image Inspiration Gallery uploads via Cloudinary.
  - Granular toggles for Service Types (Online vs Physical Visit).

## 🚧 In Progress / Next Steps
- Implement Tailor Job Board for browsing open requests.
- Build Bidding & Order Negotiation UI.
- Mock Payment Gateway integration for active orders.
- Reputation system (Ratings & Bookmarks).
