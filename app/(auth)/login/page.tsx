"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
            return ""; // Silently ignore — user dismissed popup
        default:
            return "Unable to sign in. Please try again.";
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setRole } = useAuth();

    const handlePostAuthRedirect = async (): Promise<void> => {
        try {
            const data = await getMyRole();
            const role = data.role;

            if (role === "tailor") {
                setRole("tailor");
                router.replace("/tailor/home");
                return;
            }

            if (role === "client") {
                setRole("client");
                router.replace("/client/home");
                return;
            }

            router.replace("/register");
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
            await signInWithEmailAndPassword(auth, email, password);
            await handlePostAuthRedirect();
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
            if (err instanceof FirebaseError) {
                if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
                    setError("Google sign-in failed. Check your connection and try again.");
                }
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans selection:bg-[#9d6638] selection:text-[#f7f1de]">
            {/* FULL BACKGROUND PHOTO */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/orders/mens_charcoal_suit.jpg"
                    alt="Atelier Studio Background"
                    fill
                    className="object-cover brightness-[0.4] scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-[#4e220f]/20 backdrop-blur-[3px]" />
            </div>

            {/* FLOATING CARD CONTAINER */}
            <div className="relative z-10 w-full max-w-5xl bg-transparent rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                
                {/* LEFT COLUMN: TORN PAPER FORM SECTION */}
                <div className="lg:col-span-6 bg-[#f7f1de] relative p-8 sm:p-12 flex flex-col justify-between z-20">
                    
                    {/* TORN PAPER JAGGED SVG EDGE (Right border on desktop) */}
                    <svg
                        className="absolute top-0 -right-7 h-full w-8 z-30 text-[#f7f1de] fill-current hidden lg:block pointer-events-none drop-shadow-[4px_0_6px_rgba(0,0,0,0.15)]"
                        viewBox="0 0 30 600"
                        preserveAspectRatio="none"
                    >
                        <path d="M0,0 L0,600 L14,600 Q2,570 20,540 Q6,510 24,480 Q4,450 18,420 Q28,390 10,360 Q2,330 22,300 Q8,270 26,240 Q4,210 18,180 Q28,150 10,120 Q0,90 22,60 Q8,30 26,0 Z" />
                    </svg>

                    <div>
                        {/* Top Branding & Return Link */}
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="group">
                                <Image
                                    src="/logo_light.png"
                                    alt="FITI Atelier"
                                    width={220}
                                    height={70}
                                    className="h-14 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
                                    priority
                                />
                            </Link>

                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="text-xs font-bold text-[#9d6638] hover:text-[#4e220f] transition flex items-center gap-1"
                            >
                                &larr; Home
                            </button>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-[#4e220f] uppercase mb-6 text-center">
                            SIGN IN
                        </h1>

                        {/* Error Banner */}
                        {error && (
                            <div
                                aria-live="polite"
                                role="alert"
                                className="mb-6 rounded-2xl border border-rose-800/30 bg-rose-100/60 px-4 py-3 text-xs font-medium text-rose-900 text-center"
                            >
                                {error}
                            </div>
                        )}

                        {/* Centered Google Sign-In Button */}
                        <div className="flex justify-center mb-6">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full max-w-md rounded-full bg-[#f7f1de] border border-[#9d6638]/40 hover:bg-[#B0BA99]/30 text-[#4e220f] font-bold text-xs py-3.5 px-6 shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
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
                                <span>Sign in with Google</span>
                            </button>
                        </div>

                        {/* OR Divider Line */}
                        <div className="relative flex items-center justify-center my-6 max-w-md mx-auto">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#9d6638]/30" />
                            </div>
                            <span className="relative bg-[#f7f1de] px-3 text-[10px] font-bold tracking-widest text-[#4e220f]/70 uppercase">
                                OR WITH EMAIL
                            </span>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                            {/* Email Pill Input */}
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-[#9d6638]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e-mail"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-full bg-[#B0BA99]/30 border border-[#9d6638]/40 pl-12 pr-5 py-3.5 text-sm text-[#4e220f] placeholder:text-[#4e220f]/60 focus:bg-[#f7f1de] focus:border-[#9d6638] focus:outline-none transition duration-200 shadow-inner"
                                />
                            </div>

                            {/* Password Pill Input */}
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-[#9d6638]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-full bg-[#B0BA99]/30 border border-[#9d6638]/40 pl-12 pr-12 py-3.5 text-sm text-[#4e220f] placeholder:text-[#4e220f]/60 focus:bg-[#f7f1de] focus:border-[#9d6638] focus:outline-none transition duration-200 shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-xs font-bold text-[#9d6638] hover:text-[#4e220f] uppercase"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-center gap-2 pt-1 pb-2">
                                <input
                                    id="agree-terms"
                                    type="checkbox"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#9d6638] text-[#9d6638] focus:ring-[#9d6638] accent-[#9d6638] cursor-pointer"
                                />
                                <label htmlFor="agree-terms" className="text-xs text-[#4e220f] cursor-pointer">
                                    I agree to FITI&apos;s{" "}
                                    <Link href="/terms" className="underline font-medium hover:text-[#9d6638]">
                                        terms of service
                                    </Link>
                                    .
                                </label>
                            </div>

                            {/* Pill Action Button */}
                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={loading || !agreeTerms}
                                    className="w-full rounded-full bg-[#9d6638] hover:bg-[#4e220f] active:scale-95 text-[#f7f1de] font-extrabold text-xs uppercase tracking-widest px-10 py-3.5 transition-all shadow-md disabled:opacity-50"
                                >
                                    {loading ? "AUTHENTICATING..." : "SIGN IN"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="text-[11px] text-[#4e220f]/70 mt-6">
                        Need an account?{" "}
                        <Link href="/register" className="text-[#9d6638] font-bold hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>

                {/* RIGHT COLUMN: FULL BACKGROUND IMAGE WITH OVERLAY TEXT */}
                <div className="lg:col-span-6 relative hidden lg:block overflow-hidden">
                    <Image
                        src="/images/orders/mens_charcoal_suit.jpg"
                        alt="Bespoke Suit Studio"
                        fill
                        className="object-cover brightness-90 scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#4e220f]/80 via-transparent to-black/30" />

                    <div className="absolute bottom-12 right-12 text-right text-[#f7f1de] max-w-sm">
                        <h2 className="text-4xl font-black tracking-tight leading-none drop-shadow-lg uppercase">
                            FITI ATELIER
                        </h2>
                        <p className="text-xl font-bold tracking-wider text-[#B0BA99] mt-2 uppercase drop-shadow-md">
                            CRAFTED TO FIT
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
