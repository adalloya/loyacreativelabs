import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://loyacreativelab.com"),
  title: "Arco Maestro - AI Welding | Taller de Herrería Residencial",
  description: "Ingeniería de costos, optimizador de perfiles de 6m, escáner estructural IA y academia técnica para herrería residencial en Mérida, Yucatán.",
  manifest: "/arco-maestro-manifest.json",
  icons: {
    icon: [
      { url: "/logo-arco-maestro-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-arco-maestro.png", sizes: "512x512", type: "image/png" },
      { url: "/arco-maestro-favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/logo-arco-maestro-apple.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arco Maestro",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://loyacreativelab.com/arco-maestro",
    siteName: "Arco Maestro - AI Welding",
    title: "Arco Maestro - AI Welding",
    description: "Ingeniería de costos, despiece 6m y escáner IA para herrería residencial.",
    images: [
      {
        url: "/logo-arco-maestro.png",
        width: 800,
        height: 800,
        alt: "Arco Maestro AI Welding Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arco Maestro - AI Welding",
    description: "Plataforma de herrería residencial e inteligencia artificial.",
    images: ["/logo-arco-maestro.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#EAB308",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ArcoMaestroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07080A] text-zinc-100 antialiased selection:bg-yellow-400 selection:text-zinc-950">
      {children}
    </div>
  );
}
