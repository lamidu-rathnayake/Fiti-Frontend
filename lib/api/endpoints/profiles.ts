/**
 * lib/api/endpoints/profiles.ts
 *
 * API functions for the Profiles & Measurements resource.
 * Backend reference: /api/v1/profiles/*
 */

import { apiFetch } from "@/lib/api/client";
import type {
    ClientProfilePayload,
    ClientProfileResponse,
    ClientProfile,
    TailorProfilePayload,
    TailorProfileResponse,
    TailorProfile,
    TailorVerification,
    MeasurementsPayload,
    Measurements,
} from "@/lib/api/types/profile";

// ── Client ────────────────────────────────────────────────────────────

/**
 * Create a client profile in the backend.
 * Inserts the user into the `clients` table and writes a row into `user_roles`.
 *
 * POST /api/v1/profiles/client
 * @throws {FitiApiError} with status 409 if the profile already exists.
 */
export async function createClientProfile(
    payload: ClientProfilePayload = {},
): Promise<ClientProfileResponse> {
    return apiFetch<ClientProfileResponse>("/profiles/client", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch a client's profile.
 * GET /api/v1/profiles/client/{id}
 * (Auth: Client Role)
 */
export async function getClientProfile(uid: string): Promise<ClientProfile> {
    return apiFetch<ClientProfile>(`/profiles/client/${uid}`);
}

// ── Measurements ──────────────────────────────────────────────────────

/**
 * Save or update a client's standard body measurements.
 * PUT /api/v1/profiles/client/{id}/measurements
 */
export async function updateMeasurements(
    uid: string,
    payload: MeasurementsPayload,
): Promise<Measurements> {
    return apiFetch<Measurements>(`/profiles/client/${uid}/measurements`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch a client's body measurements.
 * GET /api/v1/profiles/client/{id}/measurements
 */
export async function getMeasurements(uid: string): Promise<Measurements> {
    return apiFetch<Measurements>(`/profiles/client/${uid}/measurements`);
}

// ── Tailor ────────────────────────────────────────────────────────────

/**
 * Create a tailor profile in the backend.
 * Inserts the user into the `tailors` table and writes a row into `user_roles`.
 *
 * POST /api/v1/profiles/tailor
 * @throws {FitiApiError} with status 409 if the profile already exists.
 */
export async function createTailorProfile(
    payload: TailorProfilePayload,
): Promise<TailorProfileResponse> {
    return apiFetch<TailorProfileResponse>("/profiles/tailor", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * View a tailor's public profile.
 * GET /api/v1/profiles/tailor/{id}
 * (Auth: Public)
 */
export async function getTailorProfile(uid: string): Promise<TailorProfile> {
    return apiFetch<TailorProfile>(`/profiles/tailor/${uid}`, {
        authenticated: false,
    });
}

/**
 * Check if a tailor's profile has been verified.
 * GET /api/v1/profiles/tailor/{id}/verification
 * (Auth: Public)
 */
export async function getTailorVerification(
    uid: string,
): Promise<TailorVerification> {
    return apiFetch<TailorVerification>(`/profiles/tailor/${uid}/verification`, {
        authenticated: false,
    });
}
