"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getShop, updateShop, addShopImage, deleteShopImage } from "@/lib/api/endpoints/shops";
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
    const { user, role } = useAuth();
    const shouldEdit = searchParams.get("edit") === "true";

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

    const isOwner = Boolean(
        user && shop && user.uid === shop.tailor_id
    );

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
            setEditError("Registration number must be at least 2 characters long.");
            return;
        }

        let normalizedPhone: string | undefined = undefined;
        if (contactNumber.trim()) {
            const phoneVal = validatePhoneNumber(contactNumber);
            if (!phoneVal.isValid) {
                setEditError(phoneVal.error || "Please enter a valid phone number.");
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
            setEditError(err.detail || err.message || "Failed to update shop details.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shop) return;

        setIsUploadingImage(true);
        setUploadError(null);

        try {
            const imageUrl = await uploadToCloudinary(file, "image");
            if (!imageUrl) {
                throw new Error("Image upload failed.");
            }
            await addShopImage(shop.shop_id, { image_url: imageUrl });
            await fetchShopDetails();
        } catch (err: any) {
            setUploadError(err.message || "Failed to upload portfolio image.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!shop) return;
        if (!confirm("Are you sure you want to delete this photo from your portfolio?")) return;

        try {
            await deleteShopImage(shop.shop_id, imageId);
            await fetchShopDetails();
        } catch (err: any) {
            alert("Failed to delete image: " + (err.message || "Unknown error"));
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
                <h2 className="text-xl font-bold text-earth-text font-serif">Shop Not Found</h2>
                <p className="text-earth-text/60 text-sm font-medium">The atelier you are looking for does not exist.</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2.5 bg-cream-bg border border-accent/20 text-earth-text rounded-xl hover:border-accent hover:bg-accent hover:text-white transition-all cursor-pointer font-bold text-xs uppercase"
                >
                    &larr; Go Back
                </button>
            </div>
        );
    }

    const coverImage = shop.images && shop.images.length > 0 ? shop.images[0].image_url : null;

    return (
        <div className="min-h-screen text-earth-text bg-warm-beige selection:bg-accent selection:text-white">
            <FullPageLock
                isSubmitting={isSaving || isUploadingImage}
                title={isSaving ? "Saving Shop Changes" : "Uploading Portfolio Image"}
                message="Updating atelier details in database..."
            />

            {/* HERO / COVER SECTION */}
            <div className="w-full h-64 sm:h-80 relative overflow-hidden bg-slate-900">
                {coverImage ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-50"
                        style={{ backgroundImage: `url('${coverImage}')` }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-950 via-earth-text to-stone-900 opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-warm-beige via-warm-beige/60 to-transparent" />

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
                                &#9733; {shop.average_rating && shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"}
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
                            {shop.shop_bio || "No description provided for this atelier yet."}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-earth-text/60 mb-4 border-b border-accent/15 pb-2">
                            Specialties
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {shop.specialty && shop.specialty.trim() ? (
                                shop.specialty.split(",").map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-cream-bg border border-accent/15 text-earth-text text-[10px] font-mono rounded-lg font-bold">
                                        {tag.trim()}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-earth-text/50 italic">General Tailoring</span>
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
                                <span>{shop.shop_address || shop.city || "Address not provided."}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>📞</span>
                                <span>{shop.contact_number || "Contact not provided."}</span>
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

                {/* RIGHT COLUMN - PORTFOLIO / GALLERY */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6 border-b border-accent/15 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-earth-text font-serif">
                                    Atelier Portfolio & Gallery
                                </h3>
                                <p className="text-xs text-earth-text/60 font-medium mt-0.5">
                                    Craftsmanship showcases and recent tailored works
                                </p>
                            </div>

                            {isOwner && (
                                <label className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer shadow-sm">
                                    + Add Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={isUploadingImage}
                                    />
                                </label>
                            )}
                        </div>

                        {uploadError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl font-medium">
                                {uploadError}
                            </div>
                        )}

                        {/* GALLERY GRID */}
                        {shop.images && shop.images.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {shop.images.map((img, i) => (
                                    <div
                                        key={img.image_id || i}
                                        className="bg-cream-bg border border-accent/15 rounded-2xl overflow-hidden shadow-sm group hover:border-accent/60 hover:shadow-md transition-all aspect-square relative cursor-pointer"
                                    >
                                        <img
                                            src={img.image_url}
                                            alt={`${shop.shop_name} work sample ${i + 1}`}
                                            onClick={() => setLightboxImage(img.image_url)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div
                                            onClick={() => setLightboxImage(img.image_url)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 p-2 text-center"
                                        >
                                            <span>🔍 View Dress Photo</span>
                                            <span className="text-[10px] text-white/80 font-mono">Sample #{i + 1}</span>
                                        </div>
                                        {isOwner && img.image_id && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteImage(img.image_id!);
                                                }}
                                                title="Delete photo"
                                                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all shadow-md text-xs cursor-pointer"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {isOwner && (
                                    <label className="border-2 border-dashed border-accent/30 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-accent transition-colors cursor-pointer bg-cream-bg/40 aspect-square">
                                        <span className="text-2xl mb-1">📸</span>
                                        <span className="text-xs font-bold text-accent uppercase">Upload Work Sample</span>
                                        <span className="text-[10px] text-earth-text/50 mt-1">PNG, JPG up to 10MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isUploadingImage}
                                        />
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="bg-cream-bg border border-accent/20 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-warm-beige border border-accent/20 flex items-center justify-center text-accent mx-auto text-xl">
                                    📸
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-earth-text font-serif">No Portfolio Photos Yet</h4>
                                    <p className="text-xs text-earth-text/60 mt-1 font-medium max-w-sm mx-auto">
                                        {isOwner
                                            ? "Showcase your craftsmanship by uploading photos of custom garments and past work."
                                            : "This tailor has not uploaded showcase photos to their gallery yet."}
                                    </p>
                                </div>

                                {isOwner && (
                                    <label className="inline-block px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer shadow-md">
                                        Upload First Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isUploadingImage}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>

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
                                    onChange={(e) => setShopName(e.target.value)}
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
                                    onChange={(e) => setSpecialty(e.target.value)}
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
                                        onChange={(e) => setCity(e.target.value)}
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
                                        onChange={(e) => setContactNumber(e.target.value)}
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
                                    onChange={(e) => setShopAddress(e.target.value)}
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
                                    onChange={(e) => setRegistrationNumber(e.target.value)}
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
                                        <span>📸</span> {isUploadingImage ? "Uploading..." : "Upload Dress Photo"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isUploadingImage}
                                        />
                                    </label>
                                    {shop.images && shop.images.length > 0 && (
                                        <span className="text-xs text-earth-text/60 font-medium">
                                            ({shop.images.length} photos currently in gallery)
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

            {/* LIGHTBOX MODAL FOR DRESS / WORK SAMPLE IMAGES */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={() => setLightboxImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white font-bold text-xl flex items-center justify-center hover:bg-black/90 transition-colors cursor-pointer"
                        >
                            &times;
                        </button>
                        <img
                            src={lightboxImage}
                            alt="Full-size dress work sample"
                            className="w-full h-full object-contain max-h-[85vh] rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
