import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "KondangSensei CBT - Simulasi Ujian Bahasa Jepang",
  description: "Platform Simulasi Ujian CBT Bahasa Jepang KondangSensei dengan Rapor Evaluasi Siswa & Pembahasan Lengkap.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      style={{ colorScheme: 'light' }}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-stone-900" style={{ colorScheme: 'light' }}>{children}</body>
    </html>
  );
}
