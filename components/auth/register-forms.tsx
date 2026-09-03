"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import dynamic from "next/dynamic";

import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    createClientProfile,
    createTailorProfile,
} from "@/lib/api/endpoints/profiles";
import { createShop } from "@/lib/api/endpoints/shops";
import { reverseGeocode } from "@/lib/geocoding";
import { FitiApiError } from "../../lib/api/client";

const LocationPicker = dynamic(
    () => import("@/components/map/LocationPicker"),
    {
        ssr: false,
        loading: () => (
            <div className="h-36 w-full bg-card-bg/20 animate-pulse rounded-xl border border-accent/30 flex items-center justify-center text-earth-text/60 font-semibold text-xs uppercase tracking-wider">
                Loading map...
            </div>
        ),
    },
);

function registrationErrorMessage(error: unknown): string {
    if (error instanceof FitiApiError) return error.detail;
    if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use")
            return "This email is already registered.";
        if (error.code === "auth/invalid-email")
            return "Please enter a valid email address.";
        if (error.code === "auth/weak-password")
            return "Choose a stronger password.";
        if (error.code === "auth/operation-not-allowed")
            return "Email registration is not enabled for this project. Please contact support.";
        if (error.code === "auth/configuration-not-found")
            return "Authentication is not configured for this project. Please contact support.";
        if (error.code === "auth/network-request-failed")
            return "Network error. Check your connection and try again.";
    }
    return error instanceof Error
        ? error.message
        : "Registration failed. Please try again.";
}

// ── CLIENT REGISTRATION FORM ─────────────────────

