/**
 * lib/api/endpoints/profiles.ts
 *
 * API functions for the Profiles & Measurements resource.
 * Backend reference: /api/v1/profiles/*
 *
 * All business profile data (phone, city, address, NIC images, etc.) that was
 * previously split between Firestore and PostgreSQL is now stored exclusively
 * in Supabase PostgreSQL via these endpoints.
 */

import { apiFetch } from "@/lib/api/client";
import type {
    ClientProfilePayload,
    ClientProfileResponse,
    ClientProfile,
    ClientProfileUpdatePayload,
    TailorProfilePayload,
    TailorProfileResponse,
    TailorProfile,
    TailorProfileUpdatePayload,
    TailorVerification,
    MeasurementsPayload,
    Measurements,
} from "@/lib/api/types/profile";

// ── Cloudinary ────────────────────────────────────────────────────────

/**
 * Request the backend to securely delete a Cloudinary image.
 * POST /api/v1/profiles/cloudinary-image/delete
 */
export async function deleteCloudinaryImage(publicId: string): Promise<any> {
    return apiFetch<any>("/profiles/cloudinary-image/delete", {
        method: "POST",
        body: JSON.stringify({ public_id: publicId }),
    });
}

// ── Client ────────────────────────────────────────────────────────────

/**
 * Create a client profile in the backend.
 * Inserts the user into the `clients` table and writes a row into `user_roles`.
 * Firebase UID is extracted from the Bearer token by the backend.
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
 * Fetch the authenticated client's own profile.
 * GET /api/v1/profiles/client/{id}
 * (Auth: Client Role)
 */
export async function getClientProfile(uid: string): Promise<ClientProfile> {
    return apiFetch<ClientProfile>(`/profiles/client/${uid}`);
}

/**
 * Update the authenticated client's profile fields.
 * PATCH /api/v1/profiles/client/{id}
 * (Auth: Client Role)
 */
export async function updateClientProfile(
    uid: string,
    payload: ClientProfileUpdatePayload,
): Promise<ClientProfile> {
    return apiFetch<ClientProfile>(`/profiles/client/${uid}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
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
 * Firebase UID is extracted from the Bearer token by the backend.
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
 * Update the authenticated tailor's profile fields.
 * PATCH /api/v1/profiles/tailor/{id}
 * (Auth: Tailor Role)
 */
export async function updateTailorProfile(
    uid: string,
    payload: TailorProfileUpdatePayload,
): Promise<TailorProfile> {
    return apiFetch<TailorProfile>(`/profiles/tailor/${uid}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
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
