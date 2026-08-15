"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { useAuth } from "@/lib/firebase/AuthContext";
import { auth, db } from "@/lib/firebase/config";

type Role = "client" | "tailor";

const destinationFor = (role: Role) => {
    if (role === "tailor") {
        return "/tailor/home";
    } else if (role === "client") {
        return "/client/home";
    } else {
        return "/login";
    }
}

export default function OnboardingPage() {
    const router = useRouter();
    const { user, dbRole, loading: authLoading, logout, setRole } = useAuth();
    const [role, setSelectedRole] = useState<Role | null>(null);
    const [form, setForm] = useState({
        displayName: auth.currentUser?.displayName ?? "",
        phone: "",
        city: "",
        address: "",
        shopName: "",
        specialty: "",
        profileImageUrl: "",
        shopImageUrl: "",
        nicFrontUrl: "",
        nicRearUrl: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (dbRole) {
            router.replace(destinationFor(dbRole));
        }
    }, [authLoading, router, user, dbRole]);

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            router.replace("/login");
            return;
        }

        if (!role) {
            setError("Choose how you want to use the marketplace.");
            return;
        }

        if (!form.displayName.trim() || !form.city.trim()) {
            setError("Enter your name and city.");
            return;
        }

        if (
            role === "tailor" &&
            (!form.shopName.trim() || !form.specialty.trim())
        ) {
            setError("Enter your shop name and specialty.");
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            const displayName = form.displayName.trim();
            const photoURL = form.profileImageUrl.trim() || firebaseUser.photoURL || null;
            await updateProfile(firebaseUser, { displayName, photoURL });

            // Create profile on backend
            const token = await firebaseUser.getIdToken(true); // Force refresh to include new photoURL
            const profilePayload = role === "tailor"
                ? {
                    specialty: form.specialty.trim() || null,
                    nic_front: form.nicFrontUrl.trim() || null,
                    nic_rear: form.nicRearUrl.trim() || null,
                }
                : {};

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            let backendRes;
            try {
                backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/profiles/${role}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(profilePayload),
                    signal: controller.signal,
                });

                if (backendRes && !backendRes.ok) {
                    console.warn("Backend profile creation returned a non-OK status:", backendRes.status);
                } else if (role === "tailor") {
                    // If tailor profile succeeded, create their Shop
                    const shopPayload = {
                        tailor_id: firebaseUser.uid,
                        shop_name: form.shopName.trim(),
                        shop_bio: null,
                        shop_address: form.address.trim() || null,
                        city: form.city.trim() || null,
                        contact_number: form.phone.trim() || null,
                        registration_number: null,
                        latitude: null,
                        longitude: null,
                        profile_picture_url: form.shopImageUrl.trim() || photoURL
                    };

                    const shopRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/shops/`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(shopPayload),
                        signal: controller.signal,
                    });

                    if (!shopRes.ok) {
                        console.warn("Backend shop creation returned a non-OK status:", shopRes.status);
                    }
                }
            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") {
                    console.error("Error sending profile/shop to backend:", err);
                }
            } finally {
                clearTimeout(timeoutId);
            }

            const firestorePayload = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName,
                photoURL: photoURL,
                role,
                phone: form.phone.trim(),
                city: form.city.trim(),
                address: form.address.trim(),
                ...(role === "tailor"
                    ? {
                        shopName: form.shopName.trim(),
                        specialty: form.specialty.trim(),
                    }
                    : {}),
                createdAt: firebaseUser.metadata.creationTime,
                updatedAt: serverTimestamp(),
            };

            await Promise.race([
                setDoc(doc(db, "users", firebaseUser.uid), firestorePayload, { merge: true }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Firestore timeout or blocked")), 3000)
                )
            ]);

            setRole(role);
            router.replace(destinationFor(role));
        } catch (caughtError: unknown) {
            console.error("Unable to complete onboarding:", caughtError);
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Unable to save your profile. Please try again.",
            );
            setSubmitting(false);
        }
    };

    const handleUseAnotherAccount = async () => {
        await logout();
        router.replace("/login");
    };

    if (authLoading || !user || dbRole) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-sm text-slate-500">
                Preparing your profile...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl">
                <div className="mb-8">
                    <p className="text-sm font-medium text-slate-500">
                        Signed in as {user.email}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        Complete your profile
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Choose your role and add the details needed to get
                        started.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    {error && (
                        <div
                            aria-live="polite"
                            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    <fieldset>
                        <legend className="mb-3 text-sm font-semibold text-slate-800">
                            Account type
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                            {(["client", "tailor"] as const).map(
                                (option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        aria-pressed={role === option}
                                        onClick={() => setSelectedRole(option)}
                                        disabled={submitting}
                                        className={`rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition ${role === option
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ),
                            )}
                        </div>
                    </fieldset>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">
                            Full name
                            <input
                                value={form.displayName}
                                onChange={(event) =>
                                    updateField(
                                        "displayName",
                                        event.target.value,
                                    )
                                }
                                required
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Phone number
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    updateField("phone", event.target.value)
                                }
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            City
                            <input
                                value={form.city}
                                onChange={(event) =>
                                    updateField("city", event.target.value)
                                }
                                required
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Address
                            <input
                                value={form.address}
                                onChange={(event) =>
                                    updateField("address", event.target.value)
                                }
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>
                        
                        <label className="text-sm font-medium text-slate-700">
                            Profile Picture (Placeholder)
                            <div className="mt-2 flex items-center gap-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                        if (event.target.files?.[0]) {
                                            updateField("profileImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                        }
                                    }}
                                    disabled={submitting}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                />
                                {form.profileImageUrl && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                            </div>
                        </label>
                    </div>

                    {role === "tailor" && (
                        <div className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Shop name
                                <input
                                    value={form.shopName}
                                    onChange={(event) =>
                                        updateField(
                                            "shopName",
                                            event.target.value,
                                        )
                                    }
                                    required
                                    disabled={submitting}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Specialty
                                <input
                                    value={form.specialty}
                                    onChange={(event) =>
                                        updateField("specialty", event.target.value)
                                    }
                                    required
                                    disabled={submitting}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Shop Picture (Placeholder)
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            if (event.target.files?.[0]) {
                                                updateField("shopImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                            }
                                        }}
                                        disabled={submitting}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {form.shopImageUrl && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                                </div>
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                NIC Front (Placeholder)
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            if (event.target.files?.[0]) {
                                                updateField("nicFrontUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                            }
                                        }}
                                        disabled={submitting}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {form.nicFrontUrl && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                                </div>
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                NIC Rear (Placeholder)
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            if (event.target.files?.[0]) {
                                                updateField("nicRearUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                            }
                                        }}
                                        disabled={submitting}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {form.nicRearUrl && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
                        <button
                            type="button"
                            onClick={handleUseAnotherAccount}
                            disabled={submitting}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Use another account
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Saving profile..." : "Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
