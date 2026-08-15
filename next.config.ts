import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                // 🔒 1. STRICT LOCK: Protects your store, checkout, and search paths
                // This regex applies 'same-origin' to everything EXCEPT /login and /register
                source: "/((?!login|register).*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                ],
            },
            {
                // 🔑 2. TARGETED ACCESS: Allows the Google popup on the login page
                source: "/login",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
            {
                // 🔑 3. TARGETED ACCESS: Allows the Google popup on the registration page
                source: "/register",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
            {
                // 🔑 4. TARGETED ACCESS: Allows the Google popup on the test auth pages
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
