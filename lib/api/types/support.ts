/**
 * lib/api/types/support.ts
 *
 * Type definitions for the Support & Engagement resource.
 * Backend reference: /api/v1/support/*
 */

// ── Notifications ─────────────────────────────────────────────────────

/** Request body for POST /api/v1/support/notifications */
export interface NotificationPayload {
    user_id: string;
    message: string;
}

export interface Notification {
    notification_id: number;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

// ── Favorites ─────────────────────────────────────────────────────────

/** Request body for POST /api/v1/support/favorites */
export interface FavoritePayload {
    client_id: string;
    shop_id: number;
}

export interface Favorite {
    client_id: string;
    shop_id: number;
    created_at: string;
}
