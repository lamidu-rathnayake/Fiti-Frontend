/**
 * lib/api/endpoints/shops.ts
 *
 * API functions for the Shops resource.
 * Backend reference: /api/v1/shops/*
 */

import { apiFetch } from "@/lib/api/client";
import type {
    Shop,
    ShopPayload,
    ShopWork,
    ShopWorkPayload,
    NearbyShopsParams,
    Gig,
    GigPayload,
} from "@/lib/api/types/shop";

/**
 * List all shops (public, with optional pagination & city filter).
 * GET /api/v1/shops/
 * (Auth: Public)
 */
export async function listShops(): Promise<Shop[]> {
    return apiFetch<Shop[]>("/shops/", { authenticated: false });
}

/**
 * Discover shops within a GPS radius.
 * GET /api/v1/shops/nearby?lat=&lng=&radius_km=
 * (Auth: Public)
 */
export async function listNearbyShops(
    params: NearbyShopsParams,
): Promise<Shop[]> {
    const query = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        ...(params.radius_km !== undefined && {
            radius_km: String(params.radius_km),
        }),
    });
    return apiFetch<Shop[]>(`/shops/nearby?${query}`, { authenticated: false });
}

/**
 * List all shops owned by a specific tailor.
 * GET /api/v1/shops/tailor/{tailor_id}
 * (Auth: Public)
 */
export async function listTailorShops(tailorId: string): Promise<Shop[]> {
    return apiFetch<Shop[]>(`/shops/tailor/${tailorId}`, {
        authenticated: false,
    });
}

/**
 * Get details of a specific shop.
 * GET /api/v1/shops/{shop_id}
 * (Auth: Public)
 */
export async function getShop(shopId: number): Promise<Shop> {
    return apiFetch<Shop>(`/shops/${shopId}`, { authenticated: false });
}

/**
 * Register a new tailor shop.
 * POST /api/v1/shops/
 * (Auth: Tailor Role)
 */
export async function createShop(payload: ShopPayload): Promise<Shop> {
    return apiFetch<Shop>("/shops/", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Update an existing shop.
 * PUT /api/v1/shops/{shop_id}
 * (Auth: Tailor Role)
 */
export async function updateShop(
    shopId: number,
    payload: Partial<ShopPayload>,
): Promise<Shop> {
    return apiFetch<Shop>(`/shops/${shopId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a shop.
 * DELETE /api/v1/shops/{shop_id}
 * (Auth: Tailor Role)
 */
export async function deleteShop(shopId: number): Promise<void> {
    return apiFetch<void>(`/shops/${shopId}`, { method: "DELETE" });
}

/**
 * Add a portfolio/shop work URL with optional description.
 * POST /api/v1/shops/{shop_id}/works
 * (Auth: Tailor Role)
 */
export async function addShopWork(
    shopId: number,
    payload: ShopWorkPayload,
): Promise<ShopWork> {
    return apiFetch<ShopWork>(`/shops/${shopId}/works`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a portfolio/shop work piece.
 * DELETE /api/v1/shops/{shop_id}/works/{work_id}
 * (Auth: Tailor Role)
 */
export async function deleteShopWork(
    shopId: number,
    workId: number,
): Promise<void> {
    return apiFetch<void>(`/shops/${shopId}/works/${workId}`, {
        method: "DELETE",
    });
}

export async function createGig(
    shopId: number,
    payload: GigPayload,
): Promise<Gig> {
    return apiFetch<Gig>(`/shops/${shopId}/gigs`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function deleteGig(gigId: number): Promise<void> {
    return apiFetch<void>(`/shops/gigs/${gigId}`, { method: "DELETE" });
}
