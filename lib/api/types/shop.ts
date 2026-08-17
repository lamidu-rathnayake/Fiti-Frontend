/**
 * lib/api/types/shop.ts
 *
 * Type definitions for the Shops resource.
 * Backend reference: /api/v1/shops/*
 */

/**
 * Request body for POST /api/v1/shops/ and PUT /api/v1/shops/{shop_id}.
 * Ownership comes from the authenticated Firebase user. `shop_name` is required for POST.
 */
export interface ShopPayload {
    shop_name: string;
    shop_bio?: string | null;
    shop_address?: string | null;
    city?: string | null;
    contact_number?: string | null;
    registration_number?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

/** A shop object returned from GET /api/v1/shops/* */
export interface Shop {
    shop_id: number;
    tailor_id: string;        // NOTE: was incorrectly `seller_id` in the old lib/api.ts
    shop_name: string;
    shop_bio: string | null;
    shop_address: string | null;
    city: string | null;
    contact_number: string | null;
    registration_number: string | null;
    latitude: number | null;
    longitude: number | null;
    average_rating: number;
    images: ShopImage[];
    created_at: string | null;
    updated_at: string | null;
}

/** Request body for POST /api/v1/shops/{shop_id}/images */
export interface ShopImagePayload {
    image_url: string;
}

/** A shop image object */
export interface ShopImage {
    image_id: number | null;
    shop_id: number;
    image_url: string;
}

/** Query params for GET /api/v1/shops/nearby */
export interface NearbyShopsParams {
    lat: number;
    lng: number;
    radius_km?: number;
}
