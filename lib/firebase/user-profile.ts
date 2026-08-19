import type { User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/config";

type UserRole = "client" | "tailor";

interface SaveUserProfileOptions {
    user: User;
    role: UserRole;
    displayName: string;
    photoURL: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    specialty?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export function saveUserProfile({
    user,
    role,
    displayName,
    photoURL,
    phone,
    city,
    address,
    specialty,
    latitude,
    longitude,
}: SaveUserProfileOptions) {
    return setDoc(
        doc(db, "users", user.uid),
        {
            uid: user.uid,
            email: user.email,
            displayName,
            photoURL,
            role,
            phone,
            city,
            address,
            ...(role === "tailor" && {
                specialty: specialty ?? null,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
            }),
            createdAt: user.metadata.creationTime,
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
}