"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { updateProfile } from "firebase/auth";
import dynamic from "next/dynamic";

import { useAuth } from "@/lib/firebase/AuthContext";
import { auth } from "@/lib/firebase/config";
import { createClientProfile, createTailorProfile } from "@/lib/api/endpoints/profiles";
import { addShopImage, createShop } from "@/lib/api/endpoints/shops";
import { FitiApiError } from "@/lib/api/client";
import { reverseGeocode } from "@/lib/geocoding";
import Logo from "@/components/Logo";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-card-bg/20 animate-pulse rounded-xl border border-accent/30 flex items-center justify-center text-earth-text/60 font-semibold text-xs uppercase tracking-wider">Loading map...</div>
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

    const updateField = <Field extends keyof typeof form>(
        field: Field,
        value: (typeof form)[Field],
    ) => {
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

            await firebaseUser.getIdToken(true);

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
            <main className="flex min-h-screen items-center justify-center bg-cream-bg p-4 text-sm text-earth-text font-bold tracking-widest uppercase">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                    Preparing your profile...
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen relative flex flex-col justify-between overflow-hidden font-sans selection:bg-accent selection:text-cream-bg">
            {/* FULL BACKGROUND PHOTO */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/orders/navy_double_suit.jpg"
                    alt="Navy Double Suit Atelier Background"
                    fill
                    className="object-cover brightness-[0.4] scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-earth-text/20 backdrop-blur-[3px]" />
            </div>

            {/* TOP HEADER */}
            <header className="relative z-20 w-full py-5 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="group">
                        <Logo
                            width={220}
                            height={70}
                            className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
                            priority
                        />
                    </Link>

                    <button
                        type="button"
                        onClick={handleUseAnotherAccount}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-bg bg-accent hover:bg-earth-text rounded-full transition-all shadow-md cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA: CENTERED PROFILE FORM */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10">
                <div className="max-w-4xl w-full mx-auto bg-cream-bg border border-accent/40 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-xl">
                    <div>
                        <div className="mb-8 border-b border-accent/20 pb-4 text-center">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-earth-text tracking-tight uppercase">
                                Create Profile
                            </h2>
                            <p className="text-xs sm:text-sm text-earth-text/80 mt-1 font-medium">
                                Enter your details for a truly bespoke experience.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 rounded-2xl border border-accent/30 bg-card-bg/20 p-6 shadow-sm sm:p-8 relative overflow-hidden"
                        >
                            {error && (
                                <div
                                    aria-live="polite"
                                    className="relative z-10 rounded-xl border border-rose-800/40 bg-rose-100/80 px-4 py-3 text-xs font-semibold text-rose-900 text-center"
                                >
                                    {error}
                                </div>
                            )}

                            <fieldset className="relative z-10">
                                <legend className="mb-4 text-[10px] font-black tracking-[0.2em] text-earth-text uppercase text-center w-full">
                                    Account Type
                                </legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* CLIENT CARD */}
                                    <button
                                        type="button"
                                        aria-pressed={role === "client"}
                                        onClick={() => setSelectedRole("client")}
                                        disabled={submitting}
                                        className={`group text-left rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer ${role === "client"
                                            ? "border-accent bg-cream-bg shadow-md scale-[1.02]"
                                            : "border-accent/40 bg-card-bg/30 hover:border-accent hover:bg-card-bg/40"
                                            }`}
                                    >
                                        <div>
                                            <div className="w-10 h-10 rounded-full border border-accent/40 bg-cream-bg flex items-center justify-center text-accent mb-4 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-extrabold text-earth-text mb-1">
                                                Register as a Client
                                            </p>
                                            <p className="text-[11px] text-earth-text/80 leading-relaxed font-medium">
                                                Discover elite tailoring, curated fabrics, and personalized fits.
                                            </p>
                                        </div>
                                        <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1">
                                            <span>{role === "client" ? "SELECTED ✓" : "SELECT CLIENT →"}</span>
                                        </div>
                                    </button>

                                    {/* TAILOR CARD */}
                                    <button
                                        type="button"
                                        aria-pressed={role === "tailor"}
                                        onClick={() => setSelectedRole("tailor")}
                                        disabled={submitting}
                                        className={`group text-left rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer ${role === "tailor"
                                            ? "border-accent bg-cream-bg shadow-md scale-[1.02]"
                                            : "border-accent/40 bg-card-bg/30 hover:border-accent hover:bg-card-bg/40"
                                            }`}
                                    >
                                        <div>
                                            <div className="w-10 h-10 rounded-full border border-accent/40 bg-cream-bg flex items-center justify-center text-accent mb-4 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-extrabold text-earth-text mb-1">
                                                Register as a Tailor
                                            </p>
                                            <p className="text-[11px] text-earth-text/80 leading-relaxed font-medium">
                                                Join our artisan network and showcase your craftsmanship.
                                            </p>
                                        </div>
                                        <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1">
                                            <span>{role === "tailor" ? "SELECTED ✓" : "SELECT TAILOR →"}</span>
                                        </div>
                                    </button>
                                </div>
                            </fieldset>

                            <div className="grid gap-6 sm:grid-cols-2 relative z-10">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                        PERSONAL LOCATION <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
                                    </label>
                                    <p className="text-xs text-earth-text/70 mb-3 font-medium">Drag the pin to your home or current location.</p>
                                    <div className="rounded-xl overflow-hidden border border-accent/40">
                                        <LocationPicker
                                            onChange={async (loc: { lat: number, lng: number }) => {
                                                setForm((current) => ({
                                                    ...current,
                                                    latitude: loc.lat,
                                                    longitude: loc.lng,
                                                }));
                                                const location = await reverseGeocode(loc.lat, loc.lng);
                                                if (location) {
                                                    setForm((current) => ({
                                                        ...current,
                                                        address: location.address,
                                                        city: location.city,
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 relative z-10 mt-8 pt-8 border-t border-accent/20">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                        FULL NAME *
                                    </label>
                                    <input
                                        value={form.displayName}
                                        onChange={(event) => updateField("displayName", event.target.value)}
                                        required
                                        disabled={submitting}
                                        placeholder="Your full name"
                                        className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                        PHONE NUMBER
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(event) => updateField("phone", event.target.value)}
                                        disabled={submitting}
                                        placeholder="+94 77 123 4567"
                                        className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                        CITY *
                                    </label>
                                    <input
                                        value={form.city}
                                        onChange={(event) => updateField("city", event.target.value)}
                                        required
                                        disabled={submitting}
                                        placeholder="Colombo"
                                        className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                        ADDRESS
                                    </label>
                                    <input
                                        value={form.address}
                                        onChange={(event) => updateField("address", event.target.value)}
                                        disabled={submitting}
                                        placeholder="45 Temple Street"
                                        className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                        PROFILE PICTURE <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
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
                                            className="block w-full text-xs text-earth-text file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-[10px] file:font-black file:tracking-widest file:text-cream-bg file:uppercase hover:file:bg-earth-text transition-colors cursor-pointer"
                                        />
                                        {profileImageFile && <span className="text-xs text-accent font-black whitespace-nowrap">Selected ✓</span>}
                                    </div>
                                </div>
                            </div>

                            {role === "tailor" && (
                                <div className="grid gap-6 border-t border-accent/20 pt-8 mt-8 sm:grid-cols-2 relative z-10">
                                    <div className="col-span-1 sm:col-span-2 text-center mb-2">
                                        <span className="inline-flex rounded-full bg-cream-bg border border-accent/40 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-earth-text">
                                            Shop Details
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            SHOP NAME *
                                        </label>
                                        <input
                                            value={form.shopName}
                                            onChange={(event) => updateField("shopName", event.target.value)}
                                            required
                                            disabled={submitting}
                                            placeholder="Your shop name"
                                            className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            SPECIALTY *
                                        </label>
                                        <input
                                            value={form.specialty}
                                            onChange={(event) => updateField("specialty", event.target.value)}
                                            required
                                            disabled={submitting}
                                            placeholder="Bridal wear, tailoring..."
                                            className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            SHOP BIO <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
                                        </label>
                                        <textarea
                                            value={form.shopBio}
                                            onChange={(event) => updateField("shopBio", event.target.value)}
                                            placeholder="Tell us about your shop..."
                                            disabled={submitting}
                                            rows={3}
                                            className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50 resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            REGISTRATION NUMBER <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
                                        </label>
                                        <input
                                            value={form.registrationNumber}
                                            onChange={(event) => updateField("registrationNumber", event.target.value)}
                                            placeholder="Business Registration Number"
                                            disabled={submitting}
                                            className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="flex items-start gap-3 py-4 border-y border-accent/20 my-2">
                                            <input
                                                type="checkbox"
                                                id="usePersonalAddress"
                                                checked={usePersonalAddress}
                                                onChange={(e) => setUsePersonalAddress(e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-accent/40 bg-cream-bg text-accent accent-accent focus:ring-accent"
                                            />
                                            <label htmlFor="usePersonalAddress" className="text-sm text-earth-text leading-snug cursor-pointer font-medium">
                                                <span className="font-bold block mb-0.5 text-earth-text">My shop uses my personal address</span>
                                                <span className="text-xs text-earth-text/70">We&apos;ll automatically use the contact info and map location you provided above for your shop.</span>
                                            </label>
                                        </div>
                                    </div>

                                    {!usePersonalAddress && (
                                        <div className="col-span-1 sm:col-span-2 grid gap-6 sm:grid-cols-2 p-5 bg-card-bg/20 rounded-xl border border-accent/30">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                                    SHOP PHONE
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={form.shopPhone}
                                                    onChange={(event) => updateField("shopPhone", event.target.value)}
                                                    placeholder="+94 77 123 4567"
                                                    disabled={submitting}
                                                    className="w-full rounded-xl border border-accent/40 bg-cream-bg px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                                    SHOP CITY
                                                </label>
                                                <input
                                                    value={form.shopCity}
                                                    onChange={(event) => updateField("shopCity", event.target.value)}
                                                    placeholder="Colombo"
                                                    disabled={submitting}
                                                    className="w-full rounded-xl border border-accent/40 bg-cream-bg px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                                    SHOP ADDRESS
                                                </label>
                                                <input
                                                    value={form.shopAddress}
                                                    onChange={(event) => updateField("shopAddress", event.target.value)}
                                                    placeholder="123 Market Street"
                                                    disabled={submitting}
                                                    className="w-full rounded-xl border border-accent/40 bg-cream-bg px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                                    SHOP LOCATION <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
                                                </label>
                                                <div className="rounded-xl overflow-hidden border border-accent/40">
                                                    <LocationPicker
                                                        onChange={async (loc: { lat: number, lng: number }) => {
                                                            setForm((current) => ({
                                                                ...current,
                                                                shopLatitude: loc.lat,
                                                                shopLongitude: loc.lng,
                                                            }));
                                                            const location = await reverseGeocode(loc.lat, loc.lng);
                                                            if (location) {
                                                                setForm((current) => ({
                                                                    ...current,
                                                                    shopAddress: location.address,
                                                                    shopCity: location.city,
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            SHOP PICTURE <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
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
                                                className="block w-full text-xs text-earth-text file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-[10px] file:font-black file:tracking-widest file:text-cream-bg file:uppercase hover:file:bg-earth-text transition-colors cursor-pointer"
                                            />
                                            {shopImageFile && <span className="text-xs text-accent font-black whitespace-nowrap">Selected ✓</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            NIC FRONT <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
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
                                                className="block w-full text-xs text-earth-text file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-[10px] file:font-black file:tracking-widest file:text-cream-bg file:uppercase hover:file:bg-earth-text transition-colors cursor-pointer"
                                            />
                                            {nicFrontFile && <span className="text-xs text-accent font-black whitespace-nowrap">Selected ✓</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase">
                                            NIC REAR <span className="text-earth-text/60 font-medium">(OPTIONAL)</span>
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
                                                className="block w-full text-xs text-earth-text file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-[10px] file:font-black file:tracking-widest file:text-cream-bg file:uppercase hover:file:bg-earth-text transition-colors cursor-pointer"
                                            />
                                            {nicRearFile && <span className="text-xs text-accent font-black whitespace-nowrap">Selected ✓</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-accent/20 pt-8 mt-8 sm:flex-row sm:justify-between relative z-10">
                                <button
                                    type="button"
                                    onClick={handleUseAnotherAccount}
                                    disabled={submitting}
                                    className="rounded-xl border border-accent/40 bg-cream-bg px-6 py-3.5 text-xs font-black tracking-widest uppercase text-earth-text hover:bg-card-bg/30 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    Use Another Account
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-accent hover:bg-earth-text px-8 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-cream-bg shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? "Saving Profile..." : "Complete Registration"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-accent/20 bg-cream-bg/90 py-5 px-6 sm:px-12 relative z-20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-earth-text">
                            FITI
                        </span>
                        <span className="text-[11px] text-earth-text/70">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>
                    <div className="flex items-center space-x-6 text-xs text-earth-text/80">
                        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link>
                        <Link href="/about" className="hover:text-accent transition-colors">About Us</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
