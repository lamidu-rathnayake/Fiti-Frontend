"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { FitiApiError } from "@/lib/api/client";
import FullPageLock from "@/components/FullPageLock";

/** Map Firebase error codes to human-friendly messages. */
function firebaseErrorMessage(err: unknown): string {
    if (!(err instanceof FirebaseError)) {
        return err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
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
        case "auth/operation-not-allowed":
            return "Email sign-in is not enabled for this project. Please contact support.";
        case "auth/configuration-not-found":
            return "Authentication is not configured for this project. Please contact support.";
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
                if (
                    err.code !== "auth/popup-closed-by-user" &&
                    err.code !== "auth/cancelled-popup-request"
                ) {
                    setError(
                        "Google sign-in failed. Check your connection and try again.",
                    );
                }
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans selection:bg-accent selection:text-cream-bg">
            {/* FULL BACKGROUND PHOTO */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/orders/mens_charcoal_suit.jpg"
                    alt="Atelier Studio Background"
                    fill
                    sizes="100vw"
                    className="object-cover brightness-[0.4] scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-earth-text/20 backdrop-blur-[3px]" />
            </div>

            {/* FLOATING CARD CONTAINER */}
            <div className="relative z-10 w-full max-w-5xl bg-transparent rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                {/* LEFT COLUMN: TORN PAPER FORM SECTION */}
                <div className="lg:col-span-6 bg-cream-bg relative p-8 sm:p-12 flex flex-col justify-between z-20">
                    {/* TORN PAPER JAGGED SVG EDGE (Right border on desktop) */}
                    <svg
                        className="absolute top-0 -right-7 h-full w-8 z-30 text-cream-bg fill-current hidden lg:block pointer-events-none drop-shadow-[4px_0_6px_rgba(0,0,0,0.15)]"
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
                                className="text-xs font-bold text-accent hover:text-earth-text transition flex items-center gap-1"
                            >
                                &larr; Home
                            </button>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-earth-text uppercase mb-6 text-center">
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

                      

                        {/* OR Divider Line */}
                        <div className="relative flex items-center justify-center my-6 max-w-md mx-auto">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-accent/30" />
                            </div>
                            <span className="relative bg-cream-bg px-3 text-[10px] font-bold tracking-widest text-earth-text/70 uppercase">
                                OR WITH EMAIL
                            </span>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 max-w-md mx-auto"
                        >
                            {/* Email Pill Input */}
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-accent">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </span>
                                <input
                                    id="login-email"
                                    aria-label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e-mail"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-full bg-card-bg/30 border border-accent/40 pl-12 pr-5 py-3.5 text-sm text-earth-text placeholder:text-earth-text/60 focus:bg-cream-bg focus:border-accent focus:outline-none transition duration-200 shadow-inner"
                                />
                            </div>

                            {/* Password Pill Input */}
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-accent">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </span>
                                <input
                                    id="login-password"
                                    aria-label="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-full bg-card-bg/30 border border-accent/40 pl-12 pr-12 py-3.5 text-sm text-earth-text placeholder:text-earth-text/60 focus:bg-cream-bg focus:border-accent focus:outline-none transition duration-200 shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-4 text-xs font-bold text-accent hover:text-earth-text uppercase"
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
                                    onChange={(e) =>
                                        setAgreeTerms(e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-accent text-accent focus:ring-accent accent-accent cursor-pointer"
                                />
                                <label
                                    htmlFor="agree-terms"
                                    className="text-xs text-earth-text cursor-pointer"
                                >
                                    I agree to FITI&apos;s{" "}
                                    <Link
                                        href="/terms"
                                        className="underline font-medium hover:text-accent"
                                    >
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
                                    className="w-full rounded-full bg-accent hover:bg-earth-text active:scale-95 text-cream-bg font-extrabold text-xs uppercase tracking-widest px-10 py-3.5 transition-all shadow-md disabled:opacity-50"
                                >
                                    {loading ? "AUTHENTICATING..." : "SIGN IN"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="text-[11px] text-earth-text/70 mt-6">
                        Need an account?{" "}
                        <Link
                            href="/register"
                            className="text-accent font-bold hover:underline"
                        >
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
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover brightness-90 scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-earth-text/80 via-transparent to-black/30" />

                    <div className="absolute bottom-12 right-12 text-right text-cream-bg max-w-sm">
                        <h2 className="text-4xl font-black tracking-tight leading-none drop-shadow-lg uppercase">
                            FITI ATELIER
                        </h2>
                        <p className="text-xl font-bold tracking-wider text-card-bg mt-2 uppercase drop-shadow-md">
                            CRAFTED TO FIT
                        </p>
                    </div>
                </div>
            </div>
            <FullPageLock
                isSubmitting={loading}
                badgeText="ATELIER AUTH"
                title="Authenticating..."
                message="Verifying credentials and opening your Atelier session..."
            />
        </div>
    );
}
