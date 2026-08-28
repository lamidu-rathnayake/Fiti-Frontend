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
            return ""; // Silently ignore — user dismissed popup
        default:
            return "Unable to sign in. Please try again.";
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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
            console.warn("Post auth role check fallback:", err);
            setRole("client");
            router.replace("/client/home");
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
            const message = firebaseErrorMessage(err);
            if (message) setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#F5CA53] selection:text-black font-sans">

            {/* AMBIENT BACKGROUND GLOW RECTANGLES */}
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#F5CA53]/10 blur-[180px] rounded-full pointer-events-none animate-pulse-glow z-0" />

            {/* TOP NAVIGATION BAR */}
            <header className="w-full border-b border-zinc-900/90 bg-[#0A0B0E]/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-10 px-3 py-1 bg-[#FFFDF9] rounded-xl border border-[#F5CA53]/50 shadow-[0_0_15px_rgba(245,202,83,0.25)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(245,202,83,0.45)]">
                            <img
                                src="/logoo.png"
                                alt="FITI Bespoke Atelier Logo"
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <span className="hidden sm:inline-block text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase border-l border-zinc-800 pl-3 py-1">
                            Bespoke Atelier
                        </span>
                    </Link>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setRole("client");
                                router.push("/client/home");
                            }}
                            className="bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                        >
                            Client Dash &rarr;
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setRole("tailor");
                                router.push("/tailor/home");
                            }}
                            className="bg-[#18191E] border border-zinc-800 hover:border-[#F5CA53] text-[#F5CA53] font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                        >
                            Seller Dash &rarr;
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/register")}
                            className="btn-gold-shimmer text-black font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-xl"
                        >
                            Register
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10 animate-fade-in-up">
                <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* LEFT COLUMN: CRAFTSMANSHIP & RIGOR */}
                    <div className="lg:col-span-5 glass-card stitch-border rounded-[32px] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[480px]">
                        <div className="absolute top-0 left-0 w-48 h-32 bg-[#F5CA53]/15 blur-3xl pointer-events-none" />

                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFE28A] mb-3 block">
                                Craftsmanship &amp; Precision
                            </span>

                            <h1 className="mb-4">
                                <span className="text-3xl font-serif font-light text-white block mb-1">
                                    The Standard of
                                </span>
                                <span className="text-3xl sm:text-4xl font-serif font-bold gold-gradient-text tracking-tight block">
                                    Bespoke Living.
                                </span>
                            </h1>

                            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                                Join an exclusive ecosystem where high-performance tailoring meets elite physical discipline. Access your customized fits and orders in real-time.
                            </p>
                        </div>

                        {/* Lower Image Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-black/40 h-52 mt-8 group cursor-pointer shadow-xl">
                            <img
                                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
                                alt="Bespoke Master Tailor at Work"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                            <div className="relative z-20 h-full p-5 flex flex-col justify-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5CA53] mb-1 block">
                                    Verified Artisans
                                </span>
                                <p className="text-xs font-serif font-bold text-white tracking-wide">
                                    Over 1,500 custom garments crafted with precision.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LOGIN FORM */}
                    <div className="lg:col-span-7 glass-card rounded-[32px] p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-20 bg-[#F5CA53]/15 blur-2xl pointer-events-none" />

                        <div>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 border-b border-zinc-800/80 pb-5">
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
                                        Sign In
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Enter your credentials to access your bespoke dashboard.
                                    </p>
                                </div>

                                <div className="flex items-center bg-[#18191E] border border-zinc-800 rounded-xl p-1 text-xs">
                                    <span className="bg-[#F5CA53] text-black px-3 py-1.5 rounded-lg font-bold">
                                        Log In
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/register")}
                                        className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all"
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
                                    className="mb-6 rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-xs font-medium text-rose-400 text-center animate-fade-in-up"
                                >
                                    {error}
                                </div>
                            )}

                            {/* FORM FIELDS */}
                            <form onSubmit={handleSubmit} className="space-y-5">
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
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E]/90 px-4 py-3.5 text-sm text-zinc-200 outline-none transition duration-300 placeholder:text-zinc-600 focus:border-[#F5CA53] focus:ring-1 focus:ring-[#F5CA53] shadow-inner"
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
                                            className="text-[10px] font-bold text-zinc-500 hover:text-[#F5CA53] uppercase tracking-wider transition-colors"
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
                                        className="w-full rounded-xl border border-zinc-800 bg-[#18191E]/90 px-4 py-3.5 text-sm text-zinc-200 outline-none transition duration-300 placeholder:text-zinc-600 focus:border-[#F5CA53] focus:ring-1 focus:ring-[#F5CA53] shadow-inner"
                                    />
                                </div>

                                {/* Status Indicator */}
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFE28A]">
                                        SECURE ATELIER AUTHENTICATION
                                    </span>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-gold-shimmer text-black font-extrabold text-xs uppercase tracking-[0.2em] py-4 px-6 rounded-xl text-center block mt-2"
                                >
                                    {loading ? "Authenticating..." : "Log In"}
                                </button>
                            </form>

                            {/* Google Sign In Divider & Button */}
                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-800/90" />
                                </div>
                                <span className="relative bg-[#131418] px-4 text-[9px] font-black tracking-[0.25em] text-zinc-500 uppercase">
                                    OR CONTINUE WITH
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-[#18191E] border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-zinc-800/90 transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-[0.98] shadow-md mb-6"
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

                            {/* DEV MODE QUICK DIRECT ACCESS BUTTONS */}
                            <div className="p-4 rounded-2xl bg-[#18191E]/90 border border-[#F5CA53]/40 space-y-3 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5CA53] flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#F5CA53] animate-ping" />
                                        DEV MODE DIRECT ACCESS
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Testing</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRole("client");
                                            router.push("/client/home");
                                        }}
                                        className="w-full bg-[#0A0B0E] hover:bg-[#F5CA53] hover:text-black border border-zinc-700 hover:border-[#F5CA53] text-zinc-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-1"
                                    >
                                        <span>Client Dashboard</span>
                                        <span>&rarr;</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRole("tailor");
                                            router.push("/tailor/home");
                                        }}
                                        className="w-full bg-[#0A0B0E] hover:bg-[#F5CA53] hover:text-black border border-zinc-700 hover:border-[#F5CA53] text-zinc-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-1"
                                    >
                                        <span>Seller Dashboard</span>
                                        <span>&rarr;</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-zinc-500 text-center mt-6">
                            By signing in, you agree to FITI's{" "}
                            <Link href="/terms" className="text-zinc-300 hover:underline">
                                Terms
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

            {/* BOTTOM FOOTER */}
            <footer className="w-full border-t border-zinc-900/80 bg-[#0A0B0E] py-7 px-6 sm:px-12 relative z-20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 text-center sm:text-left">
                        <span className="text-sm font-serif font-black tracking-widest gold-gradient-text">
                            FITI
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            &copy; {new Date().getFullYear()} FITI Bespoke Fitness &amp; Tailoring. All rights reserved.
                        </span>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-zinc-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
