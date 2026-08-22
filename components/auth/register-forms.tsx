"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/AuthContext";

import { createClientProfile, createTailorProfile } from "@/lib/api/endpoints/profiles";
import { addShopImage, createShop } from "@/lib/api/endpoints/shops";
import { FitiApiError } from "@/lib/api/client";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">Loading map...</div>
});

/** Map Firebase auth error codes to human-friendly messages. */
function firebaseRegisterError(err: unknown): string {
    if (!(err instanceof FirebaseError)) {
        return "Unable to create your account. Please try again.";
    }
    switch (err.code) {
        case "auth/email-already-in-use":
            return "An account with this email already exists. Try signing in instead.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/weak-password":
            return "Password must be at least 6 characters long.";
        case "auth/network-request-failed":
            return "Network error. Check your connection and try again.";
        default:
            return "Unable to create your account. Please try again.";
    }
}

// ── Client Registration Form ───────────────────────────────────────────────

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
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword || !form.city.trim()) {
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
            // 1. Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                form.email.trim(),
                form.password,
            );

            // 2. Upload profile image to Cloudinary (if provided)
            let photoURL: string | null = null;
            if (profileImageFile) {
                try {
                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
                    if (cloudName && uploadPreset) {
                        const fd = new FormData();
                        fd.append("file", profileImageFile);
                        fd.append("upload_preset", uploadPreset);
                        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
                        if (res.ok) {
                            const data = await res.json();
                            photoURL = data.secure_url ?? null;
                        }
                    }
                } catch {
                    // Image upload failure is non-fatal — continue without it
                }
            }

            // 3. Update Firebase profile with displayName and photoURL
            await updateProfile(userCredential.user, {
                displayName: form.fullName.trim(),
                photoURL,
            });

            // 4. Force-refresh token so backend receives updated claims
            await userCredential.user.getIdToken(true);

            // 5. Create profile on backend (writes clients + user_roles tables)
            try {
                await createClientProfile({
                    phone: form.phone.trim() || null,
                    city: form.city.trim() || null,
                    address: form.address.trim() || null,
                    latitude: form.latitude,
                    longitude: form.longitude,
                });
            } catch (err) {
                // 409 = profile already exists — safe to ignore
                if (!(err instanceof FitiApiError && err.status === 409)) throw err;
            }

            // 6. Update local auth state and redirect
            setRole("client");
            router.replace("/client/home");
        } catch (err: unknown) {
            console.error("Client registration failed:", err);
            setError(firebaseRegisterError(err));
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
                    <div aria-live="polite" role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div>
                        <label htmlFor="client-name" className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                        <input
                            id="client-name" type="text" value={form.fullName}
                            onChange={(e) => handleChange("fullName", e.target.value)}
                            placeholder="Your full name" required disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            id="client-email" type="email" value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="you@example.com" required disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone number <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            id="client-phone" type="tel" value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+94 77 123 4567" disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-city" className="block text-sm font-medium text-slate-700 mb-2">City</label>
                        <input
                            id="client-city" type="text" value={form.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder="Colombo" required disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-address" className="block text-sm font-medium text-slate-700 mb-2">Address <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            id="client-address" type="text" value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="45 Temple Street" disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location <span className="text-slate-400 font-normal">(optional)</span></label>
                        <p className="text-xs text-slate-500 mb-3">Drag the pin to your location.</p>
                        <LocationPicker onChange={(loc: { lat: number; lng: number }) => setForm((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng }))} />
                    </div>

                    <div>
                        <label htmlFor="client-profile-image" className="block text-sm font-medium text-slate-700 mb-2">
                            Profile picture <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                id="client-profile-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => { if (e.target.files?.[0]) setProfileImageFile(e.target.files[0]); }}
                                disabled={loading}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {profileImageFile && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="client-password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <input
                            id="client-password" type="password" value={form.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Create a password (min. 6 characters)" required disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-confirm-password" className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                        <input
                            id="client-confirm-password" type="password" value={form.confirmPassword}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            placeholder="Re-enter your password" required disabled={loading}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>

                <div className="mt-7 text-center">
                    <p className="text-sm text-slate-500">
                        Changed your mind?{" "}
                        <button
                            type="button"
                            onClick={() => onBack ? onBack() : router.push("/register")}
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

// ── Tailor Registration Form ───────────────────────────────────────────────

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
        shopPhone: "",
        shopCity: "",
        shopAddress: "",
        shopLatitude: null as number | null,
        shopLongitude: null as number | null,
    });
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [shopImageFile, setShopImageFile] = useState<File | null>(null);
    const [nicFrontFile, setNicFrontFile] = useState<File | null>(null);
    const [nicRearFile, setNicRearFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1);
    const [usePersonalAddress, setUsePersonalAddress] = useState(true);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => {
        if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
            setError("Please complete all required personal profile fields.");
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

    /** Upload a file to Cloudinary. Returns URL or null on failure. */
    const uploadToCloudinary = async (file: File): Promise<string | null> => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) return null;
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("upload_preset", uploadPreset);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
            if (!res.ok) return null;
            const data = await res.json();
            return data.secure_url ?? null;
        } catch {
            return null;
        }
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
            // 1. Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                form.email.trim(),
                form.password,
            );

            // 2. Upload images (non-fatal — silently skip failures)
            const [photoURL, shopImageUrl, nicFrontUrl, nicRearUrl] = await Promise.all([
                profileImageFile ? uploadToCloudinary(profileImageFile) : Promise.resolve(null),
                shopImageFile ? uploadToCloudinary(shopImageFile) : Promise.resolve(null),
                nicFrontFile ? uploadToCloudinary(nicFrontFile) : Promise.resolve(null),
                nicRearFile ? uploadToCloudinary(nicRearFile) : Promise.resolve(null),
            ]);

            // 3. Update Firebase profile
            await updateProfile(userCredential.user, {
                displayName: form.fullName.trim(),
                photoURL,
            });

            // 4. Force-refresh token so backend gets updated claims
            await userCredential.user.getIdToken(true);

            // 5. Create tailor profile (writes tailors + user_roles tables)
            try {
                await createTailorProfile({
                    phone: form.phone.trim() || null,
                    city: form.city.trim() || null,
                    address: form.address.trim() || null,
                    latitude: form.latitude,
                    longitude: form.longitude,
                    nic_front: nicFrontUrl,
                    nic_rear: nicRearUrl,
                });
            } catch (err) {
                // 409 = profile already exists — safe to ignore
                if (!(err instanceof FitiApiError && err.status === 409)) throw err;
            }

            // 6. Create shop
            const shop = await createShop({
                shop_name: form.shopName.trim(),
                specialty: form.specialty.trim() || null,
                shop_bio: form.shopBio.trim() || null,
                shop_address: usePersonalAddress ? (form.address.trim() || null) : (form.shopAddress.trim() || null),
                city: usePersonalAddress ? (form.city.trim() || null) : (form.shopCity.trim() || null),
                contact_number: usePersonalAddress ? (form.phone.trim() || null) : (form.shopPhone.trim() || null),
                registration_number: form.registrationNumber.trim() || null,
                latitude: usePersonalAddress ? form.latitude : form.shopLatitude,
                longitude: usePersonalAddress ? form.longitude : form.shopLongitude,
            });

            // 7. Add shop image if one is available
            const resolvedShopImage = shopImageUrl || photoURL;
            if (resolvedShopImage) {
                await addShopImage(shop.shop_id, { image_url: resolvedShopImage });
            }

            // 8. Update local auth state and redirect
            setRole("tailor");
            router.replace("/tailor/home");
        } catch (err: unknown) {
            console.error("Tailor registration failed:", err);
            setError(firebaseRegisterError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                <div className="text-center mb-8">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        Tailor — Step {step} of 2
                    </span>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        {step === 1 ? "Create personal profile" : "Set up your shop"}
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        {step === 1 ? "Let's start with your personal details." : "Now, tell us about your tailoring business."}
                    </p>
                </div>

                {error && (
                    <div aria-live="polite" role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit}
                    className="space-y-5"
                    noValidate
                >
                    {/* ── STEP 1: PERSONAL DETAILS ─────────────────────────── */}
                    {step === 1 && (
                        <>
                            <div>
                                <label htmlFor="tailor-name" className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                                <input
                                    id="tailor-name" type="text" value={form.fullName}
                                    onChange={(e) => handleChange("fullName", e.target.value)}
                                    placeholder="Your full name" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    id="tailor-email" type="email" value={form.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    placeholder="you@example.com" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-phone" className="block text-sm font-medium text-slate-700 mb-2">Phone number <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                    id="tailor-phone" type="tel" value={form.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    placeholder="+94 77 123 4567" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-city" className="block text-sm font-medium text-slate-700 mb-2">City <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                    id="tailor-city" type="text" value={form.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    placeholder="Colombo" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-address" className="block text-sm font-medium text-slate-700 mb-2">Personal address <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                    id="tailor-address" type="text" value={form.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    placeholder="45 Temple Street" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Personal location <span className="text-slate-400 font-normal">(optional)</span></label>
                                <p className="text-xs text-slate-500 mb-3">Drag the pin to your home or current location.</p>
                                <LocationPicker onChange={(loc: { lat: number; lng: number }) => setForm((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng }))} />
                            </div>

                            <div>
                                <label htmlFor="tailor-profile-image" className="block text-sm font-medium text-slate-700 mb-2">
                                    Profile picture <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="tailor-profile-image"
                                        type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setProfileImageFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {profileImageFile && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="tailor-password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <input
                                    id="tailor-password" type="password" value={form.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Create a password (min. 6 characters)" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-confirm-password" className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                                <input
                                    id="tailor-confirm-password" type="password" value={form.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    placeholder="Re-enter your password" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black"
                            >
                                Continue to Shop Details →
                            </button>
                        </>
                    )}

                    {/* ── STEP 2: SHOP DETAILS ──────────────────────────────── */}
                    {step === 2 && (
                        <>
                            <div>
                                <label htmlFor="shop-name" className="block text-sm font-medium text-slate-700 mb-2">Shop name</label>
                                <input
                                    id="shop-name" type="text" value={form.shopName}
                                    onChange={(e) => handleChange("shopName", e.target.value)}
                                    placeholder="Your shop name" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="specialty" className="block text-sm font-medium text-slate-700 mb-2">Specialty</label>
                                <input
                                    id="specialty" type="text" value={form.specialty}
                                    onChange={(e) => handleChange("specialty", e.target.value)}
                                    placeholder="Bridal wear, tailoring, alterations…" required disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="shop-bio" className="block text-sm font-medium text-slate-700 mb-2">Shop bio <span className="text-slate-400 font-normal">(optional)</span></label>
                                <textarea
                                    id="shop-bio" value={form.shopBio}
                                    onChange={(e) => handleChange("shopBio", e.target.value)}
                                    placeholder="Tell us about your shop…" disabled={loading} rows={3}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 resize-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="registration-number" className="block text-sm font-medium text-slate-700 mb-2">Registration number <span className="text-slate-400 font-normal">(optional)</span></label>
                                <input
                                    id="registration-number" type="text" value={form.registrationNumber}
                                    onChange={(e) => handleChange("registrationNumber", e.target.value)}
                                    placeholder="Business Registration Number" disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            {/* Shop address toggle */}
                            <div className="flex items-start gap-3 py-3 border-y border-slate-100">
                                <input
                                    type="checkbox"
                                    id="usePersonalAddress"
                                    checked={usePersonalAddress}
                                    onChange={(e) => setUsePersonalAddress(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <label htmlFor="usePersonalAddress" className="text-sm text-slate-700 leading-snug cursor-pointer">
                                    <span className="font-medium block mb-0.5">My shop uses my personal address</span>
                                    We&apos;ll automatically use the contact info and map location you provided in Step 1 for your shop.
                                </label>
                            </div>

                            {!usePersonalAddress && (
                                <div className="space-y-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <label htmlFor="shop-phone" className="block text-sm font-medium text-slate-700 mb-2">Shop phone</label>
                                        <input
                                            id="shop-phone" type="tel" value={form.shopPhone}
                                            onChange={(e) => handleChange("shopPhone", e.target.value)}
                                            placeholder="+94 77 123 4567" disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shop-city" className="block text-sm font-medium text-slate-700 mb-2">Shop city</label>
                                        <input
                                            id="shop-city" type="text" value={form.shopCity}
                                            onChange={(e) => handleChange("shopCity", e.target.value)}
                                            placeholder="Colombo" disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shop-address" className="block text-sm font-medium text-slate-700 mb-2">Shop address</label>
                                        <input
                                            id="shop-address" type="text" value={form.shopAddress}
                                            onChange={(e) => handleChange("shopAddress", e.target.value)}
                                            placeholder="123 Market Street" disabled={loading}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Shop location <span className="text-slate-400 font-normal">(optional)</span></label>
                                        <LocationPicker onChange={(loc: { lat: number; lng: number }) => setForm((prev) => ({ ...prev, shopLatitude: loc.lat, shopLongitude: loc.lng }))} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="shop-image" className="block text-sm font-medium text-slate-700 mb-2">Shop picture <span className="text-slate-400 font-normal">(optional)</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="shop-image" type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setShopImageFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {shopImageFile && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="nic-front" className="block text-sm font-medium text-slate-700 mb-2">NIC / ID — front <span className="text-slate-400 font-normal">(optional)</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="nic-front" type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setNicFrontFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {nicFrontFile && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="nic-rear" className="block text-sm font-medium text-slate-700 mb-2">NIC / ID — rear <span className="text-slate-400 font-normal">(optional)</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="nic-rear" type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setNicRearFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {nicRearFile && <span className="text-xs text-green-600 font-medium whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Creating account…" : "Complete Registration"}
                            </button>
                        </>
                    )}
                </form>

                <div className="mt-7 text-center">
                    <p className="text-sm text-slate-500">
                        {step === 2 ? (
                            <>
                                Need to fix something?{" "}
                                <button type="button" onClick={() => { setError(""); setStep(1); }} className="font-medium text-slate-900 hover:underline">
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
