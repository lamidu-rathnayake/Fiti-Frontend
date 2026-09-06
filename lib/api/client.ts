/**
 * Core API fetch wrapper for the Fiti backend.
 * Automatically injects Firebase ID tokens and parses backend errors.
 */

import { auth } from "@/lib/firebase/config";

const rawBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = rawBase.trim().replace(/\/+$/, "");

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
    /** If false, skips injecting the Authorization header. Defaults to true. */
    authenticated?: boolean;
    headers?: Record<string, string>;
}

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
            headers.Authorization = `Bearer ${token}`;
        } catch {
            throw new FitiApiError(401, "Unable to obtain an authentication token.");
        }
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
            ...rest,
            headers,
        });
    } catch (err) {
        console.error(`Network error calling ${API_BASE}/api/v1${endpoint}:`, err);
        throw new FitiApiError(0, "Unable to connect to the backend API.");
    }

    if (response.status === 204) return {} as T;

    if (!response.ok) {
        let detail = `Request failed with status ${response.status}`;
        try {
            const errorBody = await response.json();
            if (errorBody.detail) {
                if (typeof errorBody.detail === "string") {
                    detail = errorBody.detail;
                } else if (Array.isArray(errorBody.detail)) {
                    detail = errorBody.detail
                        .map((err: any) => {
                            const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : "field";
                            return `${field}: ${err.msg}`;
                        })
                        .join(", ");
                } else {
                    detail = JSON.stringify(errorBody.detail);
                }
            }
        } catch {
            // Keep the status-based message when the response is not JSON.
        }
        throw new FitiApiError(response.status, detail);
    }

    return response.json() as Promise<T>;
}