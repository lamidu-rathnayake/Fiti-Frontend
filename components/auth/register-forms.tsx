"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/AuthContext";

export function ClientRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const { setRole } = useAuth();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        city: "",
        address: "",
        profileImageUrl: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !form.fullName.trim() ||
            !form.email.trim() ||
            !form.password ||
            !form.confirmPassword
        ) {
            setError("Please complete all fields.");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                form.email.trim(),
                form.password,
            );

            const photoURL = form.profileImageUrl.trim() || null;
            await updateProfile(userCredential.user, {
                displayName: form.fullName.trim(),
                photoURL: photoURL,
            });

            // Create profile on backend
            const token = await userCredential.user.getIdToken(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            try {
                const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/profiles/client`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({}),
                    signal: controller.signal,
                });
                if (!backendRes.ok) console.warn("Backend client profile creation returned a non-OK status:", backendRes.status);
            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") console.error("Error sending profile to backend:", err);
            } finally {
                clearTimeout(timeoutId);
            }

            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: form.fullName.trim(),
                photoURL: photoURL,
                role: "client",
                createdAt: userCredential.user.metadata.creationTime,
                phone: form.phone.trim() || null,
                city: form.city.trim(),
                address: form.address.trim() || null,
                updatedAt: serverTimestamp(),
            });

            await setRole("client");
            router.replace("/client/home");
        } catch (err: unknown) {
            console.error("Client registration failed:", err);

            const errorCode = err instanceof FirebaseError ? err.code : "";
            switch (errorCode) {
                case "auth/email-already-in-use":
                    setError("An account with this email already exists.");
                    break;
                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;
                default:
                    setError(
                        "Unable to create your account. Please try again.",
                    );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                <div className="text-center mb-8">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        Client
                    </span>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        Create client account
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Start your journey as a client.
                    </p>
                </div>

                {error && (
                    <div
                        aria-live="polite"
                        className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="client-name"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Full name
                        </label>
                        <input
                            id="client-name"
                            type="text"
                            value={form.fullName}
                            onChange={(e) =>
                                handleChange("fullName", e.target.value)
                            }
                            placeholder="Your full name"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="client-email"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Email
                        </label>
                        <input
                            id="client-email"
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                handleChange("email", e.target.value)
                            }
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="client-phone"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Phone number
                        </label>
                        <input
                            id="client-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) =>
                                handleChange("phone", e.target.value)
                            }
                            placeholder="+94 77 123 4567"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="client-city"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            City
                        </label>
                        <input
                            id="client-city"
                            type="text"
                            value={form.city}
                            onChange={(e) =>
                                handleChange("city", e.target.value)
                            }
                            placeholder="Colombo"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="client-address"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Address
                        </label>
                        <input
                            id="client-address"
                            type="text"
                            value={form.address}
                            onChange={(e) =>
                                handleChange("address", e.target.value)
                            }
                            placeholder="45 Temple Street"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Profile Picture (Placeholder)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                        handleChange("profileImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                    }
                                }}
                                disabled={loading}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {form.profileImageUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="client-password"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="client-password"
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                                handleChange("password", e.target.value)
                            }
                            placeholder="Create a password"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="client-confirm-password"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Confirm password
                        </label>
                        <input
                            id="client-confirm-password"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) =>
                                handleChange("confirmPassword", e.target.value)
                            }
                            placeholder="Re-enter your password"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Continue"}
                    </button>
                </form>

                <div className="mt-7 text-center">
                    <p className="text-sm text-slate-500">
                        Changed your mind?{" "}
                        <button
                            type="button"
                            onClick={() =>
                                onBack ? onBack() : router.push("/register")
                            }
                            className="font-medium text-slate-900 hover:underline"
                        >
                            Back
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export function TailorRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const { setRole } = useAuth();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        shopName: "",
        specialty: "",
        city: "",
        phone: "",
        address: "",
        profileImageUrl: "",
        shopImageUrl: "",
        nicFrontUrl: "",
        nicRearUrl: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (
            !form.fullName.trim() ||
            !form.email.trim() ||
            !form.password ||
            !form.confirmPassword ||
            !form.shopName.trim() ||
            !form.specialty.trim()
        ) {
            setError("Please complete all required fields.");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                form.email.trim(),
                form.password,
            );

            const photoURL = form.profileImageUrl.trim() || null;
            await updateProfile(userCredential.user, {
                displayName: form.fullName.trim(),
                photoURL: photoURL,
            });

            // Create profile on backend
            const token = await userCredential.user.getIdToken(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            try {
                const profilePayload = {
                    specialty: form.specialty.trim() || null,
                    nic_front: form.nicFrontUrl.trim() || null,
                    nic_rear: form.nicRearUrl.trim() || null,
                };

                const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/profiles/tailor`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(profilePayload),
                    signal: controller.signal,
                });

                if (!backendRes.ok) {
                    console.warn("Backend tailor profile creation returned a non-OK status:", backendRes.status);
                } else {
                    const shopPayload = {
                        tailor_id: userCredential.user.uid,
                        shop_name: form.shopName.trim(),
                        shop_bio: null,
                        shop_address: form.address.trim() || null,
                        city: form.city.trim() || null,
                        contact_number: form.phone.trim() || null,
                        registration_number: null,
                        latitude: null,
                        longitude: null,
                        profile_picture_url: form.shopImageUrl.trim() || photoURL || null
                    };

                    const shopRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/shops/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify(shopPayload),
                        signal: controller.signal,
                    });
                    if (!shopRes.ok) console.warn("Backend shop creation returned a non-OK status:", shopRes.status);
                }
            } catch (err) {
                if (err instanceof Error && err.name !== "AbortError") console.error("Error sending profile/shop to backend:", err);
            } finally {
                clearTimeout(timeoutId);
            }

            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: form.fullName.trim(),
                photoURL: photoURL,
                role: "tailor",
                createdAt: userCredential.user.metadata.creationTime,
                shopName: form.shopName.trim(),
                specialty: form.specialty.trim() || null,
                city: form.city.trim() || null,
                phone: form.phone.trim() || null,
                address: form.address.trim() || null,
                updatedAt: serverTimestamp(),
            });

            await setRole("tailor");
            router.replace("/tailor/dashboard");
        } catch (err: unknown) {
            console.error("Tailor registration failed:", err);

            const errorCode = err instanceof FirebaseError ? err.code : "";
            switch (errorCode) {
                case "auth/email-already-in-use":
                    setError("An account with this email already exists.");
                    break;
                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;
                default:
                    setError(
                        "Unable to create your account. Please try again.",
                    );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                <div className="text-center mb-8">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        Tailor
                    </span>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        Create tailor account
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Set up your tailor profile and shop.
                    </p>
                </div>

                {error && (
                    <div
                        aria-live="polite"
                        className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="tailor-name"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Full name
                        </label>
                        <input
                            id="tailor-name"
                            type="text"
                            value={form.fullName}
                            onChange={(e) =>
                                handleChange("fullName", e.target.value)
                            }
                            placeholder="Your full name"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="tailor-email"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Email
                        </label>
                        <input
                            id="tailor-email"
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                handleChange("email", e.target.value)
                            }
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="shop-name"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Shop name
                        </label>
                        <input
                            id="shop-name"
                            type="text"
                            value={form.shopName}
                            onChange={(e) =>
                                handleChange("shopName", e.target.value)
                            }
                            placeholder="Your shop name"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="specialty"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Specialty
                        </label>
                        <input
                            id="specialty"
                            type="text"
                            value={form.specialty}
                            onChange={(e) =>
                                handleChange("specialty", e.target.value)
                            }
                            placeholder="Bridal wear, tailoring, alterations..."
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="tailor-city"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            City
                        </label>
                        <input
                            id="tailor-city"
                            type="text"
                            value={form.city}
                            onChange={(e) =>
                                handleChange("city", e.target.value)
                            }
                            placeholder="Colombo"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="tailor-phone"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Phone number
                        </label>
                        <input
                            id="tailor-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) =>
                                handleChange("phone", e.target.value)
                            }
                            placeholder="+94 77 123 4567"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="tailor-address"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Shop Address
                        </label>
                        <input
                            id="tailor-address"
                            type="text"
                            value={form.address}
                            onChange={(e) =>
                                handleChange("address", e.target.value)
                            }
                            placeholder="45 Temple Street"
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Profile Picture (Placeholder)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                        handleChange("profileImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                    }
                                }}
                                disabled={loading}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {form.profileImageUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Shop Picture (Placeholder)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                        handleChange("shopImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                    }
                                }}
                                disabled={loading}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {form.shopImageUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            NIC Front (Placeholder)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                        handleChange("nicFrontUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                    }
                                }}
                                disabled={loading}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {form.nicFrontUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            NIC Rear (Placeholder)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                        handleChange("nicRearUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
                                    }
                                }}
                                disabled={loading}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {form.nicRearUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="tailor-password"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="tailor-password"
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                                handleChange("password", e.target.value)
                            }
                            placeholder="Create a password"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="tailor-confirm-password"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Confirm password
                        </label>
                        <input
                            id="tailor-confirm-password"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) =>
                                handleChange("confirmPassword", e.target.value)
                            }
                            placeholder="Re-enter your password"
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Continue"}
                    </button>
                </form>

                <div className="mt-7 text-center">
                    <p className="text-sm text-slate-500">
                        Changed your mind?{" "}
                        <button
                            type="button"
                            onClick={() =>
                                onBack ? onBack() : router.push("/register")
                            }
                            className="font-medium text-slate-900 hover:underline"
                        >
                            Back
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
