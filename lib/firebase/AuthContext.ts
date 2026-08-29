"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "./config";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut,
} from "firebase/auth";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { FitiApiError } from "@/lib/api/client";

export type Role = "client" | "tailor";

/**
 * UserProfile holds identity data sourced exclusively from Firebase Authentication.
 * Business profile data (phone, city, address, etc.) lives in Supabase PostgreSQL
 * and should be fetched via the /api/v1/profiles/* endpoints when needed by a page.
 */
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: Role;
}

interface AuthContextType {
    user: UserProfile | null;
    dbRole: Role | null;
    role: Role | null;
    loading: boolean;
    logout: () => Promise<void>;
    setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    dbRole: null,
    role: null,
    loading: true,
    logout: async () => { },
    setRole: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [dbRole, setDbRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser) {
                    let roleFromDb: Role | undefined;

                    try {
                        const data = await getMyRole();
                        roleFromDb = data.role;
                    } catch (err) {
                        // FitiApiError 404 = missing role in user_roles table.
                        // User is new and needs to be redirected to /onboarding
                        if (err instanceof FitiApiError && err.status === 404) {
                            // Leave roleFromDb as undefined so they can be routed to onboarding
                        } else {
                            console.error("Error fetching user role from backend:", err);
                        }
                    }

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: roleFromDb,
                    });
                    setDbRole(roleFromDb ?? null);
                    setLoading(false);
                } else {
                    const devRole = (typeof window !== "undefined" ? sessionStorage.getItem("fiti_dev_role") : null) as Role | null;
                    if (devRole) {
                        setUser({
                            uid: "dev-user-id",
                            email: "dev@fiti.lk",
                            displayName: devRole === "tailor" ? "Master Tailor (Dev)" : "Client (Dev)",
                            photoURL: null,
                            role: devRole,
                        });
                        setDbRole(devRole);
                    } else {
                        setUser(null);
                        setDbRole(null);
                    }
                    setLoading(false);
                }
            },
        );

        return () => {
            unsubscribeAuth();
        };
    }, []);

    const logout = async () => {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("fiti_dev_role");
        }
        await signOut(auth);
        setUser(null);
        setDbRole(null);
    };

    /**
     * Updates the role in local state only.
     * The role is persisted in Supabase by the backend when createClientProfile /
     * createTailorProfile is called during onboarding — no additional write needed here.
     */
    const setRole = (role: Role) => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("fiti_dev_role", role);
        }
        const currentUser = auth.currentUser;

        const nextUser: UserProfile = currentUser
            ? {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role,
            }
            : {
                uid: "dev-user-id",
                email: "dev@fiti.lk",
                displayName: role === "tailor" ? "Master Tailor (Dev)" : "Client (Dev)",
                photoURL: null,
                role,
            };

        setUser(nextUser);
        setDbRole(role);
    };

    return React.createElement(
        AuthContext.Provider,
        { value: { user, dbRole, role: dbRole, loading, logout, setRole } },
        children,
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
