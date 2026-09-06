"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    getShop,
    updateShop,
    addShopWork,
    deleteShopWork,
} from "@/lib/api/endpoints/shops";
import type { Shop } from "@/lib/api/types/shop";
import { useAuth } from "@/lib/firebase/AuthContext";
import { validatePhoneNumber } from "@/lib/phone";
import { uploadToCloudinary } from "@/lib/cloudinary";
import FullPageLock from "@/components/FullPageLock";

export default function ShopProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = params.shopId as string;
    const { user } = useAuth();
    const shouldEdit = false;

    const [shop, setShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Edit form fields
    const [shopName, setShopName] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [shopBio, setShopBio] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [city, setCity] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");

    // Portfolio Image upload states
    const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
    const [workFile, setWorkFile] = useState<File | null>(null);
    const [workDescription, setWorkDescription] = useState("");
    const [workFilePreview, setWorkFilePreview] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const fetchShopDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getShop(Number(shopId));
            setShop(data);
            // Populate edit form defaults
            setShopName(data.shop_name || "");
            setSpecialty(data.specialty || "");
            setShopBio(data.shop_bio || "");
            setShopAddress(data.shop_address || "");
            setCity(data.city || "");
            setContactNumber(data.contact_number || "");
            setRegistrationNumber(data.registration_number || "");
        } catch (error) {
            console.error("Failed to load shop details:", error);
        } finally {
            setIsLoading(false);
        }
    }, [shopId]);

    useEffect(() => {
        if (shopId) {
            fetchShopDetails();
        }
    }, [shopId, fetchShopDetails]);

    const isOwner = Boolean(user && shop && user.uid === shop.tailor_id);

    useEffect(() => {
        if (shouldEdit && shop && isOwner) {
            setIsEditOpen(true);
        }
    }, [shouldEdit, shop, isOwner]);

    const handleUpdateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shop) return;

        const trimmedName = shopName.trim();
        if (!trimmedName) {
            setEditError("Shop name is required.");
            return;
        }

        const trimmedAddress = shopAddress.trim();
        if (trimmedAddress && trimmedAddress.length < 5) {
            setEditError("Address must be at least 5 characters long.");
            return;
        }

        const trimmedCity = city.trim();
        if (trimmedCity && trimmedCity.length < 2) {
            setEditError("City name must be at least 2 characters long.");
            return;
        }

        const trimmedSpecialty = specialty.trim();
        if (trimmedSpecialty && trimmedSpecialty.length < 2) {
            setEditError("Specialty must be at least 2 characters long.");
            return;
        }

        const trimmedReg = registrationNumber.trim();
        if (trimmedReg && trimmedReg.length < 2) {
            setEditError(
                "Registration number must be at least 2 characters long.",
            );
            return;
        }

        let normalizedPhone: string | undefined = undefined;
        if (contactNumber.trim()) {
            const phoneVal = validatePhoneNumber(contactNumber);
            if (!phoneVal.isValid) {
                setEditError(
                    phoneVal.error || "Please enter a valid phone number.",
                );
                return;
            }
            normalizedPhone = phoneVal.normalized || undefined;
        }

        setIsSaving(true);
        setEditError(null);

        try {
            const updated = await updateShop(shop.shop_id, {
                shop_name: trimmedName,
                specialty: trimmedSpecialty || null,
                shop_bio: shopBio.trim() || null,
                shop_address: trimmedAddress || null,
                city: trimmedCity || null,
                contact_number: normalizedPhone || null,
                registration_number: trimmedReg || null,
            });
            setShop(updated);
            setShopName(updated.shop_name || "");
            setSpecialty(updated.specialty || "");
            setShopBio(updated.shop_bio || "");
            setShopAddress(updated.shop_address || "");
            setCity(updated.city || "");
            setContactNumber(updated.contact_number || "");
            setRegistrationNumber(updated.registration_number || "");
            setIsEditOpen(false);
        } catch (err: any) {
            setEditError(
                err.detail || err.message || "Failed to update shop details.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishWorkSample = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shop) return;
        if (!workFile) {
            setUploadError("Please select an image file.");
            return;
        }
        if (!workDescription.trim()) {
            setUploadError("Please enter a text description of the work sample.");
            return;
        }

        setIsUploadingImage(true);
        setUploadError(null);

        try {
            const imageUrl = await uploadToCloudinary(workFile, "image");
            if (!imageUrl) {
                throw new Error("Image upload failed.");
            }
            await addShopWork(shop.shop_id, {
                image_url: imageUrl,
                description: workDescription.trim(),
            });
            setWorkFile(null);
            setWorkFilePreview(null);
            setWorkDescription("");
            setIsAddWorkModalOpen(false);
            await fetchShopDetails();
        } catch (err: any) {
            setUploadError(err.message || "Failed to publish portfolio work sample.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file || !shop) return;

        setWorkFile(file);
        setWorkFilePreview(URL.createObjectURL(file));
        setIsAddWorkModalOpen(true);
    };

    const handleDeleteImage = async (workId: number) => {
        if (!shop) return;
        if (
            !confirm(
                "Are you sure you want to delete this photo from your portfolio?",
            )
        )
            return;

        try {
            await deleteShopWork(shop.shop_id, workId);
            await fetchShopDetails();
        } catch (err: any) {
            alert(
                "Failed to delete image: " + (err.message || "Unknown error"),
            );
        }
    };

    if (isLoading) {
        return (
            <FullPageLock
                isLoading={true}
                title="Loading Atelier Profile"
                message="Retrieving tailor details and signature services..."
            />
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-warm-beige">
                <h2 className="text-xl font-bold text-earth-text font-serif">
                    Shop Not Found
                </h2>
                <p className="text-earth-text/60 text-sm font-medium">
                    The atelier you are looking for does not exist.
                </p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2.5 bg-cream-bg border border-accent/20 text-earth-text rounded-xl hover:border-accent hover:bg-accent hover:text-white transition-all cursor-pointer font-bold text-xs uppercase"
                >
                    &larr; Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-earth-text bg-warm-beige selection:bg-accent selection:text-white">
            <FullPageLock
                isSubmitting={isSaving || isUploadingImage}
                title={
                    isSaving
                        ? "Saving Shop Changes"
                        : "Uploading Portfolio Image"
                }
                message="Updating atelier details in database..."
            />

            {/* HERO / ATELIER HEADER SECTION */}
            <div className="w-full h-64 sm:h-80 relative overflow-hidden bg-stone-950 border-b border-accent/20">
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-earth-text to-amber-950 opacity-95" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-beige via-warm-beige/50 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent font-bold mb-2 block">
                            CERTIFIED ATELIER
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-bold text-earth-text font-serif tracking-tight">
                            {shop.shop_name}
                        </h1>
                        <p className="text-earth-text/80 mt-2 font-mono text-xs flex items-center gap-2 font-bold">
                            <span>📍 {shop.city || "Location Pending"}</span>
                            <span>&bull;</span>
                            <span className="text-accent">
                                &#9733;{" "}
                                {shop.average_rating && shop.average_rating > 0
                                    ? shop.average_rating.toFixed(1)
                                    : "New"}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isOwner ? (
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="px-6 py-3 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                            >
                                ✏️ Edit Shop Profile
                            </button>
                        ) : (
                            <Link
                                href={`/client/directRequest?shop_id=${shop.shop_id}`}
                                className="px-8 py-3 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all shadow-md shrink-0"
                            >
                                Request Garment &rarr;
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* LEFT COLUMN - ABOUT & INFO */}
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <div className="flex items-center justify-between border-b border-accent/15 pb-2 mb-4">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-earth-text/60">
                                About the Atelier
                            </h3>
                            {isOwner && (
                                <button
                                    onClick={() => setIsEditOpen(true)}
                                    className="text-[10px] font-bold text-accent hover:underline uppercase"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        <p className="text-earth-text/80 text-sm leading-relaxed font-medium">
                            {shop.shop_bio ||
                                "No description provided for this atelier yet."}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-4 border-b border-accent/15 pb-2">
                            Specialties
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {shop.specialty && shop.specialty.trim() ? (
                                shop.specialty.split(",").map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-cream-bg border border-accent/15 text-earth-text text-[10px] font-mono rounded-lg font-bold"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-earth-text/50 italic">
                                    General Tailoring
                                </span>
                            )}
                        </div>
                    </section>

                    <section className="bg-cream-bg p-5 rounded-2xl border border-accent/15 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-accent/10 pb-2">
                            <h3 className="text-xs font-serif font-bold uppercase tracking-widest text-accent">
                                Contact & Location
                            </h3>
                            {isOwner && (
                                <button
                                    onClick={() => setIsEditOpen(true)}
                                    className="text-[10px] font-bold text-accent hover:underline uppercase"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        <ul className="space-y-3 text-sm text-earth-text/80 font-medium">
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">📍</span>
                                <span>
                                    {shop.shop_address ||
                                        shop.city ||
                                        "Address not provided."}
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>📞</span>
                                <span>
                                    {shop.contact_number ||
                                        "Contact not provided."}
                                </span>
                            </li>
                            {shop.registration_number && (
                                <li className="flex items-center gap-2">
                                    <span>🏢</span>
                                    <span>Reg: {shop.registration_number}</span>
                                </li>
                            )}
                        </ul>
                    </section>
                </div>

                {/* RIGHT COLUMN - PORTFOLIO / GALLERY SHOWCASE */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6 border-b border-accent/15 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-earth-text font-serif">
                                    Atelier Work Showcase & Portfolio Cards
                                </h3>
                                <p className="text-xs text-earth-text/60 font-medium mt-0.5">
                                    Custom work samples, signature garments, and text descriptions
                                </p>
                            </div>

                            {isOwner && (
                                <button
                                    onClick={() => {
                                        setWorkFile(null);
                                        setWorkFilePreview(null);
                                        setWorkDescription("");
                                        setIsAddWorkModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                                >
                                    <span>📸</span> + Add Showcase Card
                                </button>
                            )}
                        </div>

                        {uploadError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl font-medium">
                                {uploadError}
                            </div>
                        )}

                        {/* CARD BY CARD PORTFOLIO GALLERY */}
                        {shop.works && shop.works.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {shop.works.map((work, i) => {
                                    return (
                                        <div
                                            key={work.work_id || i}
                                            className="bg-cream-bg border border-accent/20 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-accent/60 hover:shadow-md transition-all group"
                                        >
                                            <div
                                                className="w-full h-52 relative overflow-hidden bg-stone-950 cursor-pointer"
                                                onClick={() => setLightboxImage(work.image_url)}
                                            >
                                                <img
                                                    src={work.image_url}
                                                    alt={work.description || `${shop.shop_name} work sample ${i + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 p-2 text-center">
                                                    <span>🔍 View Dress Photo</span>
                                                    <span className="text-[10px] text-white/80 font-mono">
                                                        Sample #{i + 1}
                                                    </span>
                                                </div>
                                                {isOwner && work.work_id && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteImage(work.work_id!);
                                                        }}
                                                        title="Delete work sample card"
                                                        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow-md text-xs cursor-pointer"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>

                                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                                <div>
                                                    <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-block mb-2">
                                                        WORK SAMPLE #{i + 1}
                                                    </span>
                                                    <h4 className="text-sm font-bold text-earth-text leading-snug">
                                                        {work.description || "Bespoke piece"}
                                                    </h4>
                                                </div>

                                                <div className="pt-2 border-t border-accent/10 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLightboxImage(work.image_url)}
                                                        className="text-[11px] font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1"
                                                    >
                                                        <span>Inspect Details &rarr;</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-warm-beige border border-accent/20 flex items-center justify-center text-accent mx-auto text-xl">
                                    📸
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-earth-text font-serif">
                                        No Portfolio Showcase Cards Yet
                                    </h4>
                                    <p className="text-xs text-earth-text/60 mt-1 font-medium max-w-sm mx-auto">
                                        {isOwner
                                            ? "Showcase your craftsmanship by publishing work samples with descriptions for clients to see."
                                            : "This tailor has not published work showcase cards yet."}
                                    </p>
                                </div>

                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            setWorkFile(null);
                                            setWorkFilePreview(null);
                                            setWorkDescription("");
                                            setIsAddWorkModalOpen(true);
                                        }}
                                        className="inline-block px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer shadow-md"
                                    >
                                        + Add First Showcase Card
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <section className="max-w-7xl mx-auto w-full px-6 sm:px-12 pb-12">
                <div className="border-b border-accent/15 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-earth-text font-serif">
                        Services &amp; Gigs
                    </h2>
                    <p className="text-xs text-earth-text/60 mt-1">
                        Choose a service and send an inquiry to this atelier.
                    </p>
                </div>
                {shop.gigs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {shop.gigs.map((gig) => (
                            <article
                                key={gig.gig_id}
                                className="bg-cream-bg border border-accent/20 rounded-2xl overflow-hidden shadow-sm"
                            >
                                {gig.image_url && (
                                    <img
                                        src={gig.image_url}
                                        alt={gig.title}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                <div className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-bold text-earth-text">
                                            {gig.title}
                                        </h3>
                                        <span className="font-mono text-sm font-bold text-accent whitespace-nowrap">
                                            LKR {gig.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-earth-text/70">
                                        {gig.description}
                                    </p>
                                    <p className="text-xs text-earth-text/60">
                                        {gig.category || "Custom tailoring"}
                                        {gig.delivery_time
                                            ? ` • ${gig.delivery_time}`
                                            : ""}
                                    </p>
                                    <Link
                                        href={`/client/directRequest?shop_id=${shop.shop_id}`}
                                        className="block w-full text-center py-2.5 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider"
                                    >
                                        Inquire about this gig
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-earth-text/60">
                        This atelier has not published any gigs yet.
                    </p>
                )}
            </section>

            {/* EDIT SHOP MODAL FOR TAILOR */}
            {isEditOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-text/40 backdrop-blur-sm"
                    onClick={() => setIsEditOpen(false)}
                >
                    <div
                        className="bg-cream-bg border border-accent/30 w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-earth-text space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-accent/20 pb-4">
                            <h2 className="text-xl font-bold font-serif text-earth-text">
                                Edit Atelier Details
                            </h2>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="text-earth-text/50 hover:text-earth-text font-bold text-lg"
                            >
                                &times;
                            </button>
                        </div>

                        {editError && (
                            <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl font-medium">
                                {editError}
                            </div>
                        )}

                        <form onSubmit={handleUpdateShop} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                    Shop Name *
                                </label>
                                <input
                                    type="text"
                                    value={shopName}
                                    onChange={(e) =>
                                        setShopName(e.target.value)
                                    }
                                    required
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                    Specialties (Comma Separated)
                                </label>
                                <input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) =>
                                        setSpecialty(e.target.value)
                                    }
                                    placeholder="e.g. Bespoke Suits, Shirts, Alterations"
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                    Shop Bio / Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={shopBio}
                                    onChange={(e) => setShopBio(e.target.value)}
                                    placeholder="Describe your tailoring craftsmanship..."
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) =>
                                            setCity(e.target.value)
                                        }
                                        placeholder="e.g. Colombo"
                                        className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                        Contact Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={contactNumber}
                                        onChange={(e) =>
                                            setContactNumber(e.target.value)
                                        }
                                        placeholder="e.g. 0771234567"
                                        className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={shopAddress}
                                    onChange={(e) =>
                                        setShopAddress(e.target.value)
                                    }
                                    placeholder="Full street address"
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70">
                                    Business Registration Number
                                </label>
                                <input
                                    type="text"
                                    value={registrationNumber}
                                    onChange={(e) =>
                                        setRegistrationNumber(e.target.value)
                                    }
                                    placeholder="Optional reg number"
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl px-4 py-2.5 text-xs text-earth-text focus:outline-none font-medium"
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-accent/20">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/70 block">
                                    Add Portfolio Work / Dress Image
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="px-4 py-2.5 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer shadow-sm flex items-center gap-2">
                                        <span>📸</span>{" "}
                                        {isUploadingImage
                                            ? "Uploading..."
                                            : "Upload Dress Photo"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isUploadingImage}
                                        />
                                    </label>
                                    {shop.works.length > 0 && (
                                        <span className="text-xs text-earth-text/60 font-medium">
                                            ({shop.works.length} photos
                                            currently in gallery)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-accent/20">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-accent/20 text-xs font-bold uppercase text-earth-text/70 hover:bg-warm-beige"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-hover disabled:opacity-50 shadow-md"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL FOR ADDING WORK SHOWCASE CARD WITH DESCRIPTION */}
            {isAddWorkModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsAddWorkModalOpen(false)}
                >
                    <div
                        className="bg-cream-bg border border-accent/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-accent/20 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-earth-text font-serif">
                                    Publish Portfolio Work Card
                                </h3>
                                <p className="text-xs text-earth-text/70 mt-0.5">
                                    Add a showcase image and text description for public view
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddWorkModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-warm-beige border border-accent/20 text-earth-text font-bold flex items-center justify-center hover:border-accent transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handlePublishWorkSample} className="space-y-4">
                            {uploadError && (
                                <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl font-medium">
                                    {uploadError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/80 block">
                                    1. Select Work Sample Photo *
                                </label>
                                <div className="border-2 border-dashed border-accent/30 rounded-2xl p-4 text-center hover:border-accent transition-colors bg-warm-beige/30">
                                    {workFilePreview ? (
                                        <div className="relative w-full h-44 rounded-xl overflow-hidden mb-2 border border-accent/20">
                                            <img
                                                src={workFilePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setWorkFile(null);
                                                    setWorkFilePreview(null);
                                                }}
                                                className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg uppercase"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block py-6">
                                            <span className="text-3xl block mb-2">📸</span>
                                            <span className="text-xs font-bold text-accent uppercase block">
                                                Click to Choose Image File
                                            </span>
                                            <span className="text-[10px] text-earth-text/50 block mt-1">
                                                PNG, JPG or WEBP up to 10MB
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-earth-text/80 block">
                                    2. Garment / Work Sample Description *
                                </label>
                                <textarea
                                    value={workDescription}
                                    onChange={(e) => setWorkDescription(e.target.value)}
                                    placeholder="Describe your work sample (e.g. Bespoke Italian Silk Wedding Suit with Gold Hand Threadwork)..."
                                    required
                                    rows={3}
                                    className="w-full bg-warm-beige border border-accent/20 focus:border-accent rounded-xl p-3 text-xs text-earth-text focus:outline-none font-medium resize-none placeholder:text-earth-text/40"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-accent/20">
                                <button
                                    type="button"
                                    onClick={() => setIsAddWorkModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-accent/20 text-xs font-bold uppercase text-earth-text/70 hover:bg-warm-beige cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploadingImage || !workFile || !workDescription.trim()}
                                    className="px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-hover disabled:opacity-50 shadow-md cursor-pointer"
                                >
                                    {isUploadingImage ? "Publishing Card..." : "Publish Work Card"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL FOR WORK SAMPLE IMAGES AND DESCRIPTIONS */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                    onClick={() => setLightboxImage(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-stone-950 border border-stone-800 flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 text-white font-bold text-xl flex items-center justify-center hover:bg-black transition-colors cursor-pointer border border-white/20"
                        >
                            &times;
                        </button>
                        <div className="flex-1 flex items-center justify-center bg-black p-4 min-h-[50vh] max-h-[75vh]">
                            <img
                                src={lightboxImage}
                                alt="Full-size dress work sample"
                                className="w-full h-full object-contain max-h-[70vh] rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
