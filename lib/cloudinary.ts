export async function uploadToCloudinary(file: File, resourceType: "image" | "video" | "raw" = "image"): Promise<string | null> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        console.error("Cloudinary config missing.");
        return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!res.ok) {
            console.error("Cloudinary upload failed", await res.text());
            return null;
        }

        const data = await res.json();
        return data.secure_url;
    } catch (err) {
        console.error("Cloudinary network error", err);
        return null;
    }
}

export function extractPublicIdFromUrl(url: string): string | null {
    try {
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1];
        if (!filename) return null;
        return filename.split(".")[0] || null;
    } catch {
        return null;
    }
}
