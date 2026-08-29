"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/AuthContext";
import { createClientProfile, createTailorProfile } from "@/lib/api/endpoints/profiles";
import { createShop } from "@/lib/api/endpoints/shops";
import { FitiApiError } from "@/lib/api/client";

function registrationErrorMessage(error: unknown): string {
    if (error instanceof FitiApiError) return error.detail;
    if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") return "This email is already registered.";
        if (error.code === "auth/invalid-email") return "Please enter a valid email address.";
        if (error.code === "auth/weak-password") return "Choose a stronger password.";
    }
    return error instanceof Error ? error.message : "Registration failed. Please try again.";
}

// ── CLIENT REGISTRATION FORM (EXACT MATCHING SCREENSHOT) ─────────────────────

export function ClientRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const { setRole } = useAuth();

    const [firstName, setFirstName] = useState("Ahamed");
    const [lastName, setLastName] = useState("Perera");
    const [address, setAddress] = useState("45 Temple Road, Maharagama");
    const [city, setCity] = useState("Colombo");
    const [whatsapp, setWhatsapp] = useState("77 123 4567");
    const [gender, setGender] = useState("MALE");
    const [age, setAge] = useState("25");
    const [email, setEmail] = useState("ahamed.perera@example.com");
    const [password, setPassword] = useState("password123");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || "Client User";
        const userEmail = email.trim() || `client_${Date.now()}@fiti.lk`;
        const userPass = password || "password123";

        setError("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPass
            );
            await updateProfile(userCredential.user, { displayName: fullName });
            await userCredential.user.getIdToken(true);

            await createClientProfile({
                phone: whatsapp.trim() ? `+94${whatsapp.replace(/\D/g, "")}` : null,
                city: city.trim() || "Colombo",
                address: address.trim() || null,
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
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity">
                        FITI
                    </Link>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <Link href="/login" className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden hover:border-[#F5CA53] transition-colors">
                            <span className="text-xs font-bold text-zinc-300">C</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#F5CA53]/10 blur-[160px] rounded-full pointer-events-none" />

                <div className="max-w-xl w-full mx-auto bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    {/* Top Ambient Glow */}
                    <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-20 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                    {/* CARD TITLE WITH VERTICAL ACCENT */}
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-800/80 pb-5">
                        <div className="w-1.5 h-7 bg-[#F5CA53] rounded-full" />
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Client Registration
                        </h1>
                    </div>

                    {error && (
                        <div aria-live="polite" className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center">
                            {error}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* FIRST NAME & LAST NAME */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                    FIRST NAME
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="AHAMED"
                                    required
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                    LAST NAME
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="PERERA"
                                    required
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                            </div>
                        </div>

                        {/* ADDRESS WITH ICON */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                ADDRESS
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="45 TEMPLE ROAD, MAHARAGAMA"
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 pr-10 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* CITY */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                CITY
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="COLOMBO"
                                className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                            />
                        </div>

                        {/* WHATSAPP NUMBER */}
                        <div>
                            <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                WHATSAPP NUMBER
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="bg-[#18191E] border border-zinc-800 rounded-xl px-4 py-3.5 flex items-center gap-2 text-xs font-bold text-zinc-300 shrink-0">
                                    <span>🇱🇰 +94</span>
                                </div>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    placeholder="77 123 4567"
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                            </div>
                        </div>

                        {/* GENDER & AGE */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                    GENDER
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53] appearance-none"
                                >
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                    AGE
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="25"
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 pr-10 text-sm font-semibold tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a2 2 0 002 2h12a2 2 0 002-2l-3-9m-13 0h16" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EMAIL & PASSWORD FOR ACCOUNT CREATION */}
                        <div className="pt-3 border-t border-zinc-800/80 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                    EMAIL ADDRESS
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2">
                                    PASSWORD
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                            </div>
                        </div>

                        {/* STATUS TAG */}
                        <div className="flex items-center gap-2 pt-2">
                            <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5CA53]">
                                ENSURING A PRECISION FIT
                            </span>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] py-4 text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(245,202,83,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <span>{loading ? "CREATING PROFILE..." : "SUBMIT AND CONTINUE"}</span>
                            <span>&rarr;</span>
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => onBack ? onBack() : router.push("/register")}
                            className="text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider transition-colors"
                        >
                            &larr; Choose Different Role
                        </button>
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
                            &copy; {new Date().getFullYear()} FITI Bespoke. All rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ── SELLER / TAILOR REGISTRATION FORM (EXACT MATCHING SCREENSHOT) ────────────

export function TailorRegisterForm({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    const { setRole } = useAuth();

    // Personal Details State
    const [firstName, setFirstName] = useState("Alexander");
    const [lastName, setLastName] = useState("Vane");
    const [address, setAddress] = useState("12 Mayfair");
    const [city, setCity] = useState("Colombo");
    const [personalBio, setPersonalBio] = useState("Master bespoke artisan specialized in suits and tuxedos.");
    const [whatsapp, setWhatsapp] = useState("77 900 0000");
    const [gender, setGender] = useState("MALE");
    const [age, setAge] = useState("25");

    // Shop Details State
    const [shopName, setShopName] = useState("Atelier Vane");
    const [shopBio, setShopBio] = useState("Providing high-precision hand-tailored garments.");
    const [shopAddress, setShopAddress] = useState("Savile Row, Colombo 07");
    const [shopContact, setShopContact] = useState("77 712 3456");
    const [registrationNumber, setRegistrationNumber] = useState("REG-123456789");

    // Auth State
    const [email, setEmail] = useState("atelier.vane@example.com");
    const [password, setPassword] = useState("password123");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || "Master Tailor";
        const userEmail = email.trim() || `tailor_${Date.now()}@fiti.lk`;
        const userPass = password || "password123";

        setError("");
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userEmail,
                userPass
            );
            await updateProfile(userCredential.user, { displayName: fullName });
            await userCredential.user.getIdToken(true);

            await createTailorProfile({
                phone: whatsapp.trim() ? `+94${whatsapp.replace(/\D/g, "")}` : null,
                city: city.trim() || "Colombo",
                address: address.trim() || null,
            });

            await createShop({
                shop_name: shopName.trim() || "Atelier Vane",
                specialty: "Bespoke Tailoring",
                shop_bio: shopBio.trim() || null,
                shop_address: shopAddress.trim() || address.trim() || null,
                city: city.trim() || "Colombo",
                contact_number: shopContact.trim() ? `+94${shopContact.replace(/\D/g, "")}` : null,
                registration_number: registrationNumber.trim() || null,
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
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    <Link href="/" className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity">
                        FITI
                    </Link>

                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/storefront" className="hover:text-[#F5CA53] transition-colors">Storefront</Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">Dashboard</Link>
                        <Link href="/orders" className="hover:text-[#F5CA53] transition-colors">Orders</Link>
                        <Link href="/tailors" className="hover:text-[#F5CA53] transition-colors">Tailors</Link>
                    </nav>

                    <div className="flex items-center space-x-5 text-zinc-400">
                        <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <svg className="w-5 h-5 hover:text-white cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <Link href="/login" className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden hover:border-[#F5CA53] transition-colors">
                            <span className="text-xs font-bold text-zinc-300">S</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 relative z-10">
                {/* PAGE HEADER */}
                <div className="mb-10 max-w-2xl">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5CA53] tracking-tight mb-2">
                        Seller Registration
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                        Begin your journey as a master artisan in our digital atelier. Provide your details to establish your bespoke presence.
                    </p>
                </div>

                {error && (
                    <div aria-live="polite" className="mb-8 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center">
                        {error}
                    </div>
                )}

                {/* FORM CONTAINER: 2 COLUMNS (PERSONAL DETAILS & SHOP DETAILS) */}
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* LEFT COLUMN: PERSONAL DETAILS */}
                        <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5">
                            <div className="border-b border-zinc-800/80 pb-4 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] block">
                                    PERSONAL DETAILS
                                </span>
                            </div>

                            {/* FIRST NAME & LAST NAME */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        FIRST NAME
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="ALEXANDER"
                                        required
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        LAST NAME
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="VANE"
                                        required
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                </div>
                            </div>

                            {/* ADDRESS */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                    ADDRESS
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="12 MAYFAIR"
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 pr-10 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* CITY */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                    CITY
                                </label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="LONDON"
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                />
                            </div>

                            {/* BIO */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                    BIO
                                </label>
                                <textarea
                                    value={personalBio}
                                    onChange={(e) => setPersonalBio(e.target.value)}
                                    placeholder="TELL US ABOUT YOUR STYLE PREFERENCES..."
                                    rows={3}
                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53] resize-none"
                                />
                            </div>

                            {/* WHATSAPP NUMBER */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                    WHATSAPP NUMBER
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#18191E] border border-zinc-800 rounded-xl px-4 py-3.5 flex items-center gap-2 text-xs font-bold text-zinc-300 shrink-0">
                                        <span>🇱🇰 +94</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        placeholder="77 900 0000"
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                </div>
                            </div>

                            {/* GENDER & AGE */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        GENDER
                                    </label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53] appearance-none"
                                    >
                                        <option value="MALE">MALE</option>
                                        <option value="FEMALE">FEMALE</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        AGE
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            placeholder="25"
                                            className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 pr-10 text-sm font-semibold tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                        />
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a2 2 0 002 2h12a2 2 0 002-2l-3-9m-13 0h16" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: SHOP DETAILS */}
                        <div className="bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5 flex flex-col justify-between min-h-[620px]">
                            <div className="space-y-5">
                                <div className="border-b border-zinc-800/80 pb-4 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] block">
                                        SHOP DETAILS
                                    </span>
                                </div>

                                {/* SHOP NAME */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        SHOP NAME
                                    </label>
                                    <input
                                        type="text"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        placeholder="ATELIER VANE"
                                        required
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                </div>

                                {/* SHOP BIO */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        SHOP BIO
                                    </label>
                                    <textarea
                                        value={shopBio}
                                        onChange={(e) => setShopBio(e.target.value)}
                                        placeholder="DESCRIBE YOUR HERITAGE..."
                                        rows={3}
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53] resize-none"
                                    />
                                </div>

                                {/* SHOP ADDRESS */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        SHOP ADDRESS
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={shopAddress}
                                            onChange={(e) => setShopAddress(e.target.value)}
                                            placeholder="SAVILE ROW"
                                            className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 pr-10 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                        />
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* SHOP CONTACT */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        SHOP CONTACT
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#18191E] border border-zinc-800 rounded-xl px-4 py-3.5 flex items-center gap-2 text-xs font-bold text-zinc-300 shrink-0">
                                            <span>🇱🇰 +94</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={shopContact}
                                            onChange={(e) => setShopContact(e.target.value)}
                                            placeholder="77 712 3456"
                                            className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                        />
                                    </div>
                                </div>

                                {/* REGISTRATION NUMBER */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                        REGISTRATION NUMBER
                                    </label>
                                    <input
                                        type="text"
                                        value={registrationNumber}
                                        onChange={(e) => setRegistrationNumber(e.target.value)}
                                        placeholder="REG-123456789"
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                    />
                                </div>

                                {/* ACCOUNT EMAIL & PASSWORD */}
                                <div className="pt-3 border-t border-zinc-800/80 space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                            ACCOUNT EMAIL
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tailor@example.com"
                                            required
                                            className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                            PASSWORD
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            required
                                            className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm font-semibold text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 rounded-xl bg-[#F5CA53] hover:bg-[#f7d369] py-4 text-xs font-black uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(245,202,83,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                <span>{loading ? "CREATING SELLER PROFILE..." : "SUBMIT AND CONTINUE"}</span>
                                <span>&rarr;</span>
                            </button>
                        </div>
                    </div>
                </form>

                {/* BOTTOM 3-IMAGE GALLERY */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 h-52 group cursor-pointer shadow-lg">
                        <img
                            src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
                            alt="Master Tailor at Cutting Table"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                        <div className="relative z-20 h-full p-5 flex items-end">
                            <span className="text-xs font-bold text-white tracking-wide">
                                Master Artisan Craftsmanship
                            </span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 h-52 group cursor-pointer shadow-lg">
                        <img
                            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                            alt="Bespoke Suit Showroom"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                        <div className="relative z-20 h-full p-5 flex items-end">
                            <span className="text-xs font-bold text-white tracking-wide">
                                Digital Showroom &amp; Tailor Shop
                            </span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 h-52 group cursor-pointer shadow-lg">
                        <img
                            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80"
                            alt="Premium Fabric Weave"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                        <div className="relative z-20 h-full p-5 flex items-end">
                            <span className="text-xs font-bold text-white tracking-wide">
                                Curated Luxury Wool &amp; Silks
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-8 px-6 sm:px-12 relative z-20 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Digital Atelier. All rights reserved.
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Link href="/" className="hover:text-white transition-colors">Bespoke Process</Link>
                        <Link href="/" className="hover:text-white transition-colors">Our Heritage</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
