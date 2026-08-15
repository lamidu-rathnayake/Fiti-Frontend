"use client";

import { useAuth } from "@/lib/AuthContext";

export default function TestAuthPage() {
    const { user, loading } = useAuth();

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                
                {/* Header Block */}
                <div>
                    <h1 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                        Firebase Authentication Test
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Monitor real-time session synchronization states.
                    </p>
                </div>

                {/* State Metrics Grid */}
                <div className="space-y-3">
                    
                    {/* Loading State Row */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-600">Connection Status</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            loading 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' 
                                : 'bg-slate-200 text-slate-700'
                        }`}>
                            {loading ? "Checking Firebase..." : "Ready"}
                        </span>
                    </div>

                    {/* Email State Row */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-600">Active Session</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold truncate max-w-[200px] ${
                            user 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                            {user?.email ?? "Guest Mode"}
                        </span>
                    </div>

                </div>

                {/* Secure Data Debug Block */}
                <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                    <div className="text-slate-500 select-none pb-1 border-b border-slate-800">
                        // SECURE TOKEN DATA
                    </div>
                    <p>
                        <span className="text-indigo-400">uid:</span>{" "}
                        <span className={user?.uid ? "text-emerald-400" : "text-rose-400"}>
                            {user?.uid ? `"${user.uid}"` : "null"}
                        </span>
                    </p>
                    <p>
                        <span className="text-indigo-400">loading_flag:</span>{" "}
                        <span className="text-amber-400">{String(loading)}</span>
                    </p>
                </div>

            </div>
        </main>
    );
}
