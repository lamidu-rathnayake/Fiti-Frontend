import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                // 🔒 1. STRICT LOCK: Protects all routes that don't need popups
                // Applies 'same-origin' to everything except auth pages
                source: "/((?!login|register|onboarding).*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                ],
            },
            {
                // 🔑 2. Login — allows Google popup
                source: "/login",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
            {
                // 🔑 3. Register root — role selection page
                source: "/register",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
            {
                // 🔑 4. Register role sub-pages (/register/client, /register/tailor)
                source: "/register/:role",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
            {
                // 🔑 5. Onboarding — Google-signed-in users complete their profile here
                source: "/onboarding",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
            {
                // 🔑 6. Test auth pages
                source: "/:slug(test-auth-.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
