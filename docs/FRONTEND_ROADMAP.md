# Frontend Development Roadmap

This document outlines the current state of the Fiti Frontend application and the strategic, step-by-step roadmap for upcoming development. Based on best UI/UX practices, the roadmap prioritizes core functional loops (profiles, direct ordering, and dashboards) before introducing complex marketplace dynamics (bidding).

---

## ✅ Current State (Completed Features)

*   **Auth & Onboarding Architecture:** Fully functional Firebase Auth integration with secure JWT backend communication.
*   **Role-Based Routing:** Strict routing and authorization based on the user's role (`client` or `tailor`).
*   **Profile Generation:** Multi-step onboarding flows for both Clients and Tailors, including Cloudinary image uploads and location picking.
*   **Global UI Components:** A cohesive dark/gold UI theme with global loading overlays and responsive form designs.
*   **Basic Home Pages:** Initial setup for Client and Tailor home pages, including basic location capture.

---

## 🚀 Phase 1: Navigation & Client Foundations
*Goal: Establish a seamless navigation experience and build the foundational data structures for clients.*

### 1.1 Responsive Global Navigation
*   **Feature:** A persistent, mobile-first navigation bar.
*   **Client Links:** Home, Discover Shops, My Orders, Profile & Settings.
*   **Tailor Links:** Dashboard, My Shops, Job Board, Profile.
*   **UI/UX:** Hamburger menu for mobile with smooth slide-out animations. Sticky header on desktop.

### 1.2 Client Measurement Profile
*   **Feature:** A dedicated section in Client Settings to manage base body measurements (Chest, Waist, Shoulder, Sleeve, etc.).
*   **UX Benefit:** Saves clients from re-typing measurements for every order.
*   **Action:** Add CRUD UI and connect to `PUT /api/v1/profiles/client/{id}/measurements`.

### 1.3 Client Settings & Profile Management
*   **Feature:** Allow clients to update their contact number, default city, address, and profile picture.

---

## 🏬 Phase 2: Tailor Dashboard & Shop Management
*Goal: Empower tailors to manage multiple businesses, update shop profiles, and track high-level metrics.*

### 2.1 Multi-Shop Context Switcher
*   **Feature:** A dropdown in the Tailor Navigation/Header allowing the tailor to switch between their different shops (or create a new one).
*   **Context:** All dashboard data (orders, requests, stats) will reactively filter based on the currently selected shop.

### 2.2 Shop Dashboard Summary
*   **Feature:** High-level metric cards for the active shop: Active Orders, Pending Requests, and Average Rating.

### 2.3 Shop Settings & Location Management
*   **Feature:** Forms to update the Shop Bio, Specialty, and Contact Info.
*   **Location Handling:** A specific map picker to update the **Shop's Location**, which is strictly decoupled from the Tailor's personal location.

### 2.4 Portfolio Gallery Management
*   **Feature:** A UI for tailors to upload, arrange, and delete images of their past work to display on their public storefront.

---

## 🛍️ Phase 3: The Digital Storefront & Direct Ordering
*Goal: Connect clients to tailors through search and direct requests.*

### 3.1 Shop Discovery (Client Side)
*   **Feature:** A "Discover" page with a grid/list of shops.
*   **Filters:** Search by city, specialty, and GPS radius (Nearby Shops).

### 3.2 The Public Shop Profile (Digital Storefront)
*   **Feature:** When a client clicks a shop, they navigate to `/shops/[id]`.
*   **UI Elements:** Shop banner, rating, bio, contact info, interactive location map, and the Portfolio Gallery.
*   **Action:** Prominent "Request Custom Order" button.

### 3.3 The Clothing Request Engine (Direct to Shop)
*   **Feature:** A premium, multi-step form for clients to place an order directly with a shop.
*   **Step 1:** Details (Category, Gender, Fabric Status, Description).
*   **Step 2:** Media (Voice notes via Firebase, Inspiration Image uploads).
*   **Step 3:** Measurements (Auto-fill from Phase 1.2, with the ability to override).
*   **Step 4:** Delivery (Service Type: Online vs Physical Visit, and Target Deadline/Budget).

---

## 📊 Phase 4: Order Tracking & Business Lifecycle
*Goal: Allow both parties to track work in progress and build trust.*

### 4.1 Client Order Dashboard
*   **Feature:** Tabs for "Pending Responses", "In Progress", and "Completed" orders.

### 4.2 Tailor Order Management
*   **Feature:** UI for tailors to view incoming Direct Requests, Accept/Reject them, and update the status of active jobs to 'Completed'.

### 4.3 Reputation System
*   **Feature:** After an order is marked 'Completed', prompt the client to leave a 1-5 star rating and review.
*   **Favorites:** Allow clients to "Bookmark/Heart" their favorite shops from the Digital Storefront.

---

## ⚖️ Phase 5: The Bidding System (Marketplace)
*Goal: Implement the open marketplace dynamics as the final feature, utilizing the stable request engine built in Phase 3.*

### 5.1 Public Open Requests
*   **Feature:** Clients can choose to post a Clothing Request to the "Open Market" rather than targeting a specific shop.

### 5.2 Tailor Job Board
*   **Feature:** A feed where tailors can browse unassigned requests in their area.

### 5.3 Bidding UI & Negotiation
*   **Tailor Action:** View an open request and submit a Bid (Proposed Price + Message).
*   **Client Action:** Compare received bids on their request, view the bidding tailors' profiles, and click "Accept Bid" to initiate an Order.
