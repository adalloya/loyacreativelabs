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
  metadataBase: new URL("https://loyacreativelab.com"),
  title: {
    default: "Loya Creative Lab | Diseño Web, Branding & IA",
    template: "%s | Loya Creative Lab"
  },
  description: "Agencia digital premium especializada en Diseño Web, Branding, Desarrollo de Software e Inteligencia Artificial. Transformamos ideas en experiencias digitales impactantes.",
  keywords: ["Diseño Web", "Desarrollo de Apps", "Agencia Digital", "Inteligencia Artificial", "Branding", "UX/UI", "Next.js", "Consultoría IA", "Marketing Digital", "Software a Medida"],
  authors: [{ name: "Loya Creative Lab" }],
  creator: "Loya Creative Lab",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://loyacreativelab.com",
    siteName: "Loya Creative Lab",
    title: "Loya Creative Lab | Diseño del Futuro",
    description: "Transformamos tu negocio con tecnología de punta y diseño de alto impacto.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Loya Creative Lab Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loya Creative Lab",
    description: "Agencia de Diseño Web y Tecnología.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Loya Creative Lab",
  "url": "https://loyacreativelab.com",
  "logo": "https://loyacreativelab.com/logo.png",
  "description": "Agencia digital premium especializada en Diseño Web, Branding, Desarrollo de Software e Inteligencia Artificial.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "MX"
  },
  "priceRange": "$$$",
  "sameAs": [
    "https://instagram.com/loyacreativelab",
    "https://linkedin.com/company/loyacreativelab"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased bg-black text-white font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Script src="/widget.js?v=stable" strategy="lazyOnload" />
      </body>
    </html>
  );
}
