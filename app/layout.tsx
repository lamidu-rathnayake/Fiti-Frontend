import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import "@/app/globals.css";

export const metadata: Metadata = {
    title: "NextGen Marketplace",
    description:
        "Discover premium products in our verified online marketplace.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
