"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import dynamic from "next/dynamic";

import { useAuth } from "@/lib/firebase/AuthContext";
import { auth } from "@/lib/firebase/config";
import { createClientProfile, createTailorProfile } from "@/lib/api/endpoints/profiles";
import { addShopImage, createShop } from "@/lib/api/endpoints/shops";
import { FitiApiError } from "@/lib/api/client";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">Loading map...</div>
});

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
        phone: auth.currentUser?.phoneNumber ?? "",
        city: "",
        address: "",
        shopName: "",
        specialty: "",
        profileImageUrl: auth.currentUser?.photoURL ?? "",
        shopImageUrl: "",
        nicFrontUrl: "",
        nicRearUrl: "",
        shopBio: "",
        registrationNumber: "",
        latitude: null as number | null,
        longitude: null as number | null,
        shopPhone: "",
        shopCity: "",
        shopAddress: "",
        shopLatitude: null as number | null,
        shopLongitude: null as number | null,
    });
    const [usePersonalAddress, setUsePersonalAddress] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [shopImageFile, setShopImageFile] = useState<File | null>(null);
    const [nicFrontFile, setNicFrontFile] = useState<File | null>(null);
    const [nicRearFile, setNicRearFile] = useState<File | null>(null);

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

    const updateField = (field: keyof typeof form, value: any) => {
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
            const uploadImageToCloudinary = async (file: File) => {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: formData,
                });
                if (!res.ok) throw new Error("Image upload failed");
                const data = await res.json();
                return data.secure_url;
            };

            let finalProfileImageUrl = form.profileImageUrl;
            let finalShopImageUrl = form.shopImageUrl;
            let finalNicFrontUrl = form.nicFrontUrl;
            let finalNicRearUrl = form.nicRearUrl;

            if (profileImageFile) finalProfileImageUrl = await uploadImageToCloudinary(profileImageFile);
            if (shopImageFile) finalShopImageUrl = await uploadImageToCloudinary(shopImageFile);
            if (nicFrontFile) finalNicFrontUrl = await uploadImageToCloudinary(nicFrontFile);
            if (nicRearFile) finalNicRearUrl = await uploadImageToCloudinary(nicRearFile);

            const displayName = form.displayName.trim();
            const photoURL = finalProfileImageUrl.trim() || firebaseUser.photoURL || null;
            await updateProfile(firebaseUser, { displayName, photoURL });

            // Create profile on backend (Supabase PostgreSQL via API).
            // Firebase UID is extracted from the Bearer token by the backend.
            // Business profile fields are sent in the payload — Firestore is no longer used.
            await firebaseUser.getIdToken(true); // Force refresh to include new photoURL

            try {
                if (role === "tailor") {
                    await createTailorProfile({
                        phone: form.phone.trim() || null,
                        city: form.city.trim() || null,
                        address: form.address.trim() || null,
                        nic_front: finalNicFrontUrl.trim() || null,
                        nic_rear: finalNicRearUrl.trim() || null,
                        latitude: form.latitude || null,
                        longitude: form.longitude || null,
                    });
                } else {
                    await createClientProfile({
                        phone: form.phone.trim() || null,
                        city: form.city.trim() || null,
                        address: form.address.trim() || null,
                        latitude: form.latitude || null,
                        longitude: form.longitude || null,
                    });
                }
            } catch (err) {
                if (!(err instanceof FitiApiError && err.status === 409)) throw err;
            }

            if (role === "tailor") {
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

                const shopImageUrl = finalShopImageUrl.trim() || photoURL;
                if (shopImageUrl) {
                    await addShopImage(shop.shop_id, { image_url: shopImageUrl });
                }
            }

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
            <main className="flex min-h-screen items-center justify-center bg-[#0D0D0D] p-4 text-sm text-[#F6CA57] font-bold tracking-widest uppercase">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#F6CA57]/30 border-t-[#F6CA57] rounded-full animate-spin"></div>
                    Preparing your profile...
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* Top logo needed */}


            {/* MAIN CONTENT AREA WITH 2-COLUMN SPLIT */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#F5CA53]/10 blur-[160px] rounded-full pointer-events-none" />

                <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* LEFT COLUMN: CRAFTSMANSHIP & RIGOR */}
                    <div className="lg:col-span-5 bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-xl min-h-[500px]">
                        <div className="absolute top-0 left-0 w-48 h-32 bg-[#F5CA53]/10 blur-3xl pointer-events-none" />

                        <div>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E5C158] mb-4 block">
                                Craftsmanship &amp; Rigor
                            </span>
                            <h1 className="mb-4">
                                <span className="text-3xl sm:text-4xl font-light text-white block mb-1">
                                    The Standard of
                                </span>
                                <span className="text-3xl sm:text-4xl font-extrabold text-[#F5D061] tracking-tight block">
                                    Bespoke Living.
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
                                Join an exclusive ecosystem where high-performance tailoring meets elite physical discipline. Your measurements, your progress, your FITI.
                            </p>
                        </div>

                        {/* Lower Master Tailor Image Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-black/40 h-56 mt-8 group cursor-pointer shadow-lg">
                            <img
                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
                                alt="Bespoke Master Tailor"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                            <div className="relative z-20 h-full p-5 flex flex-col justify-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-1 block">
                                    Elite Status
                                </span>
                                <p className="text-xs font-bold text-white tracking-wide">
                                    Over 2,500 active members in Colombo &amp; Kandy.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: CREATE PROFILE FORM */}
                    <div className="lg:col-span-7 bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
                        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-20 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                        <div>
                            <div className="mb-6 border-b border-zinc-800/80 pb-4">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                    Create Profile
                                </h2>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Enter your details for a truly bespoke experience.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6 rounded-3xl border border-zinc-800 bg-[#141414] p-6 shadow-2xl sm:p-8 relative overflow-hidden"
                            >
                                {/* Subtle gold glow behind card content */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[50px] bg-[#F6CA57]/20 blur-[60px] pointer-events-none"></div>

                                {error && (
                                    <div
                                        aria-live="polite"
                                        className="relative z-10 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center"
                                    >
                                        {error}
                                    </div>
                                )}

                                <fieldset className="relative z-10">
                                    <legend className="mb-4 text-[10px] font-black tracking-[0.2em] text-[#F5CA53] uppercase text-center w-full">
                                        Account Type
                                    </legend>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* CLIENT CARD */}
                                        <button
                                            type="button"
                                            aria-pressed={role === "client"}
                                            onClick={() => setSelectedRole("client")}
                                            disabled={submitting}
                                            className={`group text-left rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${role === "client"
                                                    ? "border-[#F5CA53] bg-[#F5CA53]/10 shadow-[0_0_20px_rgba(245,202,83,0.15)] scale-[1.02]"
                                                    : "border-zinc-800 bg-[#0D0D0D] hover:border-zinc-700 hover:bg-[#16171C]"
                                                }`}
                                        >
                                            <div>
                                                <div className="w-10 h-10 rounded-full border border-[#F5CA53]/40 bg-[#F5CA53]/10 flex items-center justify-center text-[#F5CA53] mb-4">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-extrabold text-white mb-1">
                                                    Register as a Client
                                                </p>
                                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                                    Discover elite tailoring, curated fabrics, and personalized fits.
                                                </p>
                                            </div>
                                            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#F5CA53] flex items-center gap-1">
                                                <span>{role === "client" ? "SELECTED ✓" : "SELECT CLIENT →"}</span>
                                            </div>
                                        </button>

                                        {/* SELLER / TAILOR CARD */}
                                        <button
                                            type="button"
                                            aria-pressed={role === "tailor"}
                                            onClick={() => setSelectedRole("tailor")}
                                            disabled={submitting}
                                            className={`group text-left rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${role === "tailor"
                                                    ? "border-[#F5CA53] bg-[#F5CA53]/10 shadow-[0_0_20px_rgba(245,202,83,0.15)] scale-[1.02]"
                                                    : "border-zinc-800 bg-[#0D0D0D] hover:border-zinc-700 hover:bg-[#16171C]"
                                                }`}
                                        >
                                            <div>
                                                <div className="w-10 h-10 rounded-full border border-[#F5CA53]/40 bg-[#F5CA53]/10 flex items-center justify-center text-[#F5CA53] mb-4">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-extrabold text-white mb-1">
                                                    Register as a Seller
                                                </p>
                                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                                    Join our artisan network and showcase your craftsmanship.
                                                </p>
                                            </div>
                                            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#F5CA53] flex items-center gap-1">
                                                <span>{role === "tailor" ? "SELECTED ✓" : "SELECT SELLER →"}</span>
                                            </div>
                                        </button>
                                    </div>
                                </fieldset>

                                <div className="grid gap-6 sm:grid-cols-2 relative z-10 mt-8 pt-8 border-t border-zinc-800">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                            Full Name
                                        </label>
                                        <input
                                            value={form.displayName}
                                            onChange={(event) => updateField("displayName", event.target.value)}
                                            required
                                            disabled={submitting}
                                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(event) => updateField("phone", event.target.value)}
                                            disabled={submitting}
                                            placeholder="+94 77 123 4567"
                                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                            City
                                        </label>
                                        <input
                                            value={form.city}
                                            onChange={(event) => updateField("city", event.target.value)}
                                            required
                                            disabled={submitting}
                                            placeholder="Colombo"
                                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                            Address
                                        </label>
                                        <input
                                            value={form.address}
                                            onChange={(event) => updateField("address", event.target.value)}
                                            disabled={submitting}
                                            placeholder="45 Temple Street"
                                            className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                            Personal Location <span className="text-zinc-600 font-medium">(optional)</span>
                                        </label>
                                        <p className="text-xs text-zinc-500 mb-3">Drag the pin to your home or current location.</p>
                                        <div className="rounded-xl overflow-hidden border border-zinc-800">
                                            <LocationPicker onChange={(loc: { lat: number, lng: number }) => { setForm(current => ({ ...current, latitude: loc.lat, longitude: loc.lng })); }} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                            Profile Picture <span className="text-zinc-600 font-medium">(optional)</span>
                                        </label>
                                        <div className="flex items-center gap-3 mt-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => {
                                                    if (event.target.files?.[0]) {
                                                        setProfileImageFile(event.target.files[0]);
                                                    }
                                                }}
                                                disabled={submitting}
                                                className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                            />
                                            {profileImageFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                        </div>
                                    </div>
                                </div>

                                {role === "tailor" && (
                                    <div className="grid gap-6 border-t border-zinc-800 pt-8 mt-8 sm:grid-cols-2 relative z-10">
                                        <div className="col-span-1 sm:col-span-2 text-center mb-2">
                                            <span className="inline-flex rounded-full bg-[#0D0D0D] border border-zinc-700 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                Shop Details
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                Shop Name
                                            </label>
                                            <input
                                                value={form.shopName}
                                                onChange={(event) => updateField("shopName", event.target.value)}
                                                required
                                                disabled={submitting}
                                                placeholder="Your shop name"
                                                className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                Specialty
                                            </label>
                                            <input
                                                value={form.specialty}
                                                onChange={(event) => updateField("specialty", event.target.value)}
                                                required
                                                disabled={submitting}
                                                placeholder="Bridal wear, tailoring..."
                                                className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                Shop Bio <span className="text-zinc-600 font-medium">(optional)</span>
                                            </label>
                                            <textarea
                                                value={form.shopBio}
                                                onChange={(event) => updateField("shopBio", event.target.value)}
                                                placeholder="Tell us about your shop..."
                                                disabled={submitting}
                                                rows={3}
                                                className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                Registration Number <span className="text-zinc-600 font-medium">(optional)</span>
                                            </label>
                                            <input
                                                value={form.registrationNumber}
                                                onChange={(event) => updateField("registrationNumber", event.target.value)}
                                                placeholder="Business Registration Number"
                                                disabled={submitting}
                                                className="w-full rounded-xl border border-zinc-800 bg-[#0D0D0D] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="col-span-1 sm:col-span-2">
                                            <div className="flex items-start gap-3 py-4 border-y border-zinc-800 my-4">
                                                <input
                                                    type="checkbox"
                                                    id="usePersonalAddress"
                                                    checked={usePersonalAddress}
                                                    onChange={(e) => setUsePersonalAddress(e.target.checked)}
                                                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#F6CA57] focus:ring-[#F6CA57] focus:ring-offset-zinc-950"
                                                />
                                                <label htmlFor="usePersonalAddress" className="text-sm text-zinc-300 leading-snug cursor-pointer">
                                                    <span className="font-semibold block mb-0.5 text-zinc-100">My shop uses my personal address</span>
                                                    <span className="text-xs text-zinc-500">We'll automatically use the contact info and map location you provided above for your shop.</span>
                                                </label>
                                            </div>
                                        </div>

                                        {!usePersonalAddress && (
                                            <div className="col-span-1 sm:col-span-2 grid gap-6 sm:grid-cols-2 p-5 bg-[#0D0D0D] rounded-xl border border-zinc-800 shadow-inner">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                        Shop Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={form.shopPhone}
                                                        onChange={(event) => updateField("shopPhone", event.target.value)}
                                                        placeholder="+94 77 123 4567"
                                                        disabled={submitting}
                                                        className="w-full rounded-xl border border-zinc-800 bg-[#141414] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                        Shop City
                                                    </label>
                                                    <input
                                                        value={form.shopCity}
                                                        onChange={(event) => updateField("shopCity", event.target.value)}
                                                        placeholder="Colombo"
                                                        disabled={submitting}
                                                        className="w-full rounded-xl border border-zinc-800 bg-[#141414] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="space-y-2 sm:col-span-2">
                                                    <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                        Shop Address
                                                    </label>
                                                    <input
                                                        value={form.shopAddress}
                                                        onChange={(event) => updateField("shopAddress", event.target.value)}
                                                        placeholder="123 Market Street"
                                                        disabled={submitting}
                                                        className="w-full rounded-xl border border-zinc-800 bg-[#141414] px-4 py-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-[#F6CA57] focus:ring-1 focus:ring-[#F6CA57] disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="space-y-2 sm:col-span-2">
                                                    <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                        Shop Location <span className="text-zinc-600 font-medium">(optional)</span>
                                                    </label>
                                                    <div className="rounded-xl overflow-hidden border border-zinc-700">
                                                        <LocationPicker onChange={(loc: { lat: number, lng: number }) => { setForm(current => ({ ...current, shopLatitude: loc.lat, shopLongitude: loc.lng })); }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                Shop Picture <span className="text-zinc-600 font-medium">(optional)</span>
                                            </label>
                                            <div className="mt-2 flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        if (event.target.files?.[0]) {
                                                            setShopImageFile(event.target.files[0]);
                                                        }
                                                    }}
                                                    disabled={submitting}
                                                    className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                                />
                                                {shopImageFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                NIC Front <span className="text-zinc-600 font-medium">(optional)</span>
                                            </label>
                                            <div className="mt-2 flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        if (event.target.files?.[0]) {
                                                            setNicFrontFile(event.target.files[0]);
                                                        }
                                                    }}
                                                    disabled={submitting}
                                                    className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                                />
                                                {nicFrontFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-widest text-[#F6CA57] uppercase">
                                                NIC Rear <span className="text-zinc-600 font-medium">(optional)</span>
                                            </label>
                                            <div className="mt-2 flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        if (event.target.files?.[0]) {
                                                            setNicRearFile(event.target.files[0]);
                                                        }
                                                    }}
                                                    disabled={submitting}
                                                    className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-[10px] file:font-bold file:tracking-widest file:text-[#F6CA57] file:uppercase hover:file:bg-zinc-700 transition-colors"
                                                />
                                                {nicRearFile && <span className="text-xs text-[#F6CA57] font-bold whitespace-nowrap">Selected ✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-8 mt-8 sm:flex-row sm:justify-between relative z-10">
                                    <button
                                        type="button"
                                        onClick={handleUseAnotherAccount}
                                        disabled={submitting}
                                        className="rounded-xl border border-zinc-700 px-6 py-3 text-xs font-bold tracking-widest uppercase text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-300 disabled:opacity-50 transition-colors"
                                    >
                                        Use Another Account
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-[#F6CA57] px-8 py-3 text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(246,202,87,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(246,202,87,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {submitting ? "Saving Profile..." : "Register"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-7 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>
                    <div className="flex items-center space-x-6 text-xs text-zinc-400">
                        <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="/contact" className="hover:text-white transition-colors">Contact Us</a>
                        <a href="/about" className="hover:text-white transition-colors">About Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