export function ClientRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const { setRole } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [whatsapp, setWhatsapp] = useState("");
    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const userEmail = email.trim();
        const userPass = password;

        setError("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPass,
            );
            await updateProfile(userCredential.user, { displayName: fullName });
            await userCredential.user.getIdToken(true);

            await createClientProfile({
                phone: whatsapp.trim()
                    ? `+94${whatsapp.replace(/\D/g, "")}`
                    : null,
                city: city.trim() || null,
                address: address.trim() || null,
                latitude: latitude || null,
                longitude: longitude || null,
            });

            setRole("client");
            router.replace("/client/home");
        } catch (err: unknown) {
            setError(registrationErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

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
                        <Image
                            src="/logo_dark.png"
                            alt="FITI Atelizer"
                            width={220}
                            height={70}
                            className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
                            priority
                        />
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-bg bg-accent hover:bg-earth-text rounded-full transition-all shadow-md"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
                <div className="max-w-xl w-full mx-auto bg-cream-bg border border-accent/30 rounded-3xl p-8 sm:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-xl">
                    {/* CARD TITLE WITH VERTICAL ACCENT */}
                    <div className="flex items-center gap-3 mb-8 border-b border-accent/20 pb-5">
                        <div className="w-1.5 h-7 bg-accent rounded-full" />
                        <h1 className="text-2xl sm:text-3xl font-black text-earth-text tracking-tight uppercase">
                            Create client account
                        </h1>
                    </div>

                    {error && (
                        <div
                            aria-live="polite"
                            className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center"
                        >
                            {error}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* FIRST NAME & LAST NAME */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    FULL NAME
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    placeholder="First Name"
                                    aria-label="Full name"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    LAST NAME
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    placeholder="PERERA"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* MAP LOCATION PICKER */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                PIN LOCATION ON MAP (OPTIONAL)
                            </label>
                            <LocationPicker
                                onChange={async ({ lat, lng }) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                    const location = await reverseGeocode(
                                        lat,
                                        lng,
                                    );
                                    if (location) {
                                        setAddress(location.address);
                                        setCity(location.city);
                                    }
                                }}
                            />
                        </div>

                        {/* ADDRESS WITH ICON */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                ADDRESS
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="45 TEMPLE ROAD, MAHARAGAMA"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 pr-10 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* CITY */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                CITY
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="COLOMBO"
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                            />
                        </div>

                        {/* WHATSAPP NUMBER */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                WHATSAPP NUMBER
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="bg-card-bg/30 border border-accent/40 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-bold text-earth-text shrink-0">
                                    <span>🇱🇰 +94</span>
                                </div>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) =>
                                        setWhatsapp(e.target.value)
                                    }
                                    placeholder="77 123 4567"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* GENDER & AGE */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    GENDER
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text outline-none transition focus:border-accent focus:bg-cream-bg appearance-none"
                                >
                                    <option value="" disabled>
                                        SELECT
                                    </option>
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    AGE
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="25"
                                        className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 pr-10 text-sm font-semibold tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                    />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 6l3 1m0 0l-3 9a2 2 0 002 2h12a2 2 0 002-2l-3-9m-13 0h16"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EMAIL & PASSWORD FOR ACCOUNT CREATION */}
                        <div className="pt-3 border-t border-accent/20 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    EMAIL ADDRESS
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    PASSWORD
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* STATUS TAG */}
                        <div className="flex items-center gap-2 pt-2">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                                ENSURING A PRECISION FIT
                            </span>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 rounded-xl bg-accent hover:bg-earth-text py-4 text-xs font-black uppercase tracking-[0.15em] text-cream-bg shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <span>
                                {loading
                                    ? "CREATING PROFILE..."
                                    : "CREATE ACCOUNT"}
                            </span>
                            <span>&rarr;</span>
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() =>
                                onBack ? onBack() : router.push("/register")
                            }
                            className="text-xs text-earth-text/70 hover:text-accent font-bold uppercase tracking-wider transition-colors"
                        >
                            &larr; Choose Different Role
                        </button>
                    </div>
                </div>
            </main>

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-accent/20 bg-cream-bg/90 py-5 px-6 sm:px-12 relative z-20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-earth-text">
                            FITI
                        </span>
                        <span className="text-[11px] text-earth-text/70">
                            &copy; {new Date().getFullYear()} FITI Bespoke. All
                            rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-earth-text/80">
                        <Link
                            href="/privacy"
                            className="hover:text-accent transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="hover:text-accent transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/contact"
                            className="hover:text-accent transition-colors"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export function TailorRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const { setRole } = useAuth();

    // Step state (1: Personal Details, 2: Shop Details)
    const [step, setStep] = useState<1 | 2>(1);

    // Personal Details State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [personalBio, setPersonalBio] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");

    // Shop Details State
    const [shopName, setShopName] = useState("");
    const [shopBio, setShopBio] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [shopCity, setShopCity] = useState("");
    const [shopLatitude, setShopLatitude] = useState<number | null>(null);
    const [shopLongitude, setShopLongitude] = useState<number | null>(null);
    const [shopContact, setShopContact] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");

    // Auth State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!firstName.trim() || !lastName.trim()) {
            setError("First Name and Last Name are required to proceed.");
            return;
        }

        setStep(2);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const userEmail = email.trim();
        const userPass = password;

        setError("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPass,
            );
            await updateProfile(userCredential.user, { displayName: fullName });
            await userCredential.user.getIdToken(true);

            await createTailorProfile({
                phone: whatsapp.trim()
                    ? `+94${whatsapp.replace(/\D/g, "")}`
                    : null,
                city: city.trim() || null,
                address: address.trim() || null,
                latitude: latitude || null,
                longitude: longitude || null,
            });

            await createShop({
                shop_name: shopName.trim(),
                specialty: null,
                shop_bio: shopBio.trim() || null,
                shop_address: shopAddress.trim() || address.trim() || null,
                city: shopCity.trim() || city.trim() || null,
                contact_number: shopContact.trim()
                    ? `+94${shopContact.replace(/\D/g, "")}`
                    : null,
                registration_number: registrationNumber.trim() || null,
                latitude: shopLatitude ?? latitude,
                longitude: shopLongitude ?? longitude,
            });

            setRole("tailor");
            router.replace("/tailor/home");
        } catch (err: unknown) {
            setError(registrationErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

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
                        <Image
                            src="/logo_dark.png"
                            alt="FITI Atelier"
                            width={220}
                            height={70}
                            className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
                            priority
                        />
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-cream-bg bg-accent hover:bg-earth-text rounded-full transition-all shadow-md"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
                {/* PAGE HEADER */}
                <div className="mb-6 bg-cream-bg/95 p-6 rounded-2xl border border-accent/30 shadow-lg backdrop-blur-md text-center">
                    <h1 className="text-2xl sm:text-3xl font-black text-earth-text tracking-wider uppercase mb-2">
                        Create personal profile
                    </h1>
                    <p className="text-xs text-earth-text/80 font-medium max-w-lg mx-auto">
                        Begin your journey as a master artisan in our digital
                        atelier. Establish your bespoke presence today.
                    </p>

                    {/* STEP PROGRESS INDICATOR */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                step === 1
                                    ? "bg-accent text-cream-bg shadow-md"
                                    : "bg-card-bg/40 text-earth-text hover:bg-card-bg/60"
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-cream-bg text-earth-text flex items-center justify-center text-[10px]">
                                1
                            </span>
                            <span>Personal Details</span>
                        </button>

                        <div className="w-8 h-0.5 bg-accent/40" />

                        <button
                            type="button"
                            onClick={(e) => {
                                if (firstName.trim() && lastName.trim()) {
                                    setStep(2);
                                } else {
                                    handleNextStep(e);
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                step === 2
                                    ? "bg-accent text-cream-bg shadow-md"
                                    : "bg-card-bg/40 text-earth-text hover:bg-card-bg/60"
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-cream-bg text-earth-text flex items-center justify-center text-[10px]">
                                2
                            </span>
                            <span>Shop Details</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        aria-live="polite"
                        className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center"
                    >
                        {error}
                    </div>
                )}

                {/* STEP 1: PERSONAL DETAILS */}
                {step === 1 && (
                    <form
                        onSubmit={handleNextStep}
                        className="bg-cream-bg border border-accent/30 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-5"
                    >
                        <div className="border-b border-accent/20 pb-4 mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent block">
                                STEP 01 — CREATE PERSONAL PROFILE
                            </span>
                            <span className="text-xs font-bold text-earth-text/60">
                                1 of 2
                            </span>
                        </div>

                        {/* FIRST NAME & LAST NAME */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    FULL NAME *
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    placeholder="First Name"
                                    aria-label="Full name"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    LAST NAME *
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    placeholder="Last Name"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* MAP LOCATION PICKER */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                PIN LOCATION ON MAP (OPTIONAL)
                            </label>
                            <LocationPicker
                                onChange={async ({ lat, lng }) => {
                                    setLatitude(lat);
                                    setLongitude(lng);
                                    const location = await reverseGeocode(
                                        lat,
                                        lng,
                                    );
                                    if (location) {
                                        setAddress(location.address);
                                        setCity(location.city);
                                    }
                                }}
                            />
                        </div>

                        {/* ADDRESS */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                ADDRESS
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="12 MAYFAIR STREET"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 pr-10 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* CITY */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                CITY
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="COLOMBO"
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                            />
                        </div>

                        {/* BIO */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                PERSONAL BIO
                            </label>
                            <textarea
                                value={personalBio}
                                onChange={(e) => setPersonalBio(e.target.value)}
                                placeholder="TELL CLIENTS ABOUT YOUR EXPERTISE AND PASSION FOR BESPOKE CRAFT..."
                                rows={3}
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg resize-none"
                            />
                        </div>

                        {/* WHATSAPP NUMBER */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                WHATSAPP NUMBER
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="bg-card-bg/30 border border-accent/40 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-bold text-earth-text shrink-0">
                                    <span>🇱🇰 +94</span>
                                </div>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) =>
                                        setWhatsapp(e.target.value)
                                    }
                                    placeholder="77 900 0000"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* GENDER & AGE */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    GENDER
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text outline-none transition focus:border-accent focus:bg-cream-bg appearance-none"
                                >
                                    <option value="" disabled>
                                        SELECT
                                    </option>
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    AGE
                                </label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="28"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* CONTINUE TO STEP 2 BUTTON */}
                        <button
                            type="submit"
                            className="w-full mt-6 rounded-xl bg-accent hover:bg-earth-text py-4 text-xs font-black uppercase tracking-[0.15em] text-cream-bg shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 cursor-pointer"
                        >
                            <span>CONTINUE TO SHOP DETAILS &rarr;</span>
                            <span>&rarr;</span>
                        </button>
                    </form>
                )}

                {/* STEP 2: SHOP DETAILS & ACCOUNT CREATION */}
                {step === 2 && (
                    <form
                        onSubmit={handleSubmit}
                        className="bg-cream-bg border border-accent/30 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-5"
                    >
                        <div className="border-b border-accent/20 pb-4 mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent block">
                                STEP 02 — SHOP &amp; ACCOUNT DETAILS
                            </span>
                            <span className="text-xs font-bold text-earth-text/60">
                                2 of 2
                            </span>
                        </div>

                        {/* SHOP NAME */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                SHOP NAME *
                            </label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="ATELIER SAVILE ROW"
                                required
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                            />
                        </div>

                        {/* SHOP BIO */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                SHOP BIO / HERITAGE
                            </label>
                            <textarea
                                value={shopBio}
                                onChange={(e) => setShopBio(e.target.value)}
                                placeholder="DESCRIBE YOUR SHOP HERITAGE, SPECIALTIES, AND SUITING STYLES..."
                                rows={3}
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg resize-none"
                            />
                        </div>

                        {/* SHOP ADDRESS */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                SHOP ADDRESS
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={shopAddress}
                                    onChange={(e) =>
                                        setShopAddress(e.target.value)
                                    }
                                    placeholder="SAVILE ROW, MAIN ATELIER"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 pr-10 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-accent">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* SHOP LOCATION */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                PIN SHOP LOCATION (OPTIONAL)
                            </label>
                            <LocationPicker
                                defaultLocation={
                                    shopLatitude !== null &&
                                    shopLongitude !== null
                                        ? {
                                              lat: shopLatitude,
                                              lng: shopLongitude,
                                          }
                                        : undefined
                                }
                                onChange={async ({ lat, lng }) => {
                                    setShopLatitude(lat);
                                    setShopLongitude(lng);
                                    const location = await reverseGeocode(
                                        lat,
                                        lng,
                                    );
                                    if (location) {
                                        setShopAddress(location.address);
                                        setShopCity(location.city);
                                    }
                                }}
                            />
                        </div>

                        {/* SHOP CITY */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                SHOP CITY
                            </label>
                            <input
                                type="text"
                                value={shopCity}
                                onChange={(e) => setShopCity(e.target.value)}
                                placeholder="COLOMBO"
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                            />
                        </div>

                        {/* SHOP CONTACT */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                SHOP CONTACT NUMBER
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="bg-card-bg/30 border border-accent/40 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-bold text-earth-text shrink-0">
                                    <span>🇱🇰 +94</span>
                                </div>
                                <input
                                    type="tel"
                                    value={shopContact}
                                    onChange={(e) =>
                                        setShopContact(e.target.value)
                                    }
                                    placeholder="77 712 3456"
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* REGISTRATION NUMBER */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                BUSINESS REGISTRATION NUMBER
                            </label>
                            <input
                                type="text"
                                value={registrationNumber}
                                onChange={(e) =>
                                    setRegistrationNumber(e.target.value)
                                }
                                placeholder="REG-123456789"
                                className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                            />
                        </div>

                        {/* ACCOUNT CREDENTIALS */}
                        <div className="pt-3 border-t border-accent/20 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    ACCOUNT EMAIL *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tailor@example.com"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-earth-text uppercase mb-2">
                                    PASSWORD *
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full rounded-xl border border-accent/40 bg-card-bg/30 px-4 py-3 text-sm font-semibold text-earth-text placeholder-earth-text/50 outline-none transition focus:border-accent focus:bg-cream-bg"
                                />
                            </div>
                        </div>

                        {/* NAVIGATION / SUBMIT BUTTONS */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full sm:w-1/3 rounded-xl border border-accent/40 bg-cream-bg py-4 text-xs font-black uppercase tracking-wider text-earth-text hover:bg-card-bg/30 transition-all cursor-pointer text-center"
                            >
                                &larr; BACK
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-2/3 rounded-xl bg-accent hover:bg-earth-text py-4 text-xs font-black uppercase tracking-[0.15em] text-cream-bg shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                <span>
                                    {loading
                                        ? "CREATING SELLER PROFILE..."
                                        : "COMPLETE REGISTRATION"}
                                </span>
                                <span>&rarr;</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* BOTTOM BACK BUTTON */}
                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={() =>
                            onBack ? onBack() : router.push("/register")
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-accent/40 bg-cream-bg text-earth-text hover:text-accent hover:border-accent text-xs font-black uppercase tracking-[0.15em] transition-all hover:bg-card-bg/30"
                    >
                        <span>&larr;</span>
                        <span>CHOOSE DIFFERENT ROLE</span>
                    </button>
                </div>
            </main>

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-accent/20 bg-cream-bg/90 py-5 px-6 sm:px-12 relative z-20 backdrop-blur-md mt-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-earth-text">
                            FITI
                        </span>
                        <span className="text-[11px] text-earth-text/70">
                            &copy; {new Date().getFullYear()} FITI Bespoke. All
                            rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-earth-text/80">
                        <Link
                            href="/privacy"
                            className="hover:text-accent transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="hover:text-accent transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/contact"
                            className="hover:text-accent transition-colors"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
