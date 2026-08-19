/**
 * lib/api/types/order.ts
 *
 * Type definitions for the Orders & Requests resource.
 * Backend reference: /api/v1/orders/*
 */

// ── Clothing Requests (Client-side) ───────────────────────────────────

export type FabricStatus = "client_provided" | "tailor_provided";
export type ServiceType = "online" | "physical_visit";
export type Gender = "male" | "female" | "unisex";
export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

/**
 * Request body for POST /api/v1/orders/requests
 * `client_id` and `service_type` (defaults to "online") are the only fields 
 * with implicit defaults. All others are optional.
 */
export interface ClothingRequestPayload {
    client_id: string;
    service_type?: ServiceType;
    target_date?: string | null;
    target_budget?: number | null;
    clothing_category?: string | null;
    gender?: Gender | null;
    fabric_status?: FabricStatus | null;
    description?: string | null;
    voice_note_url?: string | null;
    request_location?: string | null;
    design_image_urls?: string[];
    target_shop_ids?: number[];
}

/** A clothing request object returned from GET endpoints */
export interface ClothingRequest {
    request_id: number;
    client_id: string;
    service_type: ServiceType;
    target_date: string | null;
    target_budget: number | null;
    clothing_category: string | null;
    gender: Gender | null;
    fabric_status: FabricStatus | null;
    description: string | null;
    voice_note_url: string | null;
    request_location: string | null;
    design_image_urls: string[];
    status: OrderStatus;
    created_at: string;
}

// ── Bids (Tailor-side) ────────────────────────────────────────────────

/** Request body for POST /api/v1/orders/bids */
export interface BidPayload {
    shop_request_id: number;
    bid_amount: number;
    message?: string | null;
}

export type BidStatus = "pending" | "accepted" | "rejected";

export interface Bid {
    bid_id: number;
    shop_request_id: number;
    bid_amount: number;
    message: string | null;
    status: BidStatus;
    created_at: string;
}

// ── Orders & Payments ─────────────────────────────────────────────────

/** Request body for POST /api/v1/orders/accept-bid */
export interface AcceptBidPayload {
    shop_request_id: number;
    accepted_price: number;
}

export interface Order {
    order_id: number;
    shop_request_id: number;
    accepted_price: number;
    status: OrderStatus;
    created_at: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface Payment {
    payment_id: number;
    order_id: number;
    amount: number;
    status: PaymentStatus;
    created_at: string;
}

/** Request body for POST /api/v1/orders/ratings */
export interface RatingPayload {
    order_id: number;
    shop_id: number;
    rating: number;          // 1–5
    review?: string | null;
}

export interface Rating {
    rating_id: number;
    order_id: number;
    shop_id: number;
    rating: number;
    review: string | null;
    created_at: string;
}
