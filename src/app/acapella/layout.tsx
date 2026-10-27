import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://loyacreativelab.com"),
  title: "Acapella | Vocal Suite & Afinador Pro",
  description: "Suite vocal profesional con diseño Apple Liquid Glass: afinador por autocorrelación McLeod a 60 FPS, vocalizaciones, academia técnica y teleprompter sincronizado LRCLIB/UltraStar.",
  manifest: "/acapella-manifest.json",
  icons: {
    icon: [
      { url: "/acapella-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/acapella-icon.png", sizes: "512x512", type: "image/png" },
      { url: "/acapella-favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/acapella-apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Acapella",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://loyacreativelab.com/acapella",
    siteName: "Acapella",
    title: "Acapella | Vocal Suite & Afinador",
    description: "Suite vocal profesional: afinador a 60 FPS, academia Steve Glazer, karaoke sincronizado LRCLIB y afinador de guitarra.",
    images: [
      {
        url: "/acapella-og.png",
        width: 1200,
        height: 630,
        alt: "Acapella Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Acapella",
    description: "Suite de entrenamiento vocal y afinador profesional de guitarra y voz.",
    images: ["/acapella-og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function AcapellaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="acapella-theme min-h-screen text-[#f5f5f7] bg-black selection:bg-[#0A84FF] selection:text-white">
      {children}
    </div>
  );
}
