# Project Progress

> **Notice:** This document tracks the current development state of the Fiti Frontend. 

## ✅ Completed
- Re-architected data layer to remove Firestore dependency.
- Synced Client and Tailor profile forms directly with Supabase via Backend API.
- Implemented robust JWT-based authentication flow with Firebase Auth.
- Fixed layout centering and styling issues on the registration and login pages.
- Patched the infinite redirect bug on Google Login by adding fallback profile checks (bypassing the backend `user_roles` bug).
- Integrated Playwright for automated End-to-End UI testing.
- Created automated test scripts for authentication, registration, and protected routing flows.

## 🚧 In Progress / Known Issues
- Backend is currently failing to insert the `role_id` into the `user_roles` table upon user registration. (Handoff document provided for Backend Agent).