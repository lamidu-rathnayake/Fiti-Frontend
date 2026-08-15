"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function TestAuthPage() {
    const { user, loading } = useAuth();

    // 🚀 1. Trigger the Google Account Popup Window
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // This forces the Google selection window to slide open
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google authentication failed:", error);
        }
    };

    // 🚪 2. Clear the Session
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                        Marketplace Portal
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Secure connection engine via Google OAuth 2.0.
                    </p>
                </div>

                {/* State Metrics Grid */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-600">
                            Connection Status
                        </span>
                        <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                loading
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                                    : "bg-slate-200 text-slate-700"
                            }`}
                        >
                            {loading ? "Checking Firebase..." : "Ready"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-600">
                            Active Session
                        </span>
                        <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold truncate max-w-[200px] ${
                                user
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                        >
                            {user?.email ?? "Guest Mode"}
                        </span>
                    </div>
                </div>

                {/* 🔒 Dynamic Action Buttons Container */}
                <div className="pt-2">
                    {user ? (
                        /* Show Sign Out button if user data exists */
                        <button
                            onClick={handleSignOut}
                            className="w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 font-medium py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-sm"
                        >
                            Sign Out of Account
                        </button>
                    ) : (
                        /* Show Sign In button if user is null */
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium py-2.5 px-4 rounded-xl transition duration-150 text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Simple inline Google colored icon layout */}
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
