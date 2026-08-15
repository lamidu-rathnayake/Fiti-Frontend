const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Generic request wrapper
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorDetail = "API Request Failed";
        try {
            const errJson = await res.json();
            errorDetail = errJson.detail || JSON.stringify(errJson);
        } catch {}
        throw new Error(errorDetail);
    }

    if (res.status === 204) return {} as T; // no content back
    return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────
export interface Profile {
    id: string;
    created_at: string;
    type: "client" | "tailor";
}

export interface Shop {
    shop_id: number;
    seller_id: string;
    shop_name: string;
    city: string;
    average_rating: number;
}

export interface ClothingRequest {
    request_id: number;
    client_id: string;
    clothing_category: string;
    status: string;
    target_budget: number;
}

export interface Bid {
    bid_id: number;
    shop_request_id: number;
    bid_amount: number;
    status: string;
}

