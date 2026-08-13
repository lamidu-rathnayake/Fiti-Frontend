"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { auth } from "@/lib/firebase/client";

export function ClientRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        city: "",
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

            await updateProfile(userCredential.user, {
                displayName: form.fullName.trim(),
            });

            router.replace("/admin");
        } catch (err: any) {
            console.error("Client registration failed:", err);

            switch (err.code) {
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
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        shopName: "",
        specialty: "",
        city: "",
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

            await updateProfile(userCredential.user, {
                displayName: form.fullName.trim(),
            });

            router.replace("/login");
        } catch (err: any) {
            console.error("Tailor registration failed:", err);

            switch (err.code) {
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
