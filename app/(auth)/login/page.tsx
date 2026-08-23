"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { FitiApiError } from "@/lib/api/client";

/** Map Firebase error codes to human-friendly messages. */
function firebaseErrorMessage(err: unknown): string {
    if (!(err instanceof FirebaseError)) {
        return err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    }
    switch (err.code) {
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Incorrect email or password. Please try again.";
        case "auth/user-disabled":
            return "This account has been disabled. Please contact support.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please wait a moment and try again.";
        case "auth/network-request-failed":
            return "Network error. Check your connection and try again.";
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
            return ""; // Silently ignore — user dismissed the popup
        default:
            return "Unable to sign in. Please try again.";
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "profile">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Profile form state (matching screenshot fields)
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [gender, setGender] = useState("MALE");
    const [age, setAge] = useState("25");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setRole } = useAuth();

    const handlePostAuthRedirect = async (): Promise<void> => {
        try {
            const data = await getMyRole();
            const role = data.role;

            if (role !== "client" && role !== "tailor") {
                router.replace("/onboarding");
                return;
            }

            setRole(role);
            router.replace(data.target_url || (role === "tailor" ? "/tailor/home" : "/client/home"));
        } catch (err) {
            if (err instanceof FitiApiError && err.status === 404) {
                router.replace("/onboarding");
                return;
            }
            throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (mode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
                await handlePostAuthRedirect();
            } else {
                // If in create profile view, redirect to register flow or onboarding
                router.push("/register");
            }
        } catch (err: unknown) {
            const message = firebaseErrorMessage(err);
            if (message) setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
            await handlePostAuthRedirect();
        } catch (err: unknown) {
            const message = firebaseErrorMessage(err);
            if (message) setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black font-sans">
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-zinc-900/80 bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 flex items-center justify-between">
                    {/* Brand Logo */}
                    <Link
                        href="/"
                        className="text-xl sm:text-2xl font-black tracking-widest text-[#F5CA53] hover:opacity-90 transition-opacity"
                    >
                        FITI
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold tracking-wider text-zinc-400">
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">
                            Orders
                        </Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">
                            Shops
                        </Link>
                        <Link href="/" className="hover:text-[#F5CA53] transition-colors">
                            Tailoring
                        </Link>
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="p-2 rounded-full border border-zinc-700/80 text-zinc-400 hover:text-[#F5CA53] hover:border-[#F5CA53] transition-colors"
                            aria-label="User Account"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMode(mode === "login" ? "profile" : "login")}
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#F5CA53] hover:bg-[#f7d369] rounded-xl transition-all shadow-[0_0_12px_rgba(245,202,83,0.25)]"
                        >
                            {mode === "login" ? "Sign In" : "Sign In"}
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#F5CA53]/10 blur-[160px] rounded-full pointer-events-none" />

                <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    
                    {/* LEFT COLUMN: CRAFTSMANSHIP & RIGOR */}
                    <div className="lg:col-span-5 bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-xl min-h-[500px]">
                        {/* Internal Ambient Glow Accent */}
                        <div className="absolute top-0 left-0 w-48 h-32 bg-[#F5CA53]/10 blur-3xl pointer-events-none" />

                        <div>
                            {/* Subtitle tag */}
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E5C158] mb-4 block">
                                Craftsmanship &amp; Rigor
                            </span>

                            {/* Headline */}
                            <h1 className="mb-4">
                                <span className="text-3xl sm:text-4xl font-light text-white block mb-1">
                                    The Standard of
                                </span>
                                <span className="text-3xl sm:text-4xl font-extrabold text-[#F5D061] tracking-tight block">
                                    Bespoke Living.
                                </span>
                            </h1>

                            {/* Body Paragraph */}
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
                                Join an exclusive ecosystem where high-performance tailoring meets elite physical discipline. Your measurements, your progress, your FITI.
                            </p>
                        </div>

                        {/* Lower Master Tailor Image Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-black/40 h-56 mt-8 group cursor-pointer shadow-lg">
                            <img
                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
                                alt="Bespoke Master Tailor at Work"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                            {/* Image Overlay Badge & Text */}
                            <div className="relative z-20 h-full p-5 flex flex-col justify-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-1 block">
                                    Elite Status
                                </span>
                                <p className="text-xs font-bold text-white tracking-wide">
                                    Over 2,500 active members in London.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FORM (Sign In / Create Profile) */}
                    <div className="lg:col-span-7 bg-[#131418]/90 border border-zinc-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between">
                        {/* Top Ambient Glow */}
                        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-20 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                        <div>
                            {/* Mode Toggle Header */}
                            <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                                        {mode === "login" ? "Sign In" : "Create Profile"}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {mode === "login"
                                            ? "Enter your details to access your bespoke dashboard."
                                            : "Enter your details for a truly bespoke experience."}
                                    </p>
                                </div>

                                {/* Mode Switcher Pill */}
                                <div className="flex items-center bg-[#18191E] border border-zinc-800 rounded-xl p-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setMode("login")}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                            mode === "login"
                                                ? "bg-[#F5CA53] text-black shadow-sm"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Log In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("profile")}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                            mode === "profile"
                                                ? "bg-[#F5CA53] text-black shadow-sm"
                                                : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div
                                    aria-live="polite"
                                    role="alert"
                                    className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-400 text-center"
                                >
                                    {error}
                                </div>
                            )}

                            {/* FORM FIELDS */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {mode === "login" ? (
                                    /* LOGIN FORM FIELDS */
                                    <>
                                        <div>
                                            <label
                                                htmlFor="login-email"
                                                className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase mb-2"
                                            >
                                                Email Address
                                            </label>
                                            <input
                                                id="login-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                required
                                                disabled={loading}
                                                className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-[#F5CA53] focus:ring-1 focus:ring-[#F5CA53]"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label
                                                    htmlFor="login-password"
                                                    className="block text-[10px] font-black tracking-widest text-[#F5CA53] uppercase"
                                                >
                                                    Password
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-[10px] font-bold text-zinc-500 hover:text-[#F5CA53] uppercase tracking-wider"
                                                >
                                                    {showPassword ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                            <input
                                                id="login-password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                autoComplete="current-password"
                                                required
                                                disabled={loading}
                                                className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-[#F5CA53] focus:ring-1 focus:ring-[#F5CA53]"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    /* CREATE PROFILE FORM FIELDS (EXACT MATCHING SCREENSHOT) */
                                    <>
                                        {/* First & Last Name */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="ALEXANDER"
                                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="VANE"
                                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                                />
                                            </div>
                                        </div>

                                        {/* Address with Icon */}
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                Address
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="12 MAYFAIR"
                                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 pr-10 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                                />
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* City */}
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="LONDON"
                                                className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                            />
                                        </div>

                                        {/* Whatsapp Number */}
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                WhatsApp Number
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-[#18191E] border border-zinc-800 rounded-xl px-3 py-3 flex items-center gap-2 text-xs font-bold text-zinc-300">
                                                    <span>🇬🇧 +44</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={whatsapp}
                                                    onChange={(e) => setWhatsapp(e.target.value)}
                                                    placeholder="7700 900000"
                                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 text-sm font-semibold tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                                />
                                            </div>
                                        </div>

                                        {/* Gender & Age */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                    Gender
                                                </label>
                                                <select
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value)}
                                                    className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53] appearance-none"
                                                >
                                                    <option value="MALE">MALE</option>
                                                    <option value="FEMALE">FEMALE</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase mb-2">
                                                    Age
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={age}
                                                        onChange={(e) => setAge(e.target.value)}
                                                        placeholder="25"
                                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E] px-4 py-3 pr-10 text-sm font-semibold uppercase tracking-wider text-zinc-200 outline-none transition focus:border-[#F5CA53]"
                                                    />
                                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M3 21h18M3 10h18v11H3V10z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Status Indicator */}
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5C158]">
                                        {mode === "login" ? "SECURE BESPOKE AUTHENTICATION" : "ENSURING A PRECISION FIT"}
                                    </span>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-[0.15em] py-4 px-6 rounded-xl shadow-[0_4px_25px_rgba(245,202,83,0.3)] transition-all transform hover:scale-[1.01] active:scale-[0.98] mt-2"
                                >
                                    {loading
                                        ? "Processing..."
                                        : mode === "login"
                                        ? "Log In"
                                        : "Register"}
                                </button>
                            </form>

                            {/* Google Sign In Divider & Button */}
                            {mode === "login" && (
                                <>
                                    <div className="relative flex items-center justify-center my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-zinc-800/90" />
                                        </div>
                                        <span className="relative bg-[#131418] px-4 text-[10px] font-extrabold tracking-[0.2em] text-zinc-500 uppercase">
                                            OR CONTINUE WITH
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        className="w-full bg-[#18191E] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-zinc-800/90 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-[0.98]"
                                    >
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
                                            />
                                        </svg>
                                        <span>Sign up with Google</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Terms Disclaimer */}
                        <p className="text-[10px] text-zinc-500 text-center mt-6">
                            By registering, you agree to our{" "}
                            <Link href="/terms" className="text-zinc-300 hover:underline">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-zinc-300 hover:underline">
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-7 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left Footer Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-black tracking-widest text-[#F5CA53]">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>

                    {/* Right Footer Links */}
                    <div className="flex items-center space-x-6 text-xs text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/contact" className="hover:text-white transition-colors">
                            Contact Us
                        </Link>
                        <Link href="/about" className="hover:text-white transition-colors">
                            About Us
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
