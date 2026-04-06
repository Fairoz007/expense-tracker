import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Expense Tracker - Manage Your Daily Life Expenses",
  description:
    "A simple and efficient personal finance management app that allows you to track your daily expenses and income.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expenses",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5EFE0",
  viewportFit: "cover",
};

import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/providers/sw-registration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background">
        <ConvexClientProvider>
          <PWAProvider>
            {children}
            <Toaster position="top-center" richColors />
            <ServiceWorkerRegistration />
          </PWAProvider>
        </ConvexClientProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
