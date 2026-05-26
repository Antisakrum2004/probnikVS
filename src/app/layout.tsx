import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "1С:МИС — Видеоконсультации",
  description: "Интеграция 1С МИС + EmAI + Jitsi Meet",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ВидеоКонс",
  },
};

export const viewport: Viewport = {
  themeColor: "#E0C72E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100%' }}>
        {children}
      </body>
    </html>
  );
}
