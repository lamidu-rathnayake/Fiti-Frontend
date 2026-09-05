"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    createGig,
    deleteGig,
    getShop,
    updateShop,
    addShopWork,
    deleteShopWork,
} from "@/lib/api/endpoints/shops";
import type { Gig, Shop } from "@/lib/api/types/shop";
import { uploadToCloudinary } from "@/lib/cloudinary";
import FullPageLock from "@/components/FullPageLock";

const emptyGig = {
    title: "",
    description: "",
    price: "",
    category: "",
    delivery_time: "",
};

export default function TailorShopPage() {
    const { user } = useAuth();
    const params = useParams();
    const shopId = Number(params.shopId);
    const [shop, setShop] = useState<Shop | null>(null);
    const [form, setForm] = useState({
        shop_name: "",
        specialty: "",
        shop_bio: "",
        shop_address: "",
        city: "",
        contact_number: "",
        registration_number: "",
    });
    const [gigForm, setGigForm] = useState(emptyGig);
    const [gigImage, setGigImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Work photo upload state
    const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
    const [workFile, setWorkFile] = useState<File | null>(null);
    const [workFilePreview, setWorkFilePreview] = useState<string | null>(null);
    const [workDescription, setWorkDescription] = useState("");
    const [isUploadingWork, setIsUploadingWork] = useState(false);
    const [lightboxWorkImage, setLightboxWorkImage] = useState<string | null>(null);

    const loadShop = useCallback(async () => {
        if (!shopId) return;
        setLoading(true);
        try {
            const data = await getShop(shopId);
            setShop(data);
            setForm({
                shop_name: data.shop_name || "",
                specialty: data.specialty || "",
                shop_bio: data.shop_bio || "",
                shop_address: data.shop_address || "",
                city: data.city || "",
                contact_number: data.contact_number || "",
                registration_number: data.registration_number || "",
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load shop.",
            );
        } finally {
            setLoading(false);
        }
    }, [shopId]);

    useEffect(() => {
        void loadShop();
    }, [loadShop]);

    const saveProfile = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!shop) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await updateShop(shop.shop_id, {
                shop_name: form.shop_name.trim(),
                specialty: form.specialty.trim() || null,
                shop_bio: form.shop_bio.trim() || null,
                shop_address: form.shop_address.trim() || null,
                city: form.city.trim() || null,
                contact_number: form.contact_number.trim() || null,
                registration_number: form.registration_number.trim() || null,
            });
            setShop(updated);
            setMessage(
                "Shop profile updated. Clients will see these changes immediately.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update shop profile.",
            );
        } finally {
            setSaving(false);
        }
    };

    const uploadShopImage = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file || !shop) return;
        setSaving(true);
        setError(null);
        try {
            const imageUrl = await uploadToCloudinary(file, "image");
            if (!imageUrl) throw new Error("Cloudinary image upload failed.");
            await updateShop(shop.shop_id, { profile_image_url: imageUrl });
            await loadShop();
            setMessage("Shop profile image added.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to upload image.",
            );
        } finally {
            setSaving(false);
            event.target.value = "";
        }
    };

    const addNewGig = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!shop) return;
        setSaving(true);
        setError(null);
        try {
            let imageUrl: string | null = null;
            if (gigImage)
                imageUrl = await uploadToCloudinary(gigImage, "image");
            await createGig(shop.shop_id, {
                title: gigForm.title.trim(),
                description: gigForm.description.trim(),
                price: Number(gigForm.price),
                category: gigForm.category.trim() || null,
                delivery_time: gigForm.delivery_time.trim() || null,
                image_url: imageUrl,
            });
            setGigForm(emptyGig);
            setGigImage(null);
            await loadShop();
            setMessage("Gig published to your client shop page.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to publish gig.",
            );
        } finally {
            setSaving(false);
        }
    };

    const removeGig = async (gig: Gig) => {
        if (!confirm(`Delete ${gig.title}?`)) return;
        setSaving(true);
        try {
            await deleteGig(gig.gig_id);
            await loadShop();
            setMessage("Gig deleted.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to delete gig.",
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePublishWorkSample = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shop) return;
        if (!workFile) {
            setError("Please select an image file.");
            return;
        }
        if (!workDescription.trim()) {
            setError("Please enter a description for the work sample.");
            return;
        }
        setIsUploadingWork(true);
        setError(null);
        try {
            const imageUrl = await uploadToCloudinary(workFile, "image");
            if (!imageUrl) throw new Error("Image upload failed. Please try again.");
            await addShopWork(shop.shop_id, {
                image_url: imageUrl,
                description: workDescription.trim(),
            });
            setMessage("Work card published successfully!");
            setWorkFile(null);
            setWorkFilePreview(null);
            setWorkDescription("");
            setIsAddWorkModalOpen(false);
            await loadShop();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to publish work card.");
        } finally {
            setIsUploadingWork(false);
        }
    };

    const handleWorkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setWorkFile(file);
        setWorkFilePreview(URL.createObjectURL(file));
        setIsAddWorkModalOpen(true);
    };

    const handleDeleteWork = async (workId: number) => {
        if (!shop) return;
        if (!confirm("Are you sure you want to delete this work photo?")) return;
        setSaving(true);
        try {
            await deleteShopWork(shop.shop_id, workId);
            setMessage("Work photo deleted.");
            await loadShop();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete work photo.");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <FullPageLock
                isLoading
                title="Loading Shop Studio"
                message="Retrieving your shop profile..."
            />
        );
    if (!shop || shop.tailor_id !== user?.uid) {
        return (
            <div className="min-h-screen bg-warm-beige p-12 text-center text-earth-text">
                Shop not found or access denied.
            </div>
        );
    }

    return (
        <>
            <main className="min-h-screen bg-warm-beige text-earth-text px-4 py-8 sm:px-8">
                <FullPageLock
                    isSubmitting={saving}
                    title="Saving Shop Studio"
                    message="Updating your public shop..."
                />
                <div className="mx-auto max-w-6xl space-y-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
                            Tailor shop studio
                        </p>
                        <h1 className="mt-2 text-3xl font-extrabold font-heading">
                            {shop.shop_name}
                        </h1>
                        <p className="mt-1 text-sm text-earth-text/65">
                            Manage the profile and gigs customers see.
                        </p>
                    </div>
                    <Link
                        href={`/client/shop/${shop.shop_id}`}
                        className="rounded-xl bg-accent px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
                    >
                        View client page
                    </Link>
                </header>
                {message && (
                    <div className="rounded-xl border border-emerald-600/25 bg-emerald-600/10 p-3 text-sm text-emerald-800">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="rounded-xl border border-red-600/25 bg-red-600/10 p-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                    <form
                        onSubmit={saveProfile}
                        className="space-y-4 rounded-2xl border border-accent/20 bg-cream-bg p-6 shadow-sm"
                    >
                        <h2 className="text-xl font-bold font-heading">
                            Editable profile
                        </h2>
                        {Object.entries(form).map(([key, value]) => (
                            <label key={key} className="block space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-earth-text/60">
                                    {key.replaceAll("_", " ")}
                                </span>
                                {key === "shop_bio" ? (
                                    <textarea
                                        value={value}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                [key]: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        className="w-full rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm outline-none focus:border-accent"
                                    />
                                ) : (
                                    <input
                                        value={value}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                [key]: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm outline-none focus:border-accent"
                                    />
                                )}
                            </label>
                        ))}
                        <button className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">
                            Save profile changes
                        </button>
                    </form>

                    <div className="space-y-6">
                        <section className="rounded-2xl border border-accent/20 bg-cream-bg p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-bold font-heading">
                                        Shop profile images
                                    </h2>
                                    <p className="text-xs text-earth-text/60">
                                        The first image is used as the client
                                        page cover.
                                    </p>
                                </div>
                                <label className="cursor-pointer rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">
                                    Add image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={uploadShopImage}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {shop.profile_image_url && (
                                <div className="mt-4">
                                    <img
                                        src={shop.profile_image_url}
                                        alt="Shop profile"
                                        className="h-32 w-32 rounded-xl object-cover"
                                    />
                                </div>
                            )}
                        </section>

                        <form
                            onSubmit={addNewGig}
                            className="space-y-4 rounded-2xl border border-accent/20 bg-cream-bg p-6 shadow-sm"
                        >
                            <h2 className="text-xl font-bold font-heading">
                                Publish a gig
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <input
                                    required
                                    placeholder="Gig title"
                                    value={gigForm.title}
                                    onChange={(e) =>
                                        setGigForm({
                                            ...gigForm,
                                            title: e.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm"
                                />
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    placeholder="Starting price (LKR)"
                                    value={gigForm.price}
                                    onChange={(e) =>
                                        setGigForm({
                                            ...gigForm,
                                            price: e.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm"
                                />
                                <input
                                    placeholder="Category"
                                    value={gigForm.category}
                                    onChange={(e) =>
                                        setGigForm({
                                            ...gigForm,
                                            category: e.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm"
                                />
                                <input
                                    placeholder="Delivery time"
                                    value={gigForm.delivery_time}
                                    onChange={(e) =>
                                        setGigForm({
                                            ...gigForm,
                                            delivery_time: e.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm"
                                />
                            </div>
                            <textarea
                                required
                                placeholder="Describe what the customer receives, materials, fit, revisions, and other details."
                                value={gigForm.description}
                                onChange={(e) =>
                                    setGigForm({
                                        ...gigForm,
                                        description: e.target.value,
                                    })
                                }
                                rows={4}
                                className="w-full rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm"
                            />
                            <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-earth-text/60">
                                    Gig image
                                </span>
                                <label
                                    htmlFor="gig-image-upload"
                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-accent/35 bg-warm-beige px-4 py-3 transition-colors hover:border-accent hover:bg-accent/5"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent" aria-hidden="true">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            className="h-5 w-5"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 -4 4m4-4 4 4M5 14v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
                                        </svg>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-bold text-earth-text">
                                            {gigImage?.name || "Choose a gig image"}
                                        </span>
                                        <span className="block text-[11px] text-earth-text/55">
                                            JPG, PNG, or WEBP up to 10 MB
                                        </span>
                                    </span>
                                    <span className="shrink-0 rounded-lg bg-accent px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
                                        Browse
                                    </span>
                                    <input
                                        id="gig-image-upload"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) =>
                                            setGigImage(e.target.files?.[0] || null)
                                        }
                                        className="sr-only"
                                    />
                                </label>
                            </div>
                            <button className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase tracking-wider text-white">
                                Publish gig
                            </button>
                        </form>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold font-heading">
                        Published gigs
                    </h2>
                    <div className="grid gap-5 md:grid-cols-2">
                        {shop.gigs.map((gig) => (
                            <article
                                key={gig.gig_id}
                                className="overflow-hidden rounded-2xl border border-accent/20 bg-cream-bg shadow-sm"
                            >
                                {gig.image_url && (
                                    <img
                                        src={gig.image_url}
                                        alt={gig.title}
                                        className="h-48 w-full object-cover"
                                    />
                                )}
                                <div className="space-y-3 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-bold">
                                            {gig.title}
                                        </h3>
                                        <span className="font-mono text-sm font-bold text-accent">
                                            LKR {gig.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-earth-text/70">
                                        {gig.description}
                                    </p>
                                    <p className="text-xs text-earth-text/60">
                                        {gig.category || "Custom tailoring"}{" "}
                                        {gig.delivery_time
                                            ? `• ${gig.delivery_time}`
                                            : ""}
                                    </p>
                                    <button
                                        onClick={() => void removeGig(gig)}
                                        className="text-xs font-bold uppercase tracking-wider text-red-700"
                                    >
                                        Delete gig
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── MY WORKS / PORTFOLIO SECTION ── */}
                <section className="space-y-6 border-t border-accent/20 pt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
                                Craftsmanship &amp; Portfolio
                            </p>
                            <h2 className="mt-1 text-2xl font-extrabold font-heading">
                                My Works
                            </h2>
                            <p className="mt-1 text-sm text-earth-text/65">
                                Manage work sample photos visible to clients.
                            </p>
                        </div>
                        <label className="cursor-pointer rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <span>📸</span>{" "}
                            {isUploadingWork ? "Uploading..." : "+ Add Work Photo"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleWorkUpload}
                                className="hidden"
                                disabled={isUploadingWork}
                            />
                        </label>
                    </div>

                    {/* Portfolio hero banner */}
                    <div className="bg-gradient-to-r from-amber-950 via-earth-text to-stone-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent font-bold">
                                PORTFOLIO SHOWCASE
                            </span>
                            <h3 className="text-2xl font-bold font-serif">
                                Showcase Your Bespoke Creations
                            </h3>
                            <p className="text-xs text-white/80 max-w-lg leading-relaxed font-medium">
                                Upload high-quality images of custom dresses, suits, wedding wear,
                                traditional garments, and alterations. Potential clients browse your
                                portfolio before sending direct garment requests!
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setWorkFile(null);
                                setWorkFilePreview(null);
                                setWorkDescription("");
                                setIsAddWorkModalOpen(true);
                            }}
                            className="px-6 py-3.5 bg-accent text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-accent-hover transition-all cursor-pointer shadow-lg shrink-0 flex items-center gap-2 border border-white/20"
                        >
                            <span>✨</span> + Add Work Card
                        </button>
                    </div>

                    {/* Gallery grid */}
                    {shop.works && shop.works.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {shop.works.map((work, index) => {
                                return (
                                    <div
                                        key={work.work_id || index}
                                        className="bg-cream-bg border border-accent/20 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-accent hover:shadow-md transition-all group"
                                    >
                                        <div
                                            className="w-full h-48 relative overflow-hidden bg-stone-950 cursor-pointer"
                                            onClick={() => setLightboxWorkImage(work.image_url)}
                                        >
                                            <img
                                                src={work.image_url}
                                                alt={work.description || `Work sample ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 p-2 text-center">
                                                <span>🔍 Inspect Photo</span>
                                                <span className="text-[10px] text-white/80 font-mono">Card #{index + 1}</span>
                                            </div>
                                            {work.work_id && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void handleDeleteWork(work.work_id!);
                                                    }}
                                                    title="Delete work card"
                                                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow-md text-xs cursor-pointer"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                                            <div>
                                                <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-block mb-1">
                                                    CARD #{index + 1}
                                                </span>
                                                <p className="text-xs font-semibold text-earth-text leading-relaxed">
                                                    {work.description || "Custom garment showcase work sample."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => {
                                    setWorkFile(null);
                                    setWorkFilePreview(null);
                                    setWorkDescription("");
                                    setIsAddWorkModalOpen(true);
                                }}
                                className="border-2 border-dashed border-accent/30 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-accent transition-colors cursor-pointer bg-cream-bg/40 aspect-square min-h-[220px]"
                            >
                                <span className="text-3xl mb-1">📸</span>
                                <span className="text-xs font-bold text-accent uppercase">+ Add Work Card</span>
                                <span className="text-[10px] text-earth-text/50 mt-1">PNG, JPG up to 10MB</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-cream-bg border border-accent/20 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-warm-beige border border-accent/20 flex items-center justify-center text-accent mx-auto text-3xl">
                                👗
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-earth-text font-serif">No Works Uploaded Yet</h3>
                                <p className="text-xs text-earth-text/60 max-w-sm mx-auto font-medium">
                                    Add photos of your completed tailoring projects to display them in your shop portfolio.
                                </p>
                            </div>
                            <label className="inline-block px-6 py-3 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer shadow-md">
                                Upload Your First Work Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleWorkUpload}
                                    className="hidden"
                                    disabled={isUploadingWork}
                                />
                            </label>
                        </div>
                    )}
                </section>
            </div>
        </main>

        {/* ── LIGHTBOX ── */}
        {lightboxWorkImage && (
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setLightboxWorkImage(null)}
            >
                <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                    <img
                        src={lightboxWorkImage}
                        alt="Work sample"
                        className="w-full h-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                    />
                    <button
                        onClick={() => setLightboxWorkImage(null)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors text-lg"
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}

        {/* ── ADD WORK MODAL ── */}
        {isAddWorkModalOpen && (
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setIsAddWorkModalOpen(false)}
            >
                <form
                    onSubmit={(e) => void handlePublishWorkSample(e)}
                    className="bg-cream-bg rounded-3xl border border-accent/20 shadow-2xl w-full max-w-lg p-8 space-y-5"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-xl font-bold font-heading">Publish Work Card</h2>
                    {workFilePreview && (
                        <img
                            src={workFilePreview}
                            alt="Preview"
                            className="w-full h-52 object-cover rounded-2xl border border-accent/20"
                        />
                    )}
                    {!workFilePreview && (
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-accent/35 bg-warm-beige px-4 py-3 hover:border-accent hover:bg-accent/5 transition-colors">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">📸</span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-earth-text">{workFile?.name || "Choose a photo"}</span>
                                <span className="block text-[11px] text-earth-text/55">JPG, PNG, or WEBP up to 10 MB</span>
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        setWorkFile(f);
                                        setWorkFilePreview(URL.createObjectURL(f));
                                    }
                                }}
                                className="sr-only"
                            />
                        </label>
                    )}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-earth-text/60">Description</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Describe this garment work (fabric, style, occasion, etc.)"
                            value={workDescription}
                            onChange={(e) => setWorkDescription(e.target.value)}
                            className="w-full rounded-xl border border-accent/20 bg-warm-beige px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddWorkModalOpen(false)}
                            className="flex-1 rounded-xl border border-accent/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-earth-text hover:bg-warm-beige transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUploadingWork || !workFile}
                            className="flex-1 rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                        >
                            {isUploadingWork ? "Publishing..." : "Publish Work Card"}
                        </button>
                    </div>
                </form>
            </div>
        )}
    </>
    );
}
