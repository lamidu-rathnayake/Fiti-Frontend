/**
 * lib/api/endpoints/support.ts
 *
 * API functions for the Support & Engagement resource.
 * Backend reference: /api/v1/support/*
 */

import { apiFetch } from "@/lib/api/client";
import type {
    Notification,
    NotificationPayload,
    Favorite,
    FavoritePayload,
} from "@/lib/api/types/support";

// ── Notifications ─────────────────────────────────────────────────────

/**
 * Create a system notification for a user.
 * POST /api/v1/support/notifications
 * (Auth: Valid Token)
 */
export async function createNotification(
    payload: NotificationPayload,
): Promise<Notification> {
    return apiFetch<Notification>("/support/notifications", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * List a user's notifications.
 * GET /api/v1/support/notifications/{id}
 * (Auth: Valid Token)
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
    return apiFetch<Notification[]>(`/support/notifications/${userId}`);
}

/**
 * Mark a notification as read.
 * PATCH /api/v1/support/notifications/{id}/read
 * (Auth: Valid Token)
 */
export async function markNotificationRead(
    notificationId: number,
): Promise<Notification> {
    return apiFetch<Notification>(
        `/support/notifications/${notificationId}/read`,
        { method: "PATCH" },
    );
}

// ── Favorites ─────────────────────────────────────────────────────────

/**
 * Add a shop to a client's favorites.
 * POST /api/v1/support/favorites
 * (Auth: Valid Token)
 */
export async function addFavorite(payload: FavoritePayload): Promise<Favorite> {
    return apiFetch<Favorite>("/support/favorites", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/**
 * Remove a shop from a client's favorites.
 * DELETE /api/v1/support/favorites/{c_id}/{s_id}
 * (Auth: Valid Token)
 */
export async function removeFavorite(
    clientId: string,
    shopId: number,
): Promise<void> {
    return apiFetch<void>(`/support/favorites/${clientId}/${shopId}`, {
        method: "DELETE",
    });
}

/**
 * View a client's favorite shops.
 * GET /api/v1/support/favorites/{id}
 * (Auth: Valid Token)
 */
export async function getFavorites(clientId: string): Promise<Favorite[]> {
    return apiFetch<Favorite[]>(`/support/favorites/${clientId}`);
}
