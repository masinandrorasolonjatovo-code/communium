import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Communium | Module 5 - Evenements",
  description: "Espace de creation, decouverte et inscription aux evenements Communium.",
};

export default function Module5Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
