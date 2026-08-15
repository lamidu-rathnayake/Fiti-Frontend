"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./config";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export type Role = "client" | "tailor";

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: Role;
    phone?: string;
    address?: string;
    city?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    dbRole: Role | null;
    loading: boolean;
    logout: () => Promise<void>;
    setRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    dbRole: null,
    loading: true,
    logout: async () => {},
    setRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [dbRole, setDbRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser) {
                    let roleFromDb: Role | undefined;
                    let extraProfileData: Partial<UserProfile> = {};

                    try {
                        const token = await firebaseUser.getIdToken();
                        
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 3000);
                        
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me/role`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (res.ok) {
                            const data = await res.json();
                            if (data.role === "client" || data.role === "tailor") {
                                roleFromDb = data.role;
                            }
                        }
                    } catch (err) {
                        if (err instanceof Error && err.name !== "AbortError") {
                            console.error("Error fetching user role from backend:", err);
                        }
                    }

                    try {
                        const userDocRef = doc(db, "users", firebaseUser.uid);
                        // Use Promise.race to prevent infinite hang if Firestore is blocked by adblocker
                        const userSnap = await Promise.race([
                            getDoc(userDocRef),
                            new Promise<never>((_, reject) => 
                                setTimeout(() => reject(new Error("Firestore timeout or blocked")), 3000)
                            )
                        ]);
                        
                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            if (!roleFromDb && (data.role === "client" || data.role === "tailor")) {
                                roleFromDb = data.role;
                            }
                            extraProfileData = {
                                phone: data.phone,
                                address: data.address,
                                city: data.city,
                            };
                        }
                    } catch (err) {
                        console.error(
                            "Error fetching user profile from Firestore:",
                            err,
                        );
                    }

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: roleFromDb,
                        ...extraProfileData,
                    });
                    setDbRole(roleFromDb ?? null);
                } else {
                    setUser(null);
                    setDbRole(null);
                }
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const setRole = async (role: Role) => {
        if (!user || !auth.currentUser) {
            return;
        }

        const nextUser = { ...user, role };
        setUser(nextUser);
        setDbRole(role);

        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                role,
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error("Error updating role in Firestore:", err);
        }
    };

    return React.createElement(
        AuthContext.Provider,
        { value: { user, dbRole, loading, logout, setRole } },
        children,
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
