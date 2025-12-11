import Script from "next/script";

// ... (imports)

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
