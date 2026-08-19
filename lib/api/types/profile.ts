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
export type ClientProfilePayload = Record<string, never>;

/** Success (201) response from POST /api/v1/profiles/client */
export interface ClientProfileResponse {
    id: string;
    created_at: string | null;
    updated_at: string | null;
}

/**
 * Response from GET /api/v1/profiles/client/{id}
 * (Auth: Client Role)
 */
export interface ClientProfile {
    id: string;
    created_at: string | null;
    updated_at: string | null;
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
    nic_front?: string | null;
    nic_rear?: string | null;
}

/** Success (201) response from POST /api/v1/profiles/tailor */
export interface TailorProfileResponse {
    id: string;
    nic_front: string | null;
    nic_rear: string | null;
    is_verified: boolean;
    created_at: string | null;
    updated_at: string | null;
}

/** Response from GET /api/v1/profiles/tailor/{id} */
export interface TailorProfile {
    id: string;
    nic_front: string | null;
    nic_rear: string | null;
    is_verified: boolean;
    created_at: string | null;
    updated_at: string | null;
}

/** Response from GET /api/v1/profiles/tailor/{id}/verification */
export interface TailorVerification {
    uid: string;
    is_verified: boolean;
}
