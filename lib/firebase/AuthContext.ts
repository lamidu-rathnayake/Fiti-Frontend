"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./config";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export type Role = "client" | "seller" | "admin";

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
    loading: boolean;
    logout: () => Promise<void>;
    setRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => {},
    setRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
                if (firebaseUser) {
                    let roleFromDb: Role | undefined;
                    let extraProfileData: Partial<UserProfile> = {};

                    try {
                        const userDocRef = doc(db, "users", firebaseUser.uid);
                        const userSnap = await getDoc(userDocRef);
                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            if (
                                data.role === "client" ||
                                data.role === "seller" ||
                                data.role === "admin"
                            ) {
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
                } else {
                    setUser(null);
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
        { value: { user, loading, logout, setRole } },
        children,
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
