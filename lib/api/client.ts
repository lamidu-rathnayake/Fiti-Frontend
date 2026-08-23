/**
 * lib/api/client.ts
 *
 * Core API fetch wrapper for the Fiti Backend.
 * - Automatically injects the Firebase ID token as a Bearer token.
 * - Reads the API base URL from NEXT_PUBLIC_API_URL.
 * - Parses the backend's { detail: "..." } error format.
 * - Handles 204 No Content responses.
 *
 * All domain endpoint files in lib/api/endpoints/ use this function.
 * No raw fetch() calls should exist outside of this file.
 */

import { auth } from "@/lib/firebase/config";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiError {
    detail: string;
}

export class FitiApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly detail: string,
    ) {
        super(detail);
        this.name = "FitiApiError";
    }
}

interface ApiFetchOptions extends Omit<RequestInit, "headers"> {
    /** If false, skips injecting the Authorization header (for public endpoints). Defaults to true. */
    authenticated?: boolean;
    headers?: Record<string, string>;
}

/**
 * Core fetch wrapper. Injects auth token, handles errors, and parses JSON.
 *
 * @param endpoint - The path after /api/v1 (e.g. "/auth/me/role")
 * @param options  - Standard RequestInit options plus `authenticated` flag
 */
export async function apiFetch<T = unknown>(
    endpoint: string,
    options: ApiFetchOptions = {},
): Promise<T> {
    const { authenticated = true, headers: extraHeaders, ...rest } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...extraHeaders,
    };

    if (authenticated) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new FitiApiError(401, "User is not authenticated.");
        }
        try {
            const token = await currentUser.getIdToken();
            headers["Authorization"] = `Bearer ${token}`;
        } catch {
            // Ignore token fetch error in standalone mode
        }
    }

    try {
        const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
            ...rest,
            headers,
        });

        // 204 No Content — return empty object
        if (res.status === 204) return {} as T;

        if (!res.ok) {
            if (res.status === 503 || res.status === 502 || res.status === 504) {
                // Backend server is down/unavailable — fallback to mock mode
                return handleMockApi<T>(endpoint, options);
            }

            let detail = `Request failed with status ${res.status}`;
            try {
                const errJson = await res.json();
                if (errJson.detail) {
                    detail =
                        typeof errJson.detail === "string"
                            ? errJson.detail
                            : JSON.stringify(errJson.detail);
                }
            } catch {
                // Non-JSON error body — use status code message
            }
            throw new FitiApiError(res.status, detail);
        }

        return res.json() as Promise<T>;
    } catch (err: unknown) {
        if (err instanceof FitiApiError) {
            throw err;
        }
        // Network connection error (e.g. backend server not running) — run standalone frontend mock
        return handleMockApi<T>(endpoint, options);
    }
}

/**
 * LocalStorage-backed Standalone Mock API Handler.
 * Allows the entire frontend to run fully interactively without requiring a running backend service.
 */
