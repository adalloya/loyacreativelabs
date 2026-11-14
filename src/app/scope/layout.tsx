import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://loyacreativelab.com"),
  title: "Loya Scope | Visor Óptico USB-C & UVC",
  description:
    "Visor de cámara externa USB-C / UVC en tiempo real con zoom táctil de precisión, captura de foto y video en alta definición y guardado directo al carrete.",
  manifest: "/scope-manifest.json",
  icons: {
    icon: [
      { url: "/scope-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/scope-icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/scope-favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/scope-apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scope",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://loyacreativelab.com/scope",
    siteName: "Loya Scope - USB-C Optical Viewer",
    title: "Loya Scope - USB-C Optical Viewer",
    description:
      "Visor óptico para cámaras USB-C / UVC con captura de foto, video, zoom digital y guardado en el carrete.",
    images: [
      {
        url: "/scope-icon.png",
        width: 512,
        height: 512,
        alt: "Loya Scope Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loya Scope - USB-C Optical Viewer",
    description: "Visor óptico de precisión para cámaras USB-C / UVC.",
    images: ["/scope-icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#00E699",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function ScopeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#050608] text-zinc-100 antialiased selection:bg-emerald-400 selection:text-zinc-950 overflow-hidden">
      {children}
    </div>
  );
}
