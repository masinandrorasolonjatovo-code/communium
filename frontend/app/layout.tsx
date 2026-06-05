import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Communium | Module 2",
  description: "Pilotage des paiements, wallets Tks et facturation Communium.",
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
