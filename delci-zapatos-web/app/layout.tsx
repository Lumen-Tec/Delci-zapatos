import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Suspense } from "react";
import { AccessibilityControls } from "@/components/accessibility-controls";
import { ScrollToTop } from "@/components/scroll-to-top";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Delci Zapatos",
  description: "Sistema de Pagos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AccessibilityControls />
        <Suspense fallback={null}><ScrollToTop /></Suspense>
      </body>
    </html>
  );
}
