/**
 * lib/api/types/auth.ts
 *
 * Type definitions for the Authentication gateway.
 * Backend reference: GET /api/v1/auth/me/role
 */

export type Role = "client" | "tailor";

/** Success (200) response from GET /api/v1/auth/me/role */
export interface UserRoleResponse {
    role: Role;
}
