import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import "@/app/globals.css";

const manrope = Manrope({
    subsets: ["latin"],
    weight: ["600", "700"],
    variable: "--font-heading",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "FITI — Luxury Bespoke Tailoring & Performance Atelier",
    description:
        "Discover Sri Lanka's finest verified tailor shops, custom garments, and precision bespoke crafting.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
            <body className="antialiased bg-[#0A0B0E] text-white font-sans">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
