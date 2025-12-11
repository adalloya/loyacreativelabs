import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loya Creative Lab | Designing the Future",
  description: "Loya Creative Lab is a premium digital agency specializing in high-performance web design, branding, and incredible user experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased bg-black text-white font-sans`}>
        {children}
        <Script src="/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
