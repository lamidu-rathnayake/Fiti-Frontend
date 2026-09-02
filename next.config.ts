import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
    async headers() {
        return [
            {
                // 🔒 1. STRICT LOCK: Protects all routes that don't need popups
                // Applies 'same-origin' to everything except landing, auth pages and onboarding
                source: "/((?!$|login|register|onboarding).*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
            {
                // 🔑 2. Login — allows Google popup
                source: "/login",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
            {
                // 🔑 2.5 Landing page — allows Google popup for login
                source: "/",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
            {
                // 🔑 3. Register root — role selection page
                source: "/register",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
            {
                // 🔑 4. Register role sub-pages (/register/client, /register/tailor)
                source: "/register/:role",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
            {
                // 🔑 5. Onboarding — Google-signed-in users complete their profile here
                source: "/onboarding",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
            {
                // 🔑 6. Test auth pages
                source: "/:slug(test-auth-.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
