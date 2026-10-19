import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "APEX — Hypertrophy & Biomechanics OS",
  description: "Autopilot de Hipertrofia Científica, Telemetría 3D y Nutrición Clínica",
  manifest: "/apex-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "APEX OS"
  }
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
