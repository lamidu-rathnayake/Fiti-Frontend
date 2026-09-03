/**
 * lib/api/endpoints/orders.ts
 *
 * API functions for the Orders & Requests resource.
 * Backend reference: /api/v1/orders/*
 */

import { apiFetch } from "@/lib/api/client";
import type {
    ClothingRequest,
    ClothingRequestPayload,
    Bid,
    BidPayload,
    Order,
    AcceptBidPayload,
    Payment,
    RatingPayload,
    Rating,
    ShopRequest,
} from "@/lib/api/types/order";

// ── Clothing Requests (Client-side) ───────────────────────────────────

/**
 * Submit a new clothing request (marketplace broadcast).
 * POST /api/v1/orders/requests
 * (Auth: Client Role)
 */
export async function createClothingRequest(
    payload: ClothingRequestPayload,
): Promise<ClothingRequest> {
    return apiFetch<ClothingRequest>("/orders/requests", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * View all open marketplace requests.
 * GET /api/v1/orders/requests/open
 * (Auth: Public)
 */
export async function listOpenRequests(): Promise<ClothingRequest[]> {
    return apiFetch<ClothingRequest[]>("/orders/requests/open", {
        authenticated: false,
    });
}

/**
 * View all requests made by a specific client.
 * GET /api/v1/orders/requests/client/{id}
 * (Auth: Public)
 */
export async function listClientRequests(
    clientId: string,
): Promise<ClothingRequest[]> {
    return apiFetch<ClothingRequest[]>(`/orders/requests/client/${clientId}`);
}

/**
 * Get details of a specific clothing request.
 * GET /api/v1/orders/requests/{id}
 * (Auth: Public)
 */
export async function getClothingRequest(
    requestId: number,
): Promise<ClothingRequest> {
    return apiFetch<ClothingRequest>(`/orders/requests/${requestId}`, {
        authenticated: false,
    });
}

/**
 * Cancel an open request before a bid is accepted.
 * PATCH /api/v1/orders/requests/{id}/cancel
 * (Auth: Client Role)
 */
export async function cancelRequest(
    requestId: number,
): Promise<ClothingRequest> {
    return apiFetch<ClothingRequest>(`/orders/requests/${requestId}/cancel`, {
        method: "PATCH",
    });
}

// ── Bids & Shop Requests (Tailor-side) ───────────────────────────────

/**
 * View all requests assigned to a specific shop.
 * GET /api/v1/orders/shop-requests/shop/{id}
 * (Auth: Public)
 */
export async function listShopRequests(shopId: number): Promise<ShopRequest[]> {
    return apiFetch<ShopRequest[]>(`/orders/shop-requests/shop/${shopId}`);
}

/**
 * List all bids on a shop request.
 * GET /api/v1/orders/shop-requests/{id}/bids
 * (Auth: Tailor Role)
 */
export async function listBidsOnRequest(shopRequestId: number): Promise<Bid[]> {
    return apiFetch<Bid[]>(`/orders/shop-requests/${shopRequestId}/bids`);
}

/**
 * Submit a bid (price & message) on a client's request.
 * POST /api/v1/orders/bids
 * (Auth: Tailor Role)
 */
export async function submitBid(payload: BidPayload): Promise<Bid> {
    return apiFetch<Bid>("/orders/bids", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

// ── Orders & Payments ─────────────────────────────────────────────────

/**
 * Accept a bid (or direct price) and create an Order.
 * Works for both bid-based and direct (bid-less) orders via shop_request_id.
 * POST /api/v1/orders/accept-bid
 * (Auth: Client Role)
 */
export async function acceptBid(payload: AcceptBidPayload): Promise<Order> {
    return apiFetch<Order>("/orders/accept-bid", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Reject a shop request quote.
 * PATCH /api/v1/orders/shop-requests/{id}/reject
 * (Auth: Client Role)
 */
export async function rejectQuote(shopRequestId: number): Promise<ShopRequest> {
    return apiFetch<ShopRequest>(
        `/orders/shop-requests/${shopRequestId}/reject`,
        {
            method: "PATCH",
        },
    );
}

/**
 * List all orders for a shop.
 * GET /api/v1/orders/shop/{shop_id}
 * (Auth: Public)
 */
export async function listShopOrders(shopId: number): Promise<Order[]> {
    return apiFetch<Order[]>(`/orders/shop/${shopId}`);
}

/**
 * List all orders for a client.
 * GET /api/v1/orders/client/{client_id}
 * (Auth: Public)
 */
export async function listClientOrders(clientId: string): Promise<Order[]> {
    return apiFetch<Order[]>(`/orders/client/${clientId}`);
}

/**
 * Get specific order details.
 * GET /api/v1/orders/{order_id}
 * (Auth: Valid Token)
 */
export async function getOrder(orderId: number): Promise<Order> {
    return apiFetch<Order>(`/orders/${orderId}`);
}

/**
 * Update order status.
 * PATCH /api/v1/orders/{order_id}/status?order_status={status}
 * NOTE: FastAPI reads `order_status` as a query param, NOT a request body.
 * (Auth: Valid Token)
 */
export async function updateOrderStatus(
    orderId: number,
    status: "in_progress" | "completed" | "cancelled",
): Promise<Order> {
    return apiFetch<Order>(`/orders/${orderId}/status?order_status=${status}`, {
        method: "PATCH",
    });
}

/**
 * Get payment status of an order.
 * GET /api/v1/orders/{order_id}/payment
 * (Auth: Valid Token)
 */
export async function getOrderPayment(orderId: number): Promise<Payment> {
    return apiFetch<Payment>(`/orders/${orderId}/payment`);
}

/**
 * Process a mock simulated payment.
 * POST /api/v1/orders/payments/mock
 * (Auth: Client Role)
 */
export async function processMockPayment(orderId: number): Promise<Payment> {
    return apiFetch<Payment>("/orders/payments/mock", {
        method: "POST",
        body: JSON.stringify({ order_id: orderId }),
    });
}

/**
 * Rate and review a shop upon order completion.
 * POST /api/v1/orders/ratings
 * (Auth: Client Role)
 */
export async function submitRating(payload: RatingPayload): Promise<Rating> {
    return apiFetch<Rating>("/orders/ratings", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
