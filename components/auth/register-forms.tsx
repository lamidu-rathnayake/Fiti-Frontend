"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/AuthContext";
import { saveUserProfile } from "@/lib/firebase/user-profile";

import { createClientProfile, createTailorProfile } from "@/lib/api/endpoints/profiles";
import { addShopImage, createShop } from "@/lib/api/endpoints/shops";
import { FitiApiError } from "@/lib/api/client";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">Loading map...</div>
});

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
            !form.confirmPassword ||
            !form.city.trim()
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

            try {
                await createClientProfile();
            } catch (err) {
                if (!(err instanceof FitiApiError && err.status === 409)) throw err;
            }

            await saveUserProfile({
                user: userCredential.user,
                role: "client",
                displayName: form.fullName.trim(),
                photoURL,
                phone: form.phone.trim() || null,
                city: form.city.trim() || null,
                address: form.address.trim() || null,
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
                            required
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
                            placeholder="Street address"
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
        shopBio: "",
        registrationNumber: "",
        specialty: "",
        latitude: null as number | null,
        longitude: null as number | null,
        phone: "",
        city: "",
        address: "",
        profileImageUrl: "",
        shopImageUrl: "",
        nicFrontUrl: "",
        nicRearUrl: "",
        shopPhone: "",
        shopCity: "",
        shopAddress: "",
        shopLatitude: null as number | null,
        shopLongitude: null as number | null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1);
    const [usePersonalAddress, setUsePersonalAddress] = useState(true);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => {
        if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
            setError("Please complete all required fields for your personal profile.");
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
        setStep(2);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.shopName.trim() || !form.specialty.trim()) {
            setError("Please complete all required shop fields.");
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

            try {
                await createTailorProfile({
                    nic_front: form.nicFrontUrl.trim() || null,
                    nic_rear: form.nicRearUrl.trim() || null,
                });
            } catch (err) {
                if (!(err instanceof FitiApiError && err.status === 409)) throw err;
            }

            const shop = await createShop({
                shop_name: form.shopName.trim(),
                shop_bio: form.shopBio.trim() || null,
                shop_address: usePersonalAddress ? (form.address.trim() || null) : (form.shopAddress.trim() || null),
                city: usePersonalAddress ? (form.city.trim() || null) : (form.shopCity.trim() || null),
                contact_number: usePersonalAddress ? (form.phone.trim() || null) : (form.shopPhone.trim() || null),
                registration_number: form.registrationNumber.trim() || null,
                latitude: usePersonalAddress ? form.latitude : form.shopLatitude,
                longitude: usePersonalAddress ? form.longitude : form.shopLongitude,
            });

            const shopImageUrl = form.shopImageUrl.trim() || photoURL;
            if (shopImageUrl) {
                await addShopImage(shop.shop_id, { image_url: shopImageUrl });
            }

            await saveUserProfile({
                user: userCredential.user,
                role: "tailor",
                displayName: form.fullName.trim(),
                photoURL,
                phone: form.phone.trim() || null,
                city: form.city.trim() || null,
                address: form.address.trim() || null,
                specialty: form.specialty.trim(),
                latitude: form.latitude,
                longitude: form.longitude,
            });

            await setRole("tailor");
            router.replace("/tailor/home");
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
                        "Unable to create your account. Please try again."
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
                        Tailor - Step {step} of 2
                    </span>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        {step === 1 ? "Create personal profile" : "Set up your shop"}
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        {step === 1 ? "Let's start with your personal details." : "Now, tell us about your tailoring business."}
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

                <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-5">
                    
                    {/* STEP 1: PERSONAL DETAILS */}
                    {step === 1 && (
                        <>
                            <div>
                                <label htmlFor="tailor-name" className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                                <input
                                    id="tailor-name" type="text" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)}
                                    placeholder="Your full name" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    id="tailor-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                                    placeholder="you@example.com" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone number</label>
                                <input
                                    id="tailor-phone" type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)}
                                    placeholder="+94 77 123 4567" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-city" className="block text-sm font-medium text-slate-700 mb-2">City</label>
                                <input
                                    id="tailor-city" type="text" value={form.city} onChange={(e) => handleChange("city", e.target.value)}
                                    placeholder="Colombo" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-address" className="block text-sm font-medium text-slate-700 mb-2">Personal Address</label>
                                <input
                                    id="tailor-address" type="text" value={form.address} onChange={(e) => handleChange("address", e.target.value)}
                                    placeholder="45 Temple Street" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Personal Location (Optional)</label>
                                <p className="text-xs text-slate-500 mb-3">Drag the pin to your home or current location.</p>
                                <LocationPicker onChange={(loc: {lat: number, lng: number}) => setForm((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng }))} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Profile Picture (Placeholder)</label>
                                <div className="flex items-center gap-3">
                                    <input type="file" accept="image/*" onChange={(event) => { if (event.target.files?.[0]) handleChange("profileImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg"); }} disabled={loading} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
                                    {form.profileImageUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="tailor-password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <input
                                    id="tailor-password" type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Create a password" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-confirm-password" className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                                <input
                                    id="tailor-confirm-password" type="password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    placeholder="Re-enter your password" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black">
                                Continue to Shop Details
                            </button>
                        </>
                    )}

                    {/* STEP 2: SHOP DETAILS */}
                    {step === 2 && (
                        <>
                            <div>
                                <label htmlFor="shop-name" className="block text-sm font-medium text-slate-700 mb-2">Shop name</label>
                                <input
                                    id="shop-name" type="text" value={form.shopName} onChange={(e) => handleChange("shopName", e.target.value)}
                                    placeholder="Your shop name" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="specialty" className="block text-sm font-medium text-slate-700 mb-2">Specialty</label>
                                <input
                                    id="specialty" type="text" value={form.specialty} onChange={(e) => handleChange("specialty", e.target.value)}
                                    placeholder="Bridal wear, tailoring, alterations..." required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="shop-bio" className="block text-sm font-medium text-slate-700 mb-2">Shop Bio (Optional)</label>
                                <textarea
                                    id="shop-bio" value={form.shopBio} onChange={(e) => handleChange("shopBio", e.target.value)}
                                    placeholder="Tell us about your shop..." disabled={loading} rows={3}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 resize-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="registration-number" className="block text-sm font-medium text-slate-700 mb-2">Registration Number (Optional)</label>
                                <input
                                    id="registration-number" type="text" value={form.registrationNumber} onChange={(e) => handleChange("registrationNumber", e.target.value)}
                                    placeholder="Business Registration Number" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div className="flex items-start gap-3 py-3 border-y border-slate-100 my-2">
                                <input
                                    type="checkbox"
                                    id="usePersonalAddress"
                                    checked={usePersonalAddress}
                                    onChange={(e) => setUsePersonalAddress(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <label htmlFor="usePersonalAddress" className="text-sm text-slate-700 leading-snug">
                                    <span className="font-medium block mb-0.5">My shop uses my personal address</span>
                                    We'll automatically use the contact info and map location you provided in Step 1 for your shop.
                                </label>
                            </div>

                            {!usePersonalAddress && (
                                <div className="space-y-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <label htmlFor="shop-phone" className="block text-sm font-medium text-slate-700 mb-2">Shop Phone</label>
                                        <input
                                            id="shop-phone" type="tel" value={form.shopPhone} onChange={(e) => handleChange("shopPhone", e.target.value)}
                                            placeholder="+94 77 123 4567" disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shop-city" className="block text-sm font-medium text-slate-700 mb-2">Shop City</label>
                                        <input
                                            id="shop-city" type="text" value={form.shopCity} onChange={(e) => handleChange("shopCity", e.target.value)}
                                            placeholder="Colombo" disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shop-address" className="block text-sm font-medium text-slate-700 mb-2">Shop Address</label>
                                        <input
                                            id="shop-address" type="text" value={form.shopAddress} onChange={(e) => handleChange("shopAddress", e.target.value)}
                                            placeholder="123 Market Street" disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Shop Location (Optional)</label>
                                        <LocationPicker onChange={(loc: {lat: number, lng: number}) => setForm((prev) => ({ ...prev, shopLatitude: loc.lat, shopLongitude: loc.lng }))} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Shop Picture (Placeholder)</label>
                                <div className="flex items-center gap-3">
                                    <input type="file" accept="image/*" onChange={(event) => { if (event.target.files?.[0]) handleChange("shopImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg"); }} disabled={loading} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
                                    {form.shopImageUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">NIC Front (Placeholder)</label>
                                <div className="flex items-center gap-3">
                                    <input type="file" accept="image/*" onChange={(event) => { if (event.target.files?.[0]) handleChange("nicFrontUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg"); }} disabled={loading} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
                                    {form.nicFrontUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">NIC Rear (Placeholder)</label>
                                <div className="flex items-center gap-3">
                                    <input type="file" accept="image/*" onChange={(event) => { if (event.target.files?.[0]) handleChange("nicRearUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg"); }} disabled={loading} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
                                    {form.nicRearUrl && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50">
                                {loading ? "Creating account..." : "Complete Registration"}
                            </button>
                        </>
                    )}
                </form>

                <div className="mt-7 text-center">
                    <p className="text-sm text-slate-500">
                        {step === 2 ? (
                            <>
                                Need to fix something?{" "}
                                <button type="button" onClick={() => setStep(1)} className="font-medium text-slate-900 hover:underline">
                                    Go back
                                </button>
                            </>
                        ) : (
                            <>
                                Changed your mind?{" "}
                                <button type="button" onClick={() => onBack ? onBack() : router.push("/register")} className="font-medium text-slate-900 hover:underline">
                                    Cancel
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