function handleMockApi<T>(endpoint: string, options: ApiFetchOptions): T {
    const method = (options.method || "GET").toUpperCase();
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid || "mock_user_id";
    const body = options.body ? JSON.parse(options.body as string) : {};

    const getItem = (key: string) => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(key);
    };
    const setItem = (key: string, val: string) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(key, val);
        }
    };

    // 1. GET /auth/me/role
    if (endpoint === "/auth/me/role" && method === "GET") {
        const savedRole = getItem(`fiti_role_${uid}`);
        if (!savedRole) {
            throw new FitiApiError(404, "User role not found.");
        }
        const role = savedRole as "client" | "tailor";
        return {
            role,
            target_url: role === "tailor" ? "/tailor/home" : "/client/home",
        } as T;
    }

    // 2. POST /profiles/client
    if (endpoint === "/profiles/client" && method === "POST") {
        setItem(`fiti_role_${uid}`, "client");
        const profile = {
            client_id: uid,
            email: currentUser?.email || "client@fiti.com",
            displayName: currentUser?.displayName || body.displayName || "Client User",
            phone: body.phone || null,
            city: body.city || null,
            address: body.address || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            created_at: new Date().toISOString(),
        };
        setItem(`fiti_client_profile_${uid}`, JSON.stringify(profile));
        return { message: "Client profile created successfully", client_id: uid } as T;
    }

    // 3. POST /profiles/tailor
    if (endpoint === "/profiles/tailor" && method === "POST") {
        setItem(`fiti_role_${uid}`, "tailor");
        const profile = {
            tailor_id: uid,
            email: currentUser?.email || "tailor@fiti.com",
            displayName: currentUser?.displayName || body.displayName || "Tailor User",
            phone: body.phone || null,
            city: body.city || null,
            address: body.address || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            created_at: new Date().toISOString(),
        };
        setItem(`fiti_tailor_profile_${uid}`, JSON.stringify(profile));
        return { message: "Tailor profile created successfully", tailor_id: uid } as T;
    }

    // 4. GET /profiles/client/{id}
    if (endpoint.startsWith("/profiles/client/") && !endpoint.includes("/measurements") && method === "GET") {
        const targetUid = endpoint.split("/profiles/client/")[1];
        const saved = getItem(`fiti_client_profile_${targetUid}`);
        if (saved) return JSON.parse(saved) as T;
        return {
            client_id: targetUid,
            email: currentUser?.email || "client@fiti.com",
            displayName: currentUser?.displayName || "Client User",
            phone: "+94 77 123 4567",
            city: "Colombo",
            address: "123 Main Street",
            latitude: 6.9271,
            longitude: 79.8612,
            created_at: new Date().toISOString(),
        } as T;
    }

    // 5. GET /profiles/tailor/{id}
    if (endpoint.startsWith("/profiles/tailor/") && !endpoint.includes("/verification") && method === "GET") {
        const targetUid = endpoint.split("/profiles/tailor/")[1];
        const saved = getItem(`fiti_tailor_profile_${targetUid}`);
        if (saved) return JSON.parse(saved) as T;
        return {
            tailor_id: targetUid,
            email: currentUser?.email || "tailor@fiti.com",
            displayName: currentUser?.displayName || "Master Tailor",
            phone: "+94 77 987 6543",
            city: "Colombo",
            address: "45 Fashion Ave",
            latitude: 6.9271,
            longitude: 79.8612,
            created_at: new Date().toISOString(),
        } as T;
    }

    // 6. PATCH /profiles/client/{id} or /profiles/tailor/{id}
    if ((endpoint.startsWith("/profiles/client/") || endpoint.startsWith("/profiles/tailor/")) && method === "PATCH") {
        const isClient = endpoint.startsWith("/profiles/client/");
        const targetUid = endpoint.replace(isClient ? "/profiles/client/" : "/profiles/tailor/", "");
        const key = isClient ? `fiti_client_profile_${targetUid}` : `fiti_tailor_profile_${targetUid}`;
        const existing = getItem(key) ? JSON.parse(getItem(key)!) : {};
        const updated = { ...existing, ...body };
        setItem(key, JSON.stringify(updated));
        return updated as T;
    }

    // 7. GET / PUT /profiles/client/{id}/measurements
    if (endpoint.includes("/measurements")) {
        const targetUid = endpoint.split("/profiles/client/")[1]?.split("/measurements")[0] || uid;
        const key = `fiti_measurements_${targetUid}`;
        if (method === "GET") {
            const saved = getItem(key);
            if (saved) return JSON.parse(saved) as T;
            return {
                client_id: targetUid,
                chest: 38,
                waist: 32,
                hips: 40,
                shoulder: 18,
                sleeve_length: 24,
                inseam: 30,
                updated_at: new Date().toISOString(),
            } as T;
        } else {
            const updated = { client_id: targetUid, ...body, updated_at: new Date().toISOString() };
            setItem(key, JSON.stringify(updated));
            return updated as T;
        }
    }

    // 8. GET /profiles/tailor/{id}/verification
    if (endpoint.includes("/verification")) {
        return { status: "verified", verified_at: new Date().toISOString() } as T;
    }

    // 9. SHOPS (/shops/*)
    if (endpoint.startsWith("/shops")) {
        let shopsStr = getItem("fiti_shops");
        if (!shopsStr) {
            const initialShops = [
                {
                    shop_id: 101,
                    tailor_id: "sample_tailor_1",
                    shop_name: "Royal Bespoke Tailors",
                    specialty: "Bridal & Luxury Suits",
                    shop_bio: "Premium custom tailoring with over 15 years of experience in Sri Lanka.",
                    city: "Colombo",
                    shop_address: "128 Galle Road, Colombo 03",
                    contact_number: "+94 11 234 5678",
                    rating: 4.9,
                    review_count: 28,
                    latitude: 6.9157,
                    longitude: 79.8517,
                    images: [{ image_id: 1, image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop" }],
                },
                {
                    shop_id: 102,
                    tailor_id: "sample_tailor_2",
                    shop_name: "Urban Stitch Studio",
                    specialty: "Casual Wear & Alterations",
                    shop_bio: "Modern custom fits, shirt tailoring, and rapid alterations.",
                    city: "Kandy",
                    shop_address: "42 Main Street, Kandy",
                    contact_number: "+94 81 223 4455",
                    rating: 4.7,
                    review_count: 14,
                    latitude: 7.2906,
                    longitude: 80.6337,
                    images: [{ image_id: 2, image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop" }],
                },
            ];
            setItem("fiti_shops", JSON.stringify(initialShops));
            shopsStr = JSON.stringify(initialShops);
        }
        const shopsList = JSON.parse(shopsStr || "[]");

        if (endpoint === "/shops/" || endpoint.startsWith("/shops/?")) {
            if (method === "GET") return shopsList as T;
            if (method === "POST") {
                const newShop = {
                    shop_id: Date.now(),
                    tailor_id: uid,
                    shop_name: body.shop_name || "My Tailor Shop",
                    specialty: body.specialty || "Custom Tailoring",
                    shop_bio: body.shop_bio || "",
                    city: body.city || "Colombo",
                    shop_address: body.shop_address || "",
                    contact_number: body.contact_number || "",
                    registration_number: body.registration_number || null,
                    rating: 5.0,
                    review_count: 1,
                    latitude: body.latitude || 6.9271,
                    longitude: body.longitude || 79.8612,
                    images: [],
                };
                shopsList.push(newShop);
                setItem("fiti_shops", JSON.stringify(shopsList));
                return newShop as T;
            }
        }
        if (endpoint.startsWith("/shops/nearby")) return shopsList as T;
        if (endpoint.startsWith("/shops/tailor/")) return shopsList.filter((s: any) => s.tailor_id === uid || s.tailor_id === endpoint.split("/shops/tailor/")[1]) as T;
        if (endpoint.match(/\/shops\/\d+\/images/)) {
            const shopId = parseInt(endpoint.split("/shops/")[1].split("/images")[0]);
            const shop = shopsList.find((s: any) => s.shop_id === shopId);
            const newImg = { image_id: Date.now(), image_url: body.image_url };
            if (shop) {
                shop.images = shop.images || [];
                shop.images.push(newImg);
                setItem("fiti_shops", JSON.stringify(shopsList));
            }
            return newImg as T;
        }
        if (endpoint.match(/\/shops\/\d+/)) {
            const shopId = parseInt(endpoint.split("/shops/")[1]);
            const shop = shopsList.find((s: any) => s.shop_id === shopId);
            if (method === "GET") return (shop || shopsList[0]) as T;
            if (method === "PUT") {
                const updated = { ...shop, ...body };
                const idx = shopsList.findIndex((s: any) => s.shop_id === shopId);
                if (idx !== -1) shopsList[idx] = updated;
                setItem("fiti_shops", JSON.stringify(shopsList));
                return updated as T;
            }
        }
    }

    // 10. ORDERS (/orders/*)
    if (endpoint.startsWith("/orders")) {
        let reqsStr = getItem("fiti_requests");
        let ordersStr = getItem("fiti_orders");

        if (!reqsStr) {
            const initialReqs = [
                {
                    request_id: 201,
                    client_id: "sample_client_1",
                    clothing_type: "3-Piece Tuxedo Suit",
                    description: "Navy blue Italian wool tuxedo for a wedding event.",
                    budget: 45000,
                    status: "open",
                    created_at: new Date().toISOString(),
                },
            ];
            setItem("fiti_requests", JSON.stringify(initialReqs));
            reqsStr = JSON.stringify(initialReqs);
        }
        const reqsList = JSON.parse(reqsStr || "[]");

        if (!ordersStr) setItem("fiti_orders", JSON.stringify([]));
        const ordersList = JSON.parse(getItem("fiti_orders") || "[]");

        if (endpoint === "/orders/requests" && method === "POST") {
            const newReq = {
                request_id: Date.now(),
                client_id: uid,
                clothing_type: body.clothing_type || "Custom Outfit",
                description: body.description || "",
                budget: body.budget || 0,
                status: "open",
                created_at: new Date().toISOString(),
            };
            reqsList.push(newReq);
            setItem("fiti_requests", JSON.stringify(reqsList));
            return newReq as T;
        }
        if (endpoint.startsWith("/orders/requests/open")) return reqsList.filter((r: any) => r.status === "open") as T;
        if (endpoint.startsWith("/orders/requests/client/")) return reqsList.filter((r: any) => r.client_id === uid || r.client_id === endpoint.split("/orders/requests/client/")[1]) as T;
        if (endpoint.startsWith("/orders/bids") && method === "POST") {
            const bid = { bid_id: Date.now(), ...body, tailor_id: uid, created_at: new Date().toISOString() };
            return bid as T;
        }
        if (endpoint === "/orders/accept-bid" && method === "POST") {
            const newOrder = {
                order_id: Date.now(),
                client_id: uid,
                shop_id: body.shop_id || 101,
                agreed_price: body.price || 25000,
                status: "in_progress",
                created_at: new Date().toISOString(),
            };
            ordersList.push(newOrder);
            setItem("fiti_orders", JSON.stringify(ordersList));
            return newOrder as T;
        }
        if (endpoint.startsWith("/orders/client/")) return ordersList as T;
        if (endpoint.startsWith("/orders/shop/")) return ordersList as T;
        if (endpoint.includes("/payments/mock")) {
            return { payment_id: Date.now(), status: "paid", amount: 25000, created_at: new Date().toISOString() } as T;
        }
        if (endpoint.includes("/ratings")) {
            return { rating_id: Date.now(), rating: 5, review: "Excellent work!" } as T;
        }
    }

    return {} as T;
}
