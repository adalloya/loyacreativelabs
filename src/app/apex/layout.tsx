import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://loyacreativelab.com"),
  title: "APEX",
  description: "Autopilot de Hipertrofia Científica, Telemetría 3D y Nutrición Clínica",
  manifest: "/apex-manifest.json",
  icons: {
    icon: [
      { url: "/apex-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/apex-icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/apex-favicon.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/apex-icon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "APEX"
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://loyacreativelab.com/apex",
    siteName: "APEX",
    title: "APEX",
    description: "Autopilot de Hipertrofia Científica, Telemetría 3D y Nutrición Clínica",
    images: [
      {
        url: "/apex-og.png",
        width: 1200,
        height: 630,
        alt: "APEX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APEX",
    description: "Autopilot de Hipertrofia Científica, Telemetría 3D y Nutrición Clínica",
    images: ["/apex-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function ApexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
