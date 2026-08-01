import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tokenwatch-frontend.vercel.app"),
  title: { default: "TokenWatch — AI cost control", template: "%s | TokenWatch" },
  description: "Track every AI request, enforce budgets before overspending, and control LLM costs from one dashboard.",
  alternates: { canonical: "/" },
  openGraph: { title: "TokenWatch — AI cost control and budget protection", description: "Track every AI request and enforce budgets before overspending.", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "TokenWatch — AI cost control", description: "Budget protection for teams using LLM APIs." },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
