"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/firebase/AuthContext";
import { getMyRole } from "@/lib/api/endpoints/auth";
import { getClientProfile, getTailorProfile } from "@/lib/api/endpoints/profiles";
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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setRole } = useAuth();

    /**
     * After a successful Firebase sign-in, fetch the user's role from the
     * backend and redirect accordingly. Returns true if navigation was
     * initiated (so callers know not to reset loading state).
     */
    const handlePostAuthRedirect = async (): Promise<void> => {
        try {
            const data = await getMyRole();
            const role = data.role;

            if (role !== "client" && role !== "tailor") {
                router.replace("/onboarding");
                return;
            }

            setRole(role);
            router.replace(role === "tailor" ? "/tailor/home" : "/client/home");
        } catch (err) {
            if (err instanceof FitiApiError && err.status === 404) {
                // Fallback: The user_roles table might be missing this user.
                // Let's check if they actually have a profile already.
                const currentUser = auth.currentUser;
                if (currentUser) {
                    try {
                        await getClientProfile(currentUser.uid);
                        setRole("client");
                        router.replace("/client/home");
                        return;
                    } catch (clientErr) {
                        try {
                            await getTailorProfile(currentUser.uid);
                            setRole("tailor");
                            router.replace("/tailor/home");
                            return;
                        } catch (tailorErr) {
                            // If both return 404, they truly are a new user.
                        }
                    }
                }
                
                // New user — no role yet
                router.replace("/onboarding");
                return;
            }
            // Network / server error — surface it
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
            const message = firebaseErrorMessage(err);
            if (message) setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Welcome back
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Sign in to your Fiti account
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            aria-live="polite"
                            role="alert"
                            className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* Email / Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="login-email"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Email
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
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label
                                    htmlFor="login-password"
                                    className="text-sm font-medium text-slate-700"
                                >
                                    Password
                                </label>
                            </div>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                disabled={loading}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-slate-400">
                                OR
                            </span>
                        </div>
                    </div>

                    {/* Google Login */}
                    <button
                        id="google-login-btn"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {/* Google Icon */}
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Register link */}
                    <div className="mt-7 text-center">
                        <p className="text-sm text-slate-500">
                            Don&apos;t have an account?{" "}
                            <button
                                id="go-to-register-btn"
                                type="button"
                                onClick={() => router.push("/register")}
                                className="font-medium text-slate-900 hover:underline"
                            >
                                Register
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    &copy; {new Date().getFullYear()} Fiti. All rights reserved.
                </p>
            </div>
        </main>
    );
}
