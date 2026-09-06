"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
    getClientProfile,
    updateClientProfile,
    getMeasurements,
    updateMeasurements,
    deleteCloudinaryImage
} from "@/lib/api/endpoints/profiles";
import type { ClientProfile, MeasurementsPayload } from "@/lib/api/types/profile";
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { uploadToCloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary";
import { validatePhoneNumber } from "@/lib/phone";
import Link from "next/link";
import FullPageLock from "@/components/FullPageLock";

export default function ClientProfilePage() {
    const { user } = useAuth();

    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    
    // Profile Picture States
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Measurement States
    const [chest, setChest] = useState<string>("");
    const [waist, setWaist] = useState<string>("");
    const [hip, setHip] = useState<string>("");
    const [shoulder, setShoulder] = useState<string>("");
    const [sleeve, setSleeve] = useState<string>("");
    const [neck, setNeck] = useState<string>("");
    const [inseam, setInseam] = useState<string>("");
    const [length, setLength] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    // Auth States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isGoogleAuth, setIsGoogleAuth] = useState(false);

    // Status
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
    const [savingBase, setSavingBase] = useState(false);
    const [savingMeasurements, setSavingMeasurements] = useState(false);
    const [savingAuth, setSavingAuth] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            // Check auth provider
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
                const providerData = firebaseUser.providerData;
                const hasGoogle = providerData.some((p: any) => p.providerId === 'google.com');
                setIsGoogleAuth(hasGoogle);
            }

            try {
                const [profRes, measRes] = await Promise.all([
                    getClientProfile(user.uid).catch(() => null),
                    getMeasurements(user.uid).catch(() => null)
                ]);

                if (profRes) {
                    setProfile(profRes);
                    setPhone(profRes.phone || "");
                    setCity(profRes.city || "");
                    setAddress(profRes.address || "");
                    setPhotoUrl(firebaseUser?.photoURL || profRes.photo_url || null);
                }

                if (measRes) {
                    setChest(measRes.chest?.toString() || "");
                    setWaist(measRes.waist?.toString() || "");
                    setHip(measRes.hip?.toString() || "");
                    setShoulder(measRes.shoulder?.toString() || "");
                    setSleeve(measRes.sleeve?.toString() || "");
                    setNeck(measRes.neck?.toString() || "");
                    setInseam(measRes.inseam?.toString() || "");
                    setLength(measRes.length?.toString() || "");
                    setNotes(measRes.notes || "");
                }
            } catch (err) {
                console.error("Failed to load profile data", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const handleSaveBaseInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const phoneVal = validatePhoneNumber(phone);
        if (!phoneVal.isValid) {
            setMessage({ type: "error", text: phoneVal.error || "Please enter a valid phone number." });
            return;
        }

        const firebaseUser = auth.currentUser;
        setSavingBase(true);
        setMessage(null);
        try {
            let newPhotoUrl = photoUrl;
            
            if (profileImageFile) {
                const uploadedUrl = await uploadToCloudinary(profileImageFile, "image");
                if (!uploadedUrl) throw new Error("Image upload failed.");
                newPhotoUrl = uploadedUrl;
                
                if (firebaseUser) {
                    await updateProfile(firebaseUser, { photoURL: newPhotoUrl });
                }
                
                if (photoUrl) {
                    const publicId = extractPublicIdFromUrl(photoUrl);
                    if (publicId) {
                        try {
                            await deleteCloudinaryImage(publicId);
                        } catch (delErr) {
                            console.error("Failed to delete old image:", delErr);
                        }
                    }
                }
                setPhotoUrl(newPhotoUrl);
                setProfileImageFile(null);
                setPhotoPreview(null);
            }

            await updateClientProfile(user.uid, {
                phone: phoneVal.normalized,
                city: city || null,
                address: address || null,
                photo_url: newPhotoUrl || null
            });
            setMessage({ type: "success", text: "Profile updated successfully." });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update profile." });
        } finally {
            setSavingBase(false);
        }
    };

    const handleSaveMeasurements = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingMeasurements(true);
        setMessage(null);
        try {
            await updateMeasurements(user.uid, {
                chest: chest ? parseFloat(chest) : undefined,
                waist: waist ? parseFloat(waist) : undefined,
                hip: hip ? parseFloat(hip) : undefined,
                shoulder: shoulder ? parseFloat(shoulder) : undefined,
                sleeve: sleeve ? parseFloat(sleeve) : undefined,
                neck: neck ? parseFloat(neck) : undefined,
                inseam: inseam ? parseFloat(inseam) : undefined,
                length: length ? parseFloat(length) : undefined,
                notes: notes || null,
            });
            setMessage({ type: "success", text: "Measurements saved securely." });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to save measurements." });
        } finally {
            setSavingMeasurements(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const firebaseUser = auth.currentUser;
        if (!firebaseUser || !firebaseUser.email) return;
        setSavingAuth(true);
        setMessage(null);
        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);

            // Update
            await updatePassword(firebaseUser, newPassword);
            setMessage({ type: "success", text: "Password changed successfully." });
            setCurrentPassword("");
            setNewPassword("");
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to change password." });
        } finally {
            setSavingAuth(false);
        }
    };

    if (loading) {
        return (
            <FullPageLock
                isLoading={true}
                title="Loading Profile"
                message="Retrieving your bespoke measurements and account preferences..."
            />
        );
    }

    return (
        <div className="min-h-screen text-earth-text selection:bg-accent selection:text-white">
            <main className="max-w-4xl mx-auto px-6 sm:px-12 py-12 space-y-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-earth-text tracking-tight">
                        Profile & Settings
                    </h1>
                    <p className="text-earth-text/70 mt-2 text-sm">
                        Manage your location, measurements, and security settings.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold border ${message.type === 'success' ? 'bg-accent/10 border-accent/40 text-earth-text' : 'bg-red-500/10 border-red-500/30 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* LEFT COL */}
                    <div className="space-y-12">

                        {/* Base Info */}
                        <section className="bg-warm-beige/40 border border-accent/15 p-6 sm:p-8 rounded-2xl shadow-sm backdrop-blur-sm">
                            <h2 className="text-lg font-serif font-bold text-earth-text mb-6 border-b border-accent/10 pb-3 flex items-center gap-2">
                                <span className="text-accent">01</span> Basic Details
                            </h2>
                            <form onSubmit={handleSaveBaseInfo} className="space-y-4">
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-20 h-20 rounded-full border-2 border-accent/30 overflow-hidden bg-warm-beige flex-shrink-0">
                                        {(photoPreview || photoUrl) ? (
                                            <img src={photoPreview || photoUrl!} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-earth-text/40">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-earth-text/70 uppercase mb-2">Profile Picture</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setProfileImageFile(file);
                                                    setPhotoPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                            className="block w-full text-sm text-earth-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent file:text-white hover:file:bg-accent-hover transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-earth-text/70 uppercase block mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/80 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-earth-text/70 uppercase block mb-1">City</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/80 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-earth-text/70 uppercase block mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/80 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingBase}
                                        className="px-6 py-2.5 bg-earth-text text-cream-bg text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {savingBase ? "Saving..." : "Save Details"}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Security */}
                        <section className="bg-warm-beige/40 border border-accent/15 p-6 sm:p-8 rounded-2xl shadow-sm backdrop-blur-sm">
                            <h2 className="text-lg font-serif font-bold text-earth-text mb-6 border-b border-accent/10 pb-3 flex items-center gap-2">
                                <span className="text-accent">02</span> Security
                            </h2>
                            {isGoogleAuth ? (
                                <div className="p-4 border border-accent/20 bg-white/80 rounded-xl flex items-center gap-4">
                                    <svg className="w-8 h-8 text-earth-text" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                    <div>
                                        <p className="text-sm font-bold text-earth-text">Secured via Google</p>
                                        <p className="text-xs text-earth-text/60 mt-1">Your account is linked to your Google identity. Password changes are handled by Google.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-earth-text/70 uppercase block mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white/80 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-earth-text/70 uppercase block mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white/80 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={savingAuth}
                                            className="px-6 py-2.5 bg-earth-text text-cream-bg text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            {savingAuth ? "Updating..." : "Change Password"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COL - Measurements */}
                    <div className="space-y-12">
                        <section className="bg-warm-beige/60 border border-accent/30 p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">

                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                            <h2 className="text-lg font-serif font-bold text-earth-text mb-2 flex items-center gap-2 relative z-10">
                                <span className="text-accent">03</span> Bespoke Measurements
                            </h2>
                            <p className="text-xs text-earth-text/70 mb-6 pb-4 border-b border-accent/10 relative z-10">
                                Save these once, and automatically apply them to all future bespoke requests. All values in inches.
                            </p>

                            <form onSubmit={handleSaveMeasurements} className="relative z-10">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                    {/* CHEST & WAIST */}
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Chest</label>
                                        <input type="number" step="0.1" placeholder="e.g. 40" value={chest} onChange={e => setChest(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Waist</label>
                                        <input type="number" step="0.1" placeholder="e.g. 32" value={waist} onChange={e => setWaist(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>

                                    {/* HIPS & INSEAM */}
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Hips</label>
                                        <input type="number" step="0.1" placeholder="e.g. 38" value={hip} onChange={e => setHip(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Inseam</label>
                                        <input type="number" step="0.1" placeholder="e.g. 30" value={inseam} onChange={e => setInseam(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>

                                    {/* SHOULDER & SLEEVE */}
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Shoulder</label>
                                        <input type="number" step="0.1" placeholder="e.g. 18" value={shoulder} onChange={e => setShoulder(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Sleeve</label>
                                        <input type="number" step="0.1" placeholder="e.g. 25" value={sleeve} onChange={e => setSleeve(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Neck</label>
                                        <input type="number" step="0.1" placeholder="e.g. 15.5" value={neck} onChange={e => setNeck(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Full Length</label>
                                        <input type="number" step="0.1" placeholder="e.g. 40" value={length} onChange={e => setLength(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all text-center font-mono" />
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <label className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-1 font-semibold">Fit Preferences & Notes</label>
                                        <textarea rows={3} placeholder="e.g. I prefer a slim fit on the waist, and extra breathing room around the chest..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 bg-white/90 border border-accent/20 focus:border-accent rounded-xl text-sm text-earth-text focus:outline-none transition-all resize-none font-mono" />
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button
                                        type="submit"
                                        disabled={savingMeasurements}
                                        className="w-full py-4 bg-accent text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent-hover transition-all shadow-md disabled:opacity-50 cursor-pointer"
                                    >
                                        {savingMeasurements ? "Encrypting & Saving..." : "Save Measurement Profile"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </main>
            <FullPageLock
                isSubmitting={savingBase || savingMeasurements || savingAuth}
                title="Updating Profile"
                message="Updating your profile data and securing Atelier records..."
            />
        </div>
    );
}
