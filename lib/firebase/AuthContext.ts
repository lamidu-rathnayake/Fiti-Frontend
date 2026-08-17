"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./config";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, onSnapshot } from "firebase/firestore";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { FitiApiError } from "@/lib/api/client";

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
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser) {
                    let roleFromDb: Role | undefined;
                    let extraProfileData: Partial<UserProfile> = {};

                    try {
                        const data = await getMyRole();
                        roleFromDb = data.role;
                    } catch (err) {
                        // FitiApiError 404 = new user with no role yet — expected during registration
                        if (!(err instanceof FitiApiError && err.status === 404)) {
                            console.error("Error fetching user role from backend:", err);
                        }
                    }

                    try {
                        const userDocRef = doc(db, "users", firebaseUser.uid);
                        unsubscribeSnapshot = onSnapshot(userDocRef, (userSnap) => {
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
                            
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                role: roleFromDb,
                                ...extraProfileData,
                            });
                            setDbRole(roleFromDb ?? null);
                            setLoading(false);
                        }, (err) => {
                            console.error("Error fetching user profile from Firestore:", err);
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                role: roleFromDb,
                            });
                            setDbRole(roleFromDb ?? null);
                            setLoading(false);
                        });
                    } catch (err) {
                        console.error("Error setting up Firestore listener:", err);
                        setLoading(false);
                    }
                } else {
                    if (unsubscribeSnapshot) {
                        unsubscribeSnapshot();
                        unsubscribeSnapshot = undefined;
                    }
                    setUser(null);
                    setDbRole(null);
                    setLoading(false);
                }
            },
        );

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setDbRole(null);
    };

    const setRole = async (role: Role) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const nextUser: UserProfile = user 
            ? { ...user, role } 
            : {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role,
            };

        setUser(nextUser);
        setDbRole(role);

        try {
            await setDoc(
                doc(db, "users", currentUser.uid),
                {
                    role,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
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
