import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { BottomNav, Sidebar } from "@/components/Navigation";
import { PageViewTracker } from "@/components/PageViewTracker";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Leinen los! — SBF Binnen Trainer",
  description:
    "Study for the German Sportbootführerschein Binnen exam in German, English, or Russian.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.className}>
      <body className="min-h-dvh bg-white text-navy antialiased">
        <AuthProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
          </div>
          <BottomNav />
          <PageViewTracker />
        </AuthProvider>
      </body>
    </html>
  );
}
