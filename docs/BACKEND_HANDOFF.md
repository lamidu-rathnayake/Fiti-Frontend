# Frontend-to-Backend Sync Handoff

> **To the Backend Agent:** Please review this document to ensure your API routers, Python models (Pydantic/SQLAlchemy), and PostgreSQL database schema exactly match what the Fiti Frontend is currently sending and expecting to receive.

---

## 1. Authentication & Identity
- **Auth Strategy:** The frontend sends a Firebase JWT in the `Authorization: Bearer <token>` header for all authenticated requests.
- **UID Extraction:** The backend must extract the user's `uid` directly from the validated Bearer token. Do NOT expect the `uid` to be passed inside the JSON body of POST/PUT requests (unless explicitly noted).

---

## 2. The Complete Registration Workflow (For Backend Context)
To help you understand the architectural separation of concerns, here is the exact sequence of events when a user registers on the frontend:

1. **Firebase Auth:** The frontend creates the user via `createUserWithEmailAndPassword(auth, email, password)`.
2. **Firebase Profile:** The frontend calls `updateProfile` to attach the `full_name` and `profile_image_url` to the underlying Firebase Auth token.
3. **Backend Sync (Your Domain):** The frontend calls your backend (`POST /api/v1/profiles/...`) to sync the business and profile data to PostgreSQL. **This is where your API takes over.**
4. **Firestore Cache:** Finally, the frontend writes a localized cache document to Firestore (`db, "users"`) containing *only* identity fields (`uid, email, full_name, profile_image_url, role, createdAt`). This is strictly used by the frontend for instant UI loading (e.g., Navbar avatars) to avoid N+1 queries.

**TL;DR for Backend:** You do not need to worry about Firestore. Your PostgreSQL database is the strict source of truth for all business logic, relationships, and queries.

---

## 3. Clients (`/api/v1/profiles/client`)

### Database Schema Expectations (`clients` table)
Ensure the PostgreSQL table has the following columns:
- `uid` (Primary Key, matches Firebase UID)
- `full_name` (string, nullable)
- `email` (string, nullable)
- `profile_image_url` (string, nullable)
- `phone` (string, nullable)
- `city` (string, nullable)
- `address` (string, nullable)
- `latitude` (float/decimal, nullable)
- `longitude` (float/decimal, nullable)

### A. Create Client Profile (`POST /api/v1/profiles/client`)
**Frontend Payload (JSON body):**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "profile_image_url": "https://...",
  "phone": "+94 77 123 4567",
  "city": "Colombo",
  "address": "45 Temple St",
  "latitude": 6.9271,
  "longitude": 79.8612
}
```
*(All fields except the Bearer token are technically optional from the frontend's perspective, though the UI requires most of them).*

### B. Get Client Profile (`GET /api/v1/profiles/client/{id}`)
**Expected Backend Response:**
```json
{
  "uid": "abc123xyz",
  "full_name": "John Doe",
  "email": "john@example.com",
  "profile_image_url": "https://...",
  "created_at": "2024-03-24T12:00:00Z"
}
```

---

## 4. Tailors (`/api/v1/profiles/tailor`)

### Database Schema Expectations (`tailors` table)
Ensure the PostgreSQL table has the following columns:
- `uid` (Primary Key, matches Firebase UID)
- `full_name` (string, nullable)
- `email` (string, nullable)
- `profile_image_url` (string, nullable)
- `phone` (string, nullable)
- `city` (string, nullable)
- `address` (string, nullable)
- `latitude` (float/decimal, nullable)
- `longitude` (float/decimal, nullable)
- `specialty` (string, nullable)
- `nic_front` (string, nullable)
- `nic_rear` (string, nullable)
- `is_verified` (boolean, default: false)

### A. Create Tailor Profile (`POST /api/v1/profiles/tailor`)
**Frontend Payload (JSON body):**
```json
{
  "full_name": "Jane Tailor",
  "email": "jane@example.com",
  "profile_image_url": "https://...",
  "phone": "+94 77 987 6543",
  "city": "Colombo",
  "address": "123 Main St",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "specialty": "Bridal wear",
  "nic_front": "https://...",
  "nic_rear": "https://..."
}
```

### B. Get Tailor Profile (`GET /api/v1/profiles/tailor/{id}`)
**Expected Backend Response:**
```json
{
  "uid": "xyz987abc",
  "full_name": "Jane Tailor",
  "email": "jane@example.com",
  "profile_image_url": "https://...",
  "specialty": "Bridal wear",
  "is_verified": false,
  "created_at": "2024-03-24T12:00:00Z"
}
```

---

## 5. Shops (`/api/v1/shops/`)

### Database Schema Expectations (`shops` table)
- `shop_id` (Primary Key, auto-incrementing integer)
- `tailor_id` (Foreign Key referencing `tailors.uid`)
- `shop_name` (string, required)
- `shop_bio` (string, nullable)
- `shop_address` (string, nullable)
- `city` (string, nullable)
- `contact_number` (string, nullable)
- `registration_number` (string, nullable)
- `latitude` (float/decimal, nullable)
- `longitude` (float/decimal, nullable)
- `profile_picture_url` (string, nullable)

### A. Create Shop (`POST /api/v1/shops/`)
*Unlike profiles, this endpoint currently receives the `tailor_id` in the body.*

**Frontend Payload (JSON body):**
```json
{
  "tailor_id": "xyz987abc",
  "shop_name": "Jane's Alterations",
  "shop_bio": "Expert in bridal and custom fits.",
  "shop_address": "123 Main St",
  "city": "Colombo",
  "contact_number": "+94 77 987 6543",
  "registration_number": "BR-123456",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "profile_picture_url": "https://..."
}
```

---

## Final Checklist for Backend Agent:
- [ ] Are Pydantic models configured with `full_name` and `profile_image_url`?
- [ ] Do the SQLAlchemy models map `full_name` and `profile_image_url` correctly?
- [ ] Does the `POST /api/v1/profiles/client` route accept `latitude` and `longitude`?
- [ ] Does the `POST /api/v1/shops/` route accept `shop_bio`, `registration_number`, `latitude`, and `longitude`?
- [ ] Do the GET routes return the `full_name` and `profile_image_url` exactly as requested?
