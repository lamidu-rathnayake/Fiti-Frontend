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
        <div className="w-full max-w-md mx-auto my-8 relative z-10">
            <div className="bg-[#141414] border border-zinc-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                {/* Subtle gold glow behind card content */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[50px] bg-[#F6CA57]/20 blur-[60px] pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <span className="inline-flex rounded-full bg-[#0D0D0D] border border-[#F6CA57]/30 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F6CA57]">
                        Client
                    </span>
                    <h1 className="mt-6 text-2xl font-semibold tracking-wide text-zinc-100">
                        Create Client Account
                    </h1>
                    <p className="text-sm text-zinc-500 mt-2">
                        Start your journey as a client
                    </p>
                </div>

                {error && (
                    <div aria-live="polite" role="alert" className="mb-6 relative z-10 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10" noValidate>
                    <div>
                        <label htmlFor="client-name" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Full Name</label>
                        <input
                            id="client-name" type="text" value={form.fullName}
                            onChange={(e) => handleChange("fullName", e.target.value)}
                            placeholder="Your full name" required disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-email" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Email Address</label>
                        <input
                            id="client-email" type="email" value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="you@example.com" required disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-phone" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Phone Number <span className="text-zinc-600 font-medium">(optional)</span></label>
                        <input
                            id="client-phone" type="tel" value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+94 77 123 4567" disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-city" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">City</label>
                        <input
                            id="client-city" type="text" value={form.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder="Colombo" required disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-address" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Address <span className="text-zinc-600 font-medium">(optional)</span></label>
                        <input
                            id="client-address" type="text" value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="45 Temple Street" disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Location <span className="text-zinc-600 font-medium">(optional)</span></label>
                        <p className="text-xs text-zinc-500 mb-3">Drag the pin to your location.</p>
                        <div className="rounded-xl overflow-hidden border border-zinc-800">
                            <LocationPicker onChange={(loc: { lat: number; lng: number }) => setForm((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng }))} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="client-profile-image" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">
                            Profile Picture <span className="text-zinc-600 font-medium">(optional)</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                id="client-profile-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => { if (e.target.files?.[0]) setProfileImageFile(e.target.files[0]); }}
                                disabled={loading}
                                className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                            />
                            {profileImageFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="client-password" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Password</label>
                        <input
                            id="client-password" type="password" value={form.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Create a password (min. 6 characters)" required disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="client-confirm-password" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Confirm Password</label>
                        <input
                            id="client-confirm-password" type="password" value={form.confirmPassword}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            placeholder="Re-enter your password" required disabled={loading}
                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-[#F6CA57] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(246,202,87,0.2)] transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(246,202,87,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 mt-6"
                    >
                        {loading ? "Creating Account…" : "Create Account"}
                    </button>
                </form>

                <div className="mt-8 text-center relative z-10">
                    <p className="text-xs text-zinc-500 font-medium">
                        Changed your mind?{" "}
                        <button
                            type="button"
                            onClick={() => onBack ? onBack() : router.push("/register")}
                            className="font-bold text-[#F6CA57] hover:underline hover:text-yellow-400 ml-1"
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
        <div className="w-full max-w-md mx-auto my-8 relative z-10">
            <div className="bg-[#141414] border border-zinc-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                {/* Subtle gold glow behind card content */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[50px] bg-[#F6CA57]/20 blur-[60px] pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <span className="inline-flex rounded-full bg-[#0D0D0D] border border-[#F6CA57]/30 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F6CA57]">
                        Tailor — Step {step} of 2
                    </span>
                    <h1 className="mt-6 text-2xl font-semibold tracking-wide text-zinc-100">
                        {step === 1 ? "Create Personal Profile" : "Set Up Your Shop"}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-2">
                        {step === 1 ? "Let's start with your personal details." : "Now, tell us about your tailoring business."}
                    </p>
                </div>

                {error && (
                    <div aria-live="polite" role="alert" className="mb-6 relative z-10 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit}
                    className="space-y-5 relative z-10"
                    noValidate
                >
                    {/* ── STEP 1: PERSONAL DETAILS ─────────────────────────── */}
                    {step === 1 && (
                        <>
                            <div>
                                <label htmlFor="tailor-name" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Full Name</label>
                                <input
                                    id="tailor-name" type="text" value={form.fullName}
                                    onChange={(e) => handleChange("fullName", e.target.value)}
                                    placeholder="Your full name" required disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-email" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Email Address</label>
                                <input
                                    id="tailor-email" type="email" value={form.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    placeholder="you@example.com" required disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-phone" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Phone Number <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <input
                                    id="tailor-phone" type="tel" value={form.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    placeholder="+94 77 123 4567" disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-city" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">City <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <input
                                    id="tailor-city" type="text" value={form.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    placeholder="Colombo" disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-address" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Personal Address <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <input
                                    id="tailor-address" type="text" value={form.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    placeholder="45 Temple Street" disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Personal Location <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <p className="text-xs text-zinc-500 mb-3">Drag the pin to your home or current location.</p>
                                <div className="rounded-xl overflow-hidden border border-zinc-800">
                                    <LocationPicker onChange={(loc: { lat: number; lng: number }) => setForm((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng }))} />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="tailor-profile-image" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">
                                    Profile Picture <span className="text-zinc-600 font-medium">(optional)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="tailor-profile-image"
                                        type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setProfileImageFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                    />
                                    {profileImageFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="tailor-password" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Password</label>
                                <input
                                    id="tailor-password" type="password" value={form.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Create a password (min. 6 characters)" required disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="tailor-confirm-password" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Confirm Password</label>
                                <input
                                    id="tailor-confirm-password" type="password" value={form.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    placeholder="Re-enter your password" required disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-[#F6CA57] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(246,202,87,0.2)] transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(246,202,87,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 mt-6"
                            >
                                Continue to Shop Details &rarr;
                            </button>
                        </>
                    )}

                    {/* ── STEP 2: SHOP DETAILS ──────────────────────────────── */}
                    {step === 2 && (
                        <>
                            <div>
                                <label htmlFor="shop-name" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop Name</label>
                                <input
                                    id="shop-name" type="text" value={form.shopName}
                                    onChange={(e) => handleChange("shopName", e.target.value)}
                                    placeholder="Your shop name" required disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="specialty" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Specialty</label>
                                <input
                                    id="specialty" type="text" value={form.specialty}
                                    onChange={(e) => handleChange("specialty", e.target.value)}
                                    placeholder="Bridal wear, tailoring, alterations…" required disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="shop-bio" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop Bio <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <textarea
                                    id="shop-bio" value={form.shopBio}
                                    onChange={(e) => handleChange("shopBio", e.target.value)}
                                    placeholder="Tell us about your shop…" disabled={loading} rows={3}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="registration-number" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Registration Number <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <input
                                    id="registration-number" type="text" value={form.registrationNumber}
                                    onChange={(e) => handleChange("registrationNumber", e.target.value)}
                                    placeholder="Business Registration Number" disabled={loading}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* Shop address toggle */}
                            <div className="flex items-start gap-3 py-4 border-y border-zinc-800">
                                <input
                                    type="checkbox"
                                    id="usePersonalAddress"
                                    checked={usePersonalAddress}
                                    onChange={(e) => setUsePersonalAddress(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#F6CA57] focus:ring-[#F6CA57] focus:ring-offset-zinc-950"
                                />
                                <label htmlFor="usePersonalAddress" className="text-sm text-zinc-300 leading-snug cursor-pointer">
                                    <span className="font-semibold block mb-0.5 text-zinc-100">My shop uses my personal address</span>
                                    <span className="text-xs text-zinc-500">We&apos;ll automatically use the contact info and map location you provided in Step 1 for your shop.</span>
                                </label>
                            </div>

                            {!usePersonalAddress && (
                                <div className="space-y-5 p-5 bg-[#0D0D0D] rounded-xl border border-zinc-800 shadow-inner">
                                    <div>
                                        <label htmlFor="shop-phone" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop Phone</label>
                                        <input
                                            id="shop-phone" type="tel" value={form.shopPhone}
                                            onChange={(e) => handleChange("shopPhone", e.target.value)}
                                            placeholder="+94 77 123 4567" disabled={loading}
                                            className="w-full rounded-xl border border-zinc-800 bg-[#141414] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shop-city" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop City</label>
                                        <input
                                            id="shop-city" type="text" value={form.shopCity}
                                            onChange={(e) => handleChange("shopCity", e.target.value)}
                                            placeholder="Colombo" disabled={loading}
                                            className="w-full rounded-xl border border-zinc-800 bg-[#141414] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shop-address" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop Address</label>
                                        <input
                                            id="shop-address" type="text" value={form.shopAddress}
                                            onChange={(e) => handleChange("shopAddress", e.target.value)}
                                            placeholder="123 Market Street" disabled={loading}
                                            className="w-full rounded-xl border border-zinc-800 bg-[#141414] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop Location <span className="text-zinc-600 font-medium">(optional)</span></label>
                                        <div className="rounded-xl overflow-hidden border border-zinc-700">
                                            <LocationPicker onChange={(loc: { lat: number; lng: number }) => setForm((prev) => ({ ...prev, shopLatitude: loc.lat, shopLongitude: loc.lng }))} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="shop-image" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">Shop Picture <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="shop-image" type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setShopImageFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                    />
                                    {shopImageFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="nic-front" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">NIC / ID — Front <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="nic-front" type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setNicFrontFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                    />
                                    {nicFrontFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="nic-rear" className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase mb-2">NIC / ID — Rear <span className="text-zinc-600 font-medium">(optional)</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="nic-rear" type="file" accept="image/*"
                                        onChange={(e) => { if (e.target.files?.[0]) setNicRearFile(e.target.files[0]); }}
                                        disabled={loading}
                                        className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                    />
                                    {nicRearFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-[#F6CA57] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(246,202,87,0.2)] transition hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(246,202,87,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 mt-6"
                            >
                                {loading ? "Creating Account…" : "Complete Registration"}
                            </button>
                        </>
                    )}
                </form>

                <div className="mt-8 text-center relative z-10">
                    <p className="text-xs text-zinc-500 font-medium">
                        {step === 2 ? (
                            <>
                                Need to fix something?{" "}
                                <button type="button" onClick={() => { setError(""); setStep(1); }} className="font-bold text-[#F6CA57] hover:underline hover:text-yellow-400 ml-1">
                                    Go Back
                                </button>
                            </>
                        ) : (
                            <>
                                Changed your mind?{" "}
                                <button type="button" onClick={() => onBack ? onBack() : router.push("/register")} className="font-bold text-[#F6CA57] hover:underline hover:text-yellow-400 ml-1">
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
