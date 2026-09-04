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
    specialty?: string | null;
    shop_bio?: string | null;
    shop_address?: string | null;
    city?: string | null;
    contact_number?: string | null;
    registration_number?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface Gig {
    gig_id: number;
    shop_id: number;
    title: string;
    description: string;
    price: number;
    delivery_time: string | null;
    category: string | null;
    image_url: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface GigPayload {
    title: string;
    description: string;
    price: number;
    delivery_time?: string | null;
    category?: string | null;
    image_url?: string | null;
}

/** A shop object returned from GET /api/v1/shops/* */
export interface Shop {
    shop_id: number;
    tailor_id: string; // NOTE: was incorrectly `seller_id` in the old lib/api.ts
    shop_name: string;
    specialty: string | null;
    shop_bio: string | null;
    shop_address: string | null;
    city: string | null;
    contact_number: string | null;
    registration_number: string | null;
    latitude: number | null;
    longitude: number | null;
    average_rating: number;
    images: ShopImage[];
    gigs: Gig[];
    created_at: string | null;
    updated_at: string | null;
}

/** Request body for POST /api/v1/shops/{shop_id}/images */
export interface ShopImagePayload {
    image_url: string;
    description?: string;
}

/** A shop image object */
export interface ShopImage {
    image_id: number | null;
    shop_id: number;
    image_url: string;
    description?: string;
}

/**
 * Utility to parse raw shop image URL string into clean image URL and description.
 * Supports #desc= encoded text fragments in image_url string.
 */
export function parseShopImage(image: ShopImage | string): {
    imageUrl: string;
    description: string;
} {
    const rawString = typeof image === "string" ? image : image.image_url;
    if (!rawString) return { imageUrl: "", description: "" };

    const hashIndex = rawString.indexOf("#desc=");
    if (hashIndex !== -1) {
        const rawUrl = rawString.substring(0, hashIndex);
        const encodedDesc = rawString.substring(hashIndex + 6);
        try {
            return {
                imageUrl: rawUrl,
                description: decodeURIComponent(encodedDesc),
            };
        } catch {
            return { imageUrl: rawUrl, description: encodedDesc };
        }
    }

    const queryIndex = rawString.indexOf("?desc=");
    if (queryIndex !== -1) {
        const rawUrl = rawString.substring(0, queryIndex);
        const encodedDesc = rawString.substring(queryIndex + 6);
        try {
            return {
                imageUrl: rawUrl,
                description: decodeURIComponent(encodedDesc),
            };
        } catch {
            return { imageUrl: rawUrl, description: encodedDesc };
        }
    }

    const directDesc = typeof image === "object" ? image.description : "";
    return { imageUrl: rawString, description: directDesc || "" };
}

/**
 * Utility to format image URL with embedded description tag for shop portfolio.
 */
export function formatShopImageUrl(
    rawUrl: string,
    description?: string,
): string {
    if (!description || !description.trim()) return rawUrl;
    return `${rawUrl}#desc=${encodeURIComponent(description.trim())}`;
}

/** Query params for GET /api/v1/shops/nearby */
export interface NearbyShopsParams {
    lat: number;
    lng: number;
    radius_km?: number;
}
