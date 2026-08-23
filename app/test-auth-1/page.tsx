"use client";

import { useAuth } from "@/lib/firebase/AuthContext";

export default function TestAuthPage() {
    const { user, loading, logout } = useAuth();

    const handleSignOut = async () => {
        await logout();
    };

    const profileDetails = user
        ? [
              { label: "UID", value: user.uid },
              { label: "Email", value: user.email ?? "Not provided" },
              {
                  label: "Display name",
                  value: user.displayName ?? "Not provided",
              },
              { label: "Role", value: user.role ?? "Not assigned" },
              {
                  label: "Photo URL",
                  value: user.photoURL ?? "Not provided",
              },
          ]
        : [];

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 font-body text-slate-800">
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                                Active user
                            </p>
                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                Account details
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    loading
                                        ? "bg-amber-100 text-amber-700"
                                        : user
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-rose-100 text-rose-700"
                                }`}
                            >
                                {loading
                                    ? "Loading"
                                    : user
                                      ? "Signed in"
                                      : "Signed out"}
                            </span>

                            {!loading && user && (
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Sign out
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center p-8 text-slate-500">
                        Loading user profile...
                    </div>
                ) : !user ? (
                    <div className="p-8 text-center text-slate-600">
                        <p className="text-lg font-medium">
                            No active user found.
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Sign in to view all profile details.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 p-6 sm:p-8">
                        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                            <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-200">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName ?? "User avatar"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                                        {user.displayName
                                            ?.charAt(0)
                                            ?.toUpperCase() ?? "U"}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {user.displayName ?? "Unnamed user"}
                                    </h2>
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                        {user.role ?? "No role"}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {user.email ?? "No email on file"}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {profileDetails.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-slate-200 bg-white p-4"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 break-words text-sm font-medium text-slate-800">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
