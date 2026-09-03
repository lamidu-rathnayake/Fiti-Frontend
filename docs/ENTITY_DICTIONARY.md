# Fiti Entity Dictionary

This document outlines the core entities and their required attributes for the Fiti Backend Application based on the database schema. It groups entities into their respective domains.

The frontend receives these entities through the `/api/v1` backend and uses Firebase UID values to associate authenticated users with PostgreSQL profiles. Registration and onboarding create the Firebase identity first, then create the role-specific profile through the API.

---

## 1. Profile & Identity Domain

### Firebase Authentication (Identity — Off-Database)

_Note: Firebase Authentication is the sole identity provider. It manages credentials, sessions, and identity claims. The PostgreSQL database references users by their Firebase UID (`uid`) as a foreign key but never stores passwords or authentication tokens._

- **`uid`** _(Primary Identifier)_: String — maps to `id` in all Postgres role tables
- **`email`**: String
- **`email_verified`**: Boolean
- **`display_name`**: String (Full name, stored on the Firebase Auth record via `updateProfile`)
- **`phone_number`**: String (Firebase Auth record field, optional)
- **`photo_url`**: String (Profile picture URL, e.g. Cloudinary)
- **`disabled`**: Boolean (Account status)
- **`provider_data`**: Array (Linked providers e.g. Google, Email/Password)

> **No Firestore collection is used.** All business and profile data (phone, city, address, role, etc.) is stored exclusively in Supabase PostgreSQL via the backend API.

---

### Client

Represents a customer using the platform to find tailors and order custom clothing.

- **`id`** _(Primary Key)_: String (Matches Firebase Auth UID)
- **`display_name`**: String
- **`email`**: String
- **`photo_url`**: String
- **`phone`**: String (nullable — contact/WhatsApp number)
- **`city`**: String (nullable)
- **`address`**: String (nullable — street address)
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Tailor

Represents a tailor providing services on the platform. Created on the backend at `POST /api/v1/profiles/tailor`.

- **`id`** _(Primary Key)_: String (Firebase Auth UID)
- **`display_name`**: String
- **`email`**: String
- **`photo_url`**: String
- **`phone`**: String (nullable — contact/WhatsApp number)
- **`city`**: String (nullable)
- **`address`**: String (nullable — street address)
- **`nic_front`**: String (nullable — Cloud storage URL for ID verification)
- **`nic_rear`**: String (nullable — Cloud storage URL for ID verification)
- **`is_verified`**: Boolean
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Measurement Profile

Stores the base measurements for a client.

- **`measurement_id`** _(Primary Key)_: Integer
- **`client_id`** _(Foreign Key)_: String (Ref: Client.id)
- **`chest`**: Numeric
- **`waist`**: Numeric
- **`shoulder`**: Numeric
- **`sleeve`**: Numeric
- **`neck`**: Numeric
- **`hip`**: Numeric
- **`inseam`**: Numeric
- **`length`**: Numeric
- **`notes`**: Text
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

---

## 2. Role-Based Access Control (RBAC) Domain

### Role

- **`id`** _(Primary Key)_: Integer
- **`name`**: String (e.g., 'client', 'tailor', 'admin')

### User Role

Mapping of users to their roles.

- **`firebase_uid`** _(Composite PK)_: String
- **`role_id`** _(Composite PK, Foreign Key)_: Integer (Ref: Role.id)

---

## 3. Shop & Tailor Domain

### Shop

Represents a tailor's business profile.

- **`shop_id`** _(Primary Key)_: Integer
- **`tailor_id`** _(Foreign Key)_: String (Ref: Tailor.id)
- **`shop_name`**: String
- **`specialty`**: String (e.g. "Bridal wear", "Alterations")
- **`shop_bio`**: Text
- **`shop_address`**: String
- **`city`**: String
- **`contact_number`**: String
- **`registration_number`**: String
- **`latitude`**: Numeric
- **`longitude`**: Numeric
- **`average_rating`**: Numeric
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Shop Image

- **`image_id`** _(Primary Key)_: Integer
- **`shop_id`** _(Foreign Key)_: Integer (Ref: Shop.shop_id)
- **`image_url`**: String (Cloud storage URL)
- **`created_at`**: Timestamp

---

## 4. Order Flow & Marketplace Domain

### Clothing Request

A client's request for custom clothing.

