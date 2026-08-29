/**
 * lib/api/types/profile.ts
 *
 * Type definitions for the Profiles & Measurements resource.
 * Backend reference: /api/v1/profiles/*
 */

// ── Client ────────────────────────────────────────────────────────────

/**
 * Request body for POST /api/v1/profiles/client.
 * Firebase UID is extracted from the Bearer token by the backend.
 * Business profile fields (formerly stored in Firestore) are now persisted
 * directly in the `clients` table in Supabase PostgreSQL.
 */
export interface ClientProfilePayload {
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    photo_url?: string | null;
}

/** Success (201) response from POST /api/v1/profiles/client */
export interface ClientProfileResponse {
    id: string;
    phone: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    photo_url: string | null;
    created_at: string | null;
    updated_at: string | null;
}

/**
 * Response from GET /api/v1/profiles/client/{id}
 * (Auth: Client Role)
 */
export interface ClientProfile {
    id: string;
    phone: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    photo_url: string | null;
    created_at: string | null;
    updated_at: string | null;
}

/** Request body for PATCH /api/v1/profiles/client/{id} */
export type ClientProfileUpdatePayload = Partial<ClientProfilePayload>;

// ── Measurements ──────────────────────────────────────────────────────

/** Request body for PUT /api/v1/profiles/client/{id}/measurements */
export interface MeasurementsPayload {
    chest?: number | null;
    waist?: number | null;
    shoulder?: number | null;
    sleeve?: number | null;
    neck?: number | null;
    hip?: number | null;
    inseam?: number | null;
    length?: number | null;
    notes?: string | null;
}

export interface Measurements extends MeasurementsPayload {
    id: number;
    client_id: string;
}

// ── Tailor ────────────────────────────────────────────────────────────

/**
 * Request body for POST /api/v1/profiles/tailor.
 * Firebase UID is extracted from the Bearer token by the backend.
 * Business profile fields (formerly stored in Firestore) are now persisted
 * directly in the `tailors` table in Supabase PostgreSQL.
 */
export interface TailorProfilePayload {
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    nic_front?: string | null;
    nic_rear?: string | null;
}

/** Success (201) response from POST /api/v1/profiles/tailor */
export interface TailorProfileResponse {
    id: string;
    phone: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    nic_front: string | null;
    nic_rear: string | null;
    is_verified: boolean;
    created_at: string | null;
    updated_at: string | null;
}

/** Response from GET /api/v1/profiles/tailor/{id} */
export interface TailorProfile {
    id: string;
    phone: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
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

/** Request body for PATCH /api/v1/profiles/tailor/{id} */
export type TailorProfileUpdatePayload = Partial<TailorProfilePayload>;
