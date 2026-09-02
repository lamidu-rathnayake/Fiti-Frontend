/**
 * lib/api/types/order.ts
 *
 * Type definitions for the Orders & Requests resource.
 * Backend reference: /api/v1/orders/*
 *
 * Field names are kept identical to the backend Pydantic schemas
 * to avoid silent mapping bugs.
 */

// ── Clothing Requests (Client-side) ───────────────────────────────────

export type FabricStatus = "client_provided" | "shop_provides";
export type ServiceType = "online" | "physical_visit";
export type ClothingRequestType = "direct" | "bidding";
export type Gender = "male" | "female" | "unisex";
export type ClothingRequestStatus = "open" | "in_progress" | "completed" | "cancelled";
export type OrderStatus = "in_progress" | "completed" | "cancelled";
export type ShopRequestStatus = "pending" | "quoted" | "accepted" | "rejected" | "withdrawn";

/**
 * Request body for POST /api/v1/orders/requests
 */
export interface ClothingRequestPayload {
    client_id: string;
    service_type?: ServiceType;
    request_type?: ClothingRequestType;
    target_date?: string | null;
    target_budget?: number | null;
    clothing_category?: string | null;
    gender?: Gender | null;
    fabric_status?: FabricStatus | null;
    description?: string | null;
    voice_note_url?: string | null;
    request_location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    radius_km?: number;
    design_image_urls?: string[];
    target_shop_ids?: number[];
    measurement?: {
        chest?: number | null;
        waist?: number | null;
        shoulder?: number | null;
        sleeve?: number | null;
        neck?: number | null;
        hip?: number | null;
        inseam?: number | null;
        length?: number | null;
        notes?: string | null;
    } | null;
}

/** A clothing request object returned from GET endpoints */
export interface ClothingRequest {
    request_id: number;
    client_id: string;
    service_type: ServiceType;
    request_type: ClothingRequestType;
    target_date: string | null;
    target_budget: number | null;
    clothing_category: string | null;
    gender: Gender | null;
    fabric_status: FabricStatus | null;
    description: string | null;
    voice_note_url: string | null;
    request_location: string | null;
    design_images?: { image_url: string }[];
    /** Backend field name: status (ClothingRequestStatusEnum) */
    status: ClothingRequestStatus;
    created_at: string;
    updated_at?: string | null;
    /** Nested bids if any */
    bids?: ShopRequestBid[];
    shop_requests?: ShopRequest[];
    /** Client details if returned by backend */
    client?: {
        display_name?: string;
        phone?: string;
        city?: string;
    } | null;
    /** Measurements if returned by backend */
    measurement?: {
        chest?: number | null;
        waist?: number | null;
        shoulder?: number | null;
        sleeve?: number | null;
        neck?: number | null;
        hip?: number | null;
        inseam?: number | null;
        length?: number | null;
        notes?: string | null;
    } | null;
}

/** Nested bid inside a clothing request response */
export interface ShopRequestBid {
    bid_id: number | null;
    shop_request_id: number;
    bid_amount: number;
    message: string | null;
    created_at: string | null;
}

/** Nested shop request inside a clothing request response */
export interface ShopRequest {
    shop_request_id: number;
    request_id: number;
    shop_id: number;
    offered_price: number | null;
    status: ShopRequestStatus;
    clothing_request?: ClothingRequest;
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

/**
 * Order object returned from backend.
 * NOTE: Backend uses `order_status` (not `status`) for the order state.
 */
export interface Order {
    order_id: number;
    shop_request_id: number;
    /** Backend field name: order_status */
    order_status: OrderStatus;
    accepted_price: number;
    started_date: string | null;
    completed_date: string | null;
    clothing_request?: ClothingRequest;
    created_at: string;
}

export type PaymentMethod = "card" | "cash" | "bank_transfer";
export type PaymentStatusType = "pending" | "paid" | "failed";

/**
 * Payment object returned from backend.
 * NOTE: Backend uses `payment_status` (not `status`).
 */
export interface Payment {
    payment_id: number;
    order_id: number;
    amount: number;
    payment_method: PaymentMethod | null;
    /** Backend field name: payment_status */
    payment_status: PaymentStatusType;
    payment_date: string | null;
}

/** Request body for POST /api/v1/orders/ratings */
export interface RatingPayload {
    order_id: number;
    client_id: string;
    shop_id: number;
    rating: number;          // 1–5
    review?: string | null;
}

export interface Rating {
    rating_id: number;
    order_id: number;
    client_id: string;
    shop_id: number;
    rating: number;
    review: string | null;
    created_at: string;
}
