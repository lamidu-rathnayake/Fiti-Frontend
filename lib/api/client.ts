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
        const token = await currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
        ...rest,
        headers,
    });

    // 204 No Content — return empty object
    if (res.status === 204) return {} as T;

    if (!res.ok) {
        let detail = `Request failed with status ${res.status}`;
        try {
            const errJson: ApiError = await res.json();
            detail = errJson.detail || detail;
        } catch {
            // Non-JSON error body — use status code message
        }
        throw new FitiApiError(res.status, detail);
    }

    return res.json() as Promise<T>;
}
