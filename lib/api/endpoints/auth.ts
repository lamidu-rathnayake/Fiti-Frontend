/**
 * lib/api/endpoints/auth.ts
 *
 * API functions for the Authentication gateway.
 * Backend reference: GET /api/v1/auth/me/role
 */

import { apiFetch } from "@/lib/api/client";
import type { UserRoleResponse } from "@/lib/api/types/auth";

/**
 * Fetch the authenticated user's role from the backend (PostgreSQL source of truth).
 *
 * - Success (200): Returns { role: "client" | "tailor" }
 * - Not Found (404): Backend throws FitiApiError — caller should redirect to /onboarding
 *
 * @throws {FitiApiError} with status 404 if the user has no registered role yet.
 */
export async function getMyRole(): Promise<UserRoleResponse> {
    return apiFetch<UserRoleResponse>("/auth/me/role");
}
