const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

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
    type: "client" | "seller";
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

export interface AuthRoleResponse {
    uid: string;
    email: string | null;
    role: string;
    redirect_to: string;
}

export async function getCurrentUserRole(idToken: string) {
    return request<AuthRoleResponse>("/auth/me/role", {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
}

// ── Admin Functions ───────────────────────────────────────────────────
export function getURL() {
    return API_BASE;
}

export async function createClient(data: any) {
    return request("/profiles/client", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function createSeller(data: any) {
    return request("/profiles/seller", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function createShop(data: any) {
    return request("/shops/", { method: "POST", body: JSON.stringify(data) });
}

export async function createClothingRequest(data: any) {
    return request("/orders/requests", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function submitBid(data: any) {
    return request("/orders/bids", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// Mock lists for the dashboard since there are no "get all" admin routes in FastAPI right now
export async function getAllProfiles(): Promise<Profile[]> {
    return [
        {
            id: "client_1",
            type: "client",
            created_at: new Date().toISOString(),
        },
        {
            id: "seller_1",
            type: "seller",
            created_at: new Date().toISOString(),
        },
    ];
}

export async function getAllShops(): Promise<Shop[]> {
    return [
        {
            shop_id: 1,
            seller_id: "seller_1",
            shop_name: "Savile Row Custom",
            city: "London",
            average_rating: 4.8,
        },
    ];
}

export async function getAllRequests(): Promise<ClothingRequest[]> {
    return [
        {
            request_id: 101,
            client_id: "client_1",
            clothing_category: "SUIT",
            status: "PENDING",
            target_budget: 500,
        },
    ];
}
