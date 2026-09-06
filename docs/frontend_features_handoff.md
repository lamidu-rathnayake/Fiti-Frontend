# Frontend Implementation Handoff — Ready Features

This document outlines all the fully functional backend features and workflows that are currently ready to be implemented in the Fiti frontend UI. You can use this as your master task list for frontend development.

---

## 1. Authentication & Onboarding Flow

The frontend now supports a complete role-based onboarding flow using Firebase Auth and the backend profile API.

- **Role Routing Mechanism (Industry Standard Frontend-Driven Routing)**:
    - **Feature**: When a user logs in via Firebase, call `GET /api/v1/auth/me/role` to check their role.
    - **API Update**: The backend role response is treated as `{ role: "client" | "tailor" }`; any optional redirect field is ignored by the login page. The frontend owns destination routing.
    - **UI Logic**: The frontend must now handle the routing. If it returns `404`, redirect to `/onboarding`. If it returns a role, use a `switch` statement or route map in your React code to push them to their respective dashboard (`/client/home` or `/tailor/home`).
- **Client Onboarding**: **Implemented**
    - **Feature**: Registration and onboarding collect name, phone/WhatsApp, city, address, optional map coordinates, email, and password.
    - **API**: `POST /api/v1/profiles/client`
- **Tailor/tailor Onboarding**: **Implemented**
    - **Feature**: Two-step registration collects personal information, shop details, location, and creates the first shop. Onboarding also supports profile, shop, and NIC image uploads.
    - **APIs**: `POST /api/v1/profiles/tailor` followed by `POST /api/v1/shops/`

## 2. Profile & Shop Management

Users need screens to view and manage their public presence and settings.

- **Client Settings & Body Measurements**:
    - **Feature**: A settings page where clients can update their contact info and save their base body measurements (chest, waist, etc.) for quick use in future orders.
    - **APIs**: `PATCH /api/v1/profiles/client/{id}`, `PUT /api/v1/profiles/client/{id}/measurements`
- **Tailor Portfolio & Shop Management**:
    - **Feature**: A dashboard where tailors can update their shop bio, specialty (e.g., Bridal, Alterations), address, and upload portfolio images of their work.
    - **APIs**: `PUT /api/v1/shops/{id}`, `POST /api/v1/shops/{id}/images`
- **Shop Discovery (Marketplace)**: **Implemented in the client storefront and tailor discovery screens.**
    - **Feature**: A public client page to browse all shops, filter by city, or find nearby tailors using GPS radius (requires frontend to ask for location permissions).
    - **APIs**: `GET /api/v1/shops/`, `GET /api/v1/shops/nearby`

## 3. The Clothing Request Engine (Core Feature)

The primary feature where clients request custom clothing. The backend supports rich media and hybrid workflows.

- **Create Clothing Request**: **Implemented in the direct request flow.**
    - **Feature**: A multi-step form where clients can specify their budget, deadline, fabric status, and measurements.
    - **Implemented enhancements**:
        1. **Voice Notes**: Record audio instructions and pass the uploaded `voice_note_url`.
        2. **Inspiration Gallery**: Upload multiple design images as `design_image_urls`.
        3. **Service Type Toggle**: Select `online` or `physical_visit` service.
    - **API**: `POST /api/v1/orders/requests`
- **Public Job Board (For Tailors)**:
    - **Feature**: A feed for tailors to browse all open marketplace requests and find jobs.
    - **API**: `GET /api/v1/orders/requests/open`

## 4. Bidding & Order Negotiation

The interactive negotiation phase between clients and tailors.

- **Tailor Bidding System**:
    - **Feature**: A UI for tailors to view a request and submit a competitive quote (price + message).
    - **API**: `POST /api/v1/orders/bids`
- **Direct Shop Messaging (Bid-less Orders)**:
    - **Feature**: The backend allows clients to target a specific shop. You can build a chat UI, agree on a price, and jump straight to creating the order without a formal "Bid" button.
- **Accepting a Quote**:
    - **Feature**: A button for the client to accept a tailor's bid (or agreed price) which locks it in as an official Order.
    - **API**: `POST /api/v1/orders/accept-bid`

## 5. Active Orders & Payments

Managing work-in-progress and financial transactions.

- **Order Tracking Dashboards**:
    - **Feature**: List views for both clients and tailors to see "In Progress" and "Completed" orders.
    - **APIs**: `GET /api/v1/orders/client/{id}`, `GET /api/v1/orders/shop/{id}`
- **Order Status Updates**:
    - **Feature**: Buttons for the tailor to mark an order as `completed`.
    - **API**: `PATCH /api/v1/orders/{id}/status`
- **Checkout / Mock Payments**:
    - **Feature**: A checkout screen for the client to pay for the order using the mock payment simulator.
    - **API**: `POST /api/v1/orders/payments/mock`

## 6. Reputation & Engagement

Features to keep users coming back and trusting the platform.

- **Review & Rating System**:
    - **Feature**: A prompt for clients to leave a 1-5 star review after an order is marked complete. This automatically recalculates the shop's average rating.
    - **API**: `POST /api/v1/orders/ratings`
- **Bookmarking / Favorites**:
    - **Feature**: A "Heart" icon on shop profiles allowing clients to save their favorite tailors for quick access later.
    - **APIs**: `POST /api/v1/support/favorites`, `GET /api/v1/support/favorites/{client_id}`
- **In-App Notifications**:
    - **Feature**: A notification bell with a dropdown showing system alerts (e.g., "You received a new bid!").
    - **APIs**: `GET /api/v1/support/notifications/{uid}`, `PATCH /api/v1/support/notifications/{id}/read`
