/**
 * lib/api/types/shop.ts
 *
 * Type definitions for the Shops resource.
 * Backend reference: /api/v1/shops/*
 */

/**
 * Request body for POST /api/v1/shops/ and PUT /api/v1/shops/{shop_id}.
 * `tailor_id` and `shop_name` are required for POST; all fields are optional for PUT.
 */
export interface ShopPayload {
    tailor_id: string;
    shop_name: string;
    shop_bio?: string | null;
    shop_address?: string | null;
    city?: string | null;
    contact_number?: string | null;
    registration_number?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    profile_picture_url?: string | null;
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
    profile_picture_url: string | null;
    average_rating: number | null;
    created_at: string;
}

/** Request body for POST /api/v1/shops/{shop_id}/images */
export interface ShopImagePayload {
    image_url: string;
}

/** A shop image object */
export interface ShopImage {
    id: number;
    shop_id: number;
    image_url: string;
    created_at: string;
}

/** Query params for GET /api/v1/shops/nearby */
export interface NearbyShopsParams {
    lat: number;
    lng: number;
    radius_km?: number;
}