- **`request_id`** _(Primary Key)_: Integer
- **`client_id`** _(Foreign Key)_: String (Ref: Client.id)
- **`target_date`**: Date
- **`target_budget`**: Numeric
- **`clothing_category`**: String
- **`gender`**: Enum ('male', 'female', 'other')
- **`fabric_status`**: Enum ('client_provided', 'shop_provides')
- **`description`**: Text
- **`voice_note_url`**: String (Cloud storage URL)
- **`service_type`**: Enum ('online', 'physical_visit')
- **`request_location`**: String
- **`status`**: Enum ('open', 'in_progress', 'completed', 'cancelled')
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Clothing Request Image

Inspiration images for a request.

- **`image_id`** _(Primary Key)_: Integer
- **`request_id`** _(Foreign Key)_: Integer (Ref: Clothing Request.request_id)
- **`image_url`**: String (Cloud storage URL)
- **`created_at`**: Timestamp

### Measurement (Order Specific)

Measurements associated with a specific request.

- **`measurement_id`** _(Primary Key)_: Integer
- **`request_id`** _(Foreign Key)_: Integer (Ref: Clothing Request.request_id)
- **`chest`**: Numeric
- **`waist`**: Numeric
- **`shoulder`**: Numeric
- **`sleeve`**: Numeric
- **`neck`**: Numeric
- **`hip`**: Numeric
- **`inseam`**: Numeric
- **`length`**: Numeric
- **`notes`**: Text
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Shop Request

Tracks which shops received a request and their response status.

- **`shop_request_id`** _(Primary Key)_: Integer
- **`request_id`** _(Foreign Key)_: Integer (Ref: Clothing Request.request_id)
- **`shop_id`** _(Foreign Key)_: Integer (Ref: Shop.shop_id)
- **`offered_price`**: Numeric
- **`status`**: Enum ('pending', 'quoted', 'accepted', 'rejected', 'withdrawn')
- **`response_date`**: Timestamp
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Bid

A specific price offer and message from a shop for a request.

- **`bid_id`** _(Primary Key)_: Integer
- **`shop_request_id`** _(Foreign Key)_: Integer (Ref: Shop Request.shop_request_id)
- **`bid_amount`**: Numeric
- **`message`**: Text
- **`created_at`**: Timestamp

### Order

An accepted bid that becomes a confirmed order.

- **`order_id`** _(Primary Key)_: Integer
- **`shop_request_id`** _(Foreign Key)_: Integer (Ref: Shop Request.shop_request_id)
- **`order_status`**: Enum ('in_progress', 'completed', 'cancelled')
- **`accepted_price`**: Numeric
- **`started_date`**: Date
- **`completed_date`**: Date
- **`created_at`**: Timestamp
- **`updated_at`**: Timestamp

### Payment

Payment records for orders.

- **`payment_id`** _(Primary Key)_: Integer
- **`order_id`** _(Foreign Key)_: Integer (Ref: Order.order_id)
- **`amount`**: Numeric
- **`payment_method`**: Enum ('cash', 'card', 'bank_transfer', 'mobile_wallet')
- **`payment_status`**: Enum ('pending', 'paid', 'failed', 'refunded')
- **`payment_date`**: Timestamp
- **`created_at`**: Timestamp

### Rating

Reviews left by clients for completed orders.

- **`rating_id`** _(Primary Key)_: Integer
- **`order_id`** _(Foreign Key)_: Integer (Ref: Order.order_id)
- **`client_id`** _(Foreign Key)_: String (Ref: Client.id)
- **`shop_id`** _(Foreign Key)_: Integer (Ref: Shop.shop_id)
- **`rating`**: Small Integer (1-5)
- **`review`**: Text
- **`created_at`**: Timestamp

---

## 5. Support & Engagement Domain

### Favorite Shop

Client's bookmarked shops.

- **`favorite_id`** _(Primary Key)_: Integer
- **`client_id`** _(Foreign Key)_: String (Ref: Client.id)
- **`shop_id`** _(Foreign Key)_: Integer (Ref: Shop.shop_id)
- **`created_at`**: Timestamp

### Notification

Alerts sent to users.

- **`notification_id`** _(Primary Key)_: Integer
- **`firebase_uid`**: String
- **`title`**: String
- **`message`**: Text
- **`is_read`**: Boolean
- **`created_at`**: Timestamp
