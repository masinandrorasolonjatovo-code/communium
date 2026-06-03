import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Communium | Module 5 — Événements",
  description: "Découvre, crée et gère des événements professionnels avec inscription et billets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
