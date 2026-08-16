/**
 * lib/api/types/profile.ts
 *
 * Type definitions for the Profiles & Measurements resource.
 * Backend reference: /api/v1/profiles/*
 */

// ── Client ────────────────────────────────────────────────────────────

/**
 * Request body for POST /api/v1/profiles/client.
 * Firebase UID is extracted from the Bearer token by the backend — no body fields required.
 */
export interface ClientProfilePayload {
    full_name?: string;
    email?: string;
    profile_image_url?: string | null;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

/** Success (201) response from POST /api/v1/profiles/client */
export interface ClientProfileResponse {
    message: string;
}

/**
 * Response from GET /api/v1/profiles/client/{id}
 * (Auth: Client Role)
 */
export interface ClientProfile {
    uid: string;
    email: string | null;
    full_name: string | null;
    profile_image_url: string | null;
    created_at: string;
}

// ── Measurements ──────────────────────────────────────────────────────

/** Request body for PUT /api/v1/profiles/client/{id}/measurements */
export interface MeasurementsPayload {
    chest?: number | null;
    waist?: number | null;
    hips?: number | null;
    inseam?: number | null;
    shoulder?: number | null;
    sleeve?: number | null;
    neck?: number | null;
    height?: number | null;
    weight?: number | null;
}

export interface Measurements extends MeasurementsPayload {
    id: number;
    client_id: string;
}

// ── Tailor ────────────────────────────────────────────────────────────

/**
 * Request body for POST /api/v1/profiles/tailor.
 * Firebase UID is extracted from the Bearer token by the backend.
 */
export interface TailorProfilePayload {
    full_name?: string;
    email?: string;
    profile_image_url?: string | null;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    specialty?: string | null;
    nic_front?: string | null;
    nic_rear?: string | null;
}

/** Success (201) response from POST /api/v1/profiles/tailor */
export interface TailorProfileResponse {
    message: string;
}

/** Response from GET /api/v1/profiles/tailor/{id} */
export interface TailorProfile {
    uid: string;
    full_name: string | null;
    profile_image_url: string | null;
    specialty: string | null;
    is_verified: boolean;
    created_at: string;
}

/** Response from GET /api/v1/profiles/tailor/{id}/verification */
export interface TailorVerification {
    uid: string;
    is_verified: boolean;
}
