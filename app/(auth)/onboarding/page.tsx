"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { useAuth } from "@/lib/AuthContext";
import { auth, db } from "@/lib/firebase/config";

type Role = "client" | "seller";

const destinationFor = (role: Role) =>
    role === "seller" ? "/seller/dashboard" : "/client/home";

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading, logout, setRole } = useAuth();
    const [role, setSelectedRole] = useState<Role | null>(null);
    const [form, setForm] = useState({
        displayName: auth.currentUser?.displayName ?? "",
        phone: "",
        city: "",
        address: "",
        shopName: "",
        specialty: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role) {
            router.replace(destinationFor(user.role));
        }
    }, [authLoading, router, user]);

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

        if (role === "seller" && (!form.shopName.trim() || !form.specialty.trim())) {
            setError("Enter your shop name and specialty.");
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            const displayName = form.displayName.trim();
            await updateProfile(firebaseUser, { displayName });

            await setDoc(
                doc(db, "users", firebaseUser.uid),
                {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName,
                    photoURL: firebaseUser.photoURL,
                    role,
                    phone: form.phone.trim(),
                    city: form.city.trim(),
                    address: form.address.trim(),
                    ...(role === "seller"
                        ? {
                              shopName: form.shopName.trim(),
                              specialty: form.specialty.trim(),
                          }
                        : {}),
                    updatedAt: serverTimestamp(),
                },
                { merge: true },
            );

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

    if (authLoading || !user || user.role) {
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
                        Choose your role and add the details needed to get started.
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
                            {(["client", "seller"] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    aria-pressed={role === option}
                                    onClick={() => setSelectedRole(option)}
                                    disabled={submitting}
                                    className={`rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition ${
                                        role === option
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">
                            Full name
                            <input
                                value={form.displayName}
                                onChange={(event) =>
                                    updateField("displayName", event.target.value)
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
                                onChange={(event) => updateField("phone", event.target.value)}
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            City
                            <input
                                value={form.city}
                                onChange={(event) => updateField("city", event.target.value)}
                                required
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Address
                            <input
                                value={form.address}
                                onChange={(event) => updateField("address", event.target.value)}
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>
                    </div>

                    {role === "seller" && (
                        <div className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Shop name
                                <input
                                    value={form.shopName}
                                    onChange={(event) =>
                                        updateField("shopName", event.target.value)
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