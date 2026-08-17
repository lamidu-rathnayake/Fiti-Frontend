"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import dynamic from "next/dynamic";

import { useAuth } from "@/lib/firebase/AuthContext";
import { auth } from "@/lib/firebase/config";
import { saveUserProfile } from "@/lib/firebase/user-profile";
import { createClientProfile, createTailorProfile } from "@/lib/api/endpoints/profiles";
import { addShopImage, createShop } from "@/lib/api/endpoints/shops";
import { FitiApiError } from "@/lib/api/client";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">Loading map...</div>
});

type Role = "client" | "tailor";

const destinationFor = (role: Role) => {
    if (role === "tailor") {
        return "/tailor/home";
    } else if (role === "client") {
        return "/client/home";
    } else {
        return "/login";
    }
}

export default function OnboardingPage() {
    const router = useRouter();
    const { user, dbRole, loading: authLoading, logout, setRole } = useAuth();
    const [role, setSelectedRole] = useState<Role | null>(null);
    const [form, setForm] = useState({
        displayName: auth.currentUser?.displayName ?? "",
        phone: auth.currentUser?.phoneNumber ?? "",
        city: "",
        address: "",
        shopName: "",
        specialty: "",
        profileImageUrl: auth.currentUser?.photoURL ?? "",
        shopImageUrl: "",
        nicFrontUrl: "",
        nicRearUrl: "",
        shopBio: "",
        registrationNumber: "",
        latitude: null as number | null,
        longitude: null as number | null,
        shopPhone: "",
        shopCity: "",
        shopAddress: "",
        shopLatitude: null as number | null,
        shopLongitude: null as number | null,
    });
    const [usePersonalAddress, setUsePersonalAddress] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [shopImageFile, setShopImageFile] = useState<File | null>(null);
    const [nicFrontFile, setNicFrontFile] = useState<File | null>(null);
    const [nicRearFile, setNicRearFile] = useState<File | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (dbRole) {
            router.replace(destinationFor(dbRole));
        }
    }, [authLoading, router, user, dbRole]);

    const updateField = (field: keyof typeof form, value: any) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            router.replace("/login");
            return;
        }

        if (!role) {
            setError("Choose how you want to use the marketplace.");
            return;
        }

        if (!form.displayName.trim() || !form.city.trim()) {
            setError("Enter your name and city.");
            return;
        }

        if (
            role === "tailor" &&
            (!form.shopName.trim() || !form.specialty.trim())
        ) {
            setError("Enter your shop name and specialty.");
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            const uploadImageToCloudinary = async (file: File) => {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset);
                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: formData,
                });
                if (!res.ok) throw new Error("Image upload failed");
                const data = await res.json();
                return data.secure_url;
            };

            let finalProfileImageUrl = form.profileImageUrl;
            let finalShopImageUrl = form.shopImageUrl;
            let finalNicFrontUrl = form.nicFrontUrl;
            let finalNicRearUrl = form.nicRearUrl;

            if (profileImageFile) finalProfileImageUrl = await uploadImageToCloudinary(profileImageFile);
            if (shopImageFile) finalShopImageUrl = await uploadImageToCloudinary(shopImageFile);
            if (nicFrontFile) finalNicFrontUrl = await uploadImageToCloudinary(nicFrontFile);
            if (nicRearFile) finalNicRearUrl = await uploadImageToCloudinary(nicRearFile);

            const displayName = form.displayName.trim();
            const photoURL = finalProfileImageUrl.trim() || firebaseUser.photoURL || null;
            await updateProfile(firebaseUser, { displayName, photoURL });

            // Create profile on backend
            await firebaseUser.getIdToken(true); // Force refresh to include new photoURL

            try {
                if (role === "tailor") {
                    await createTailorProfile({
                        nic_front: finalNicFrontUrl.trim() || null,
                        nic_rear: finalNicRearUrl.trim() || null,
                    });
                } else {
                    await createClientProfile();
                }
            } catch (err) {
                if (!(err instanceof FitiApiError && err.status === 409)) throw err;
            }

            if (role === "tailor") {
                const shop = await createShop({
                    shop_name: form.shopName.trim(),
                    shop_bio: form.shopBio.trim() || null,
                    shop_address: usePersonalAddress ? (form.address.trim() || null) : (form.shopAddress.trim() || null),
                    city: usePersonalAddress ? (form.city.trim() || null) : (form.shopCity.trim() || null),
                    contact_number: usePersonalAddress ? (form.phone.trim() || null) : (form.shopPhone.trim() || null),
                    registration_number: form.registrationNumber.trim() || null,
                    latitude: usePersonalAddress ? form.latitude : form.shopLatitude,
                    longitude: usePersonalAddress ? form.longitude : form.shopLongitude,
                });

                const shopImageUrl = finalShopImageUrl.trim() || photoURL;
                if (shopImageUrl) {
                    await addShopImage(shop.shop_id, { image_url: shopImageUrl });
                }
            }

            await saveUserProfile({
                user: firebaseUser,
                role,
                displayName,
                photoURL,
                phone: form.phone.trim() || null,
                city: form.city.trim() || null,
                address: form.address.trim() || null,
                specialty: role === "tailor" ? form.specialty.trim() : undefined,
                latitude: role === "tailor" ? form.latitude : undefined,
                longitude: role === "tailor" ? form.longitude : undefined,
            });

            setRole(role);
            router.replace(destinationFor(role));
        } catch (caughtError: unknown) {
            console.error("Unable to complete onboarding:", caughtError);
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Unable to save your profile. Please try again.",
            );
            setSubmitting(false);
        }
    };

    const handleUseAnotherAccount = async () => {
        await logout();
        router.replace("/login");
    };

    if (authLoading || !user || dbRole) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-sm text-slate-500">
                Preparing your profile...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl">
                <div className="mb-8">
                    <p className="text-sm font-medium text-slate-500">
                        Signed in as {user.email}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        Complete your profile
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Choose your role and add the details needed to get
                        started.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    {error && (
                        <div
                            aria-live="polite"
                            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    <fieldset>
                        <legend className="mb-3 text-sm font-semibold text-slate-800">
                            Account type
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                            {(["client", "tailor"] as const).map(
                                (option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        aria-pressed={role === option}
                                        onClick={() => setSelectedRole(option)}
                                        disabled={submitting}
                                        className={`rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition ${role === option
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ),
                            )}
                        </div>
                    </fieldset>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="text-sm font-medium text-slate-700">
                            Full name
                            <input
                                value={form.displayName}
                                onChange={(event) =>
                                    updateField(
                                        "displayName",
                                        event.target.value,
                                    )
                                }
                                required
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Phone number
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    updateField("phone", event.target.value)
                                }
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            City
                            <input
                                value={form.city}
                                onChange={(event) =>
                                    updateField("city", event.target.value)
                                }
                                required
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Address
                            <input
                                value={form.address}
                                onChange={(event) =>
                                    updateField("address", event.target.value)
                                }
                                disabled={submitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                            Personal Location (Optional)
                            <p className="text-xs text-slate-500 font-normal mt-1 mb-2">Drag the pin to your home or current location.</p>
                            <LocationPicker onChange={(loc: { lat: number, lng: number }) => { updateField("latitude", loc.lat); updateField("longitude", loc.lng); }} />
                        </label>

                        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                            Profile Picture (Optional)
                            <div className="mt-2 flex items-center gap-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                        if (event.target.files?.[0]) {
                                            setProfileImageFile(event.target.files[0]);
                                        }
                                    }}
                                    disabled={submitting}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                />
                                {profileImageFile && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                            </div>
                        </label>
                    </div>

                    {role === "tailor" && (
                        <div className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                                Shop name
                                <input
                                    value={form.shopName}
                                    onChange={(event) =>
                                        updateField(
                                            "shopName",
                                            event.target.value,
                                        )
                                    }
                                    required
                                    disabled={submitting}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Specialty
                                <input
                                    value={form.specialty}
                                    onChange={(event) =>
                                        updateField("specialty", event.target.value)
                                    }
                                    required
                                    disabled={submitting}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                Shop Bio (Optional)
                                <textarea
                                    value={form.shopBio}
                                    onChange={(event) => updateField("shopBio", event.target.value)}
                                    placeholder="Tell us about your shop..."
                                    disabled={submitting}
                                    rows={3}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 resize-none"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                Registration Number (Optional)
                                <input
                                    value={form.registrationNumber}
                                    onChange={(event) => updateField("registrationNumber", event.target.value)}
                                    placeholder="Business Registration Number"
                                    disabled={submitting}
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <div className="col-span-1 sm:col-span-2">
                                <div className="flex items-start gap-3 py-3 border-y border-slate-100 my-2">
                                    <input
                                        type="checkbox"
                                        id="usePersonalAddress"
                                        checked={usePersonalAddress}
                                        onChange={(e) => setUsePersonalAddress(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <label htmlFor="usePersonalAddress" className="text-sm text-slate-700 leading-snug">
                                        <span className="font-medium block mb-0.5">My shop uses my personal address</span>
                                        We'll automatically use the contact info and map location you provided above for your shop.
                                    </label>
                                </div>
                            </div>

                            {!usePersonalAddress && (
                                <div className="col-span-1 sm:col-span-2 grid gap-5 sm:grid-cols-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="text-sm font-medium text-slate-700">
                                        Shop Phone
                                        <input
                                            type="tel"
                                            value={form.shopPhone}
                                            onChange={(event) => updateField("shopPhone", event.target.value)}
                                            placeholder="+94 77 123 4567"
                                            disabled={submitting}
                                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700">
                                        Shop City
                                        <input
                                            value={form.shopCity}
                                            onChange={(event) => updateField("shopCity", event.target.value)}
                                            placeholder="Colombo"
                                            disabled={submitting}
                                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Shop Address
                                        <input
                                            value={form.shopAddress}
                                            onChange={(event) => updateField("shopAddress", event.target.value)}
                                            placeholder="123 Market Street"
                                            disabled={submitting}
                                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                        Shop Location (Optional)
                                        <LocationPicker onChange={(loc: { lat: number, lng: number }) => { updateField("shopLatitude", loc.lat); updateField("shopLongitude", loc.lng); }} />
                                    </label>
                                </div>
                            )}

                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                Shop Picture (Optional)
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            if (event.target.files?.[0]) {
                                                setShopImageFile(event.target.files[0]);
                                            }
                                        }}
                                        disabled={submitting}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {shopImageFile && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                                </div>
                            </label>

                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                NIC Front (Optional)
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            if (event.target.files?.[0]) {
                                                setNicFrontFile(event.target.files[0]);
                                            }
                                        }}
                                        disabled={submitting}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {nicFrontFile && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                                </div>
                            </label>

                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                NIC Rear (Optional)
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                            if (event.target.files?.[0]) {
                                                setNicRearFile(event.target.files[0]);
                                            }
                                        }}
                                        disabled={submitting}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                    />
                                    {nicRearFile && <span className="text-xs text-green-600 font-medium">Selected ✓</span>}
                                </div>
                            </label>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
                        <button
                            type="button"
                            onClick={handleUseAnotherAccount}
                            disabled={submitting}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Use another account
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Saving profile..." : "Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
