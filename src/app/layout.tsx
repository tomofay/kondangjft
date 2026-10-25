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
  title: "Simulasi JFT-Basic A2 Online & Mini Tryout Gratis 2026 | KondangSensei CBT",
  description:
    "Coba 1 Mini Tryout Gratis JFT-Basic A2 (12 Soal + Audio Chōkai) tanpa bayar! Analisis skor real-time, laporan kelemahan, dan akses 5 Paket Simulasi CBT 99% mirip ujian asli Prometric untuk persiapan kerja Tokutei Ginou (SSW) Jepang.",
  keywords: [
    "simulasi jft basic a2",
    "tryout jft gratis",
    "mini tryout jft a2",
    "latihan soal jft a2 online",
    "jft basic listening audio",
    "ujian cbt jft jepang",
    "tokutei ginou ssw jepang",
    "kondangsensei cbt",
    "persiapan jft a2 2026",
    "contoh soal jft basic a2"
  ],
  authors: [{ name: "KondangSensei Indonesia" }],
  creator: "KondangSensei",
  publisher: "KondangSensei Indonesia",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://kondangjft.com",
  },
  openGraph: {
    title: "Simulasi JFT-Basic A2 Online & Mini Tryout Gratis | KondangSensei",
    description:
      "Coba 1 Mini Tryout Gratis 12 Soal JFT-Basic A2 lengkap dengan audio Chōkai anti-cheat. Dapatkan skor real-time & laporan kelemahanmu langsung!",
    url: "https://kondangjft.com",
    siteName: "KondangSensei CBT",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/favicon.svg",
        width: 1200,
        height: 630,
        alt: "KondangSensei CBT Simulasi JFT-Basic A2",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulasi JFT-Basic A2 Online & Mini Tryout Gratis | KondangSensei",
    description:
      "Simulasi CBT JFT-Basic A2 99% mirip ujian asli Prometric. Coba Mini Tryout Gratis sekarang!",
    images: ["/favicon.svg"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Rich Structured Data (JSON-LD) for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://kondangjft.com/#website",
        "url": "https://kondangjft.com",
        "name": "KondangSensei CBT",
        "description": "Platform Simulasi Ujian CBT JFT-Basic A2 Terlengkap di Indonesia",
        "inLanguage": "id-ID"
      },
      {
        "@type": "EducationalOrganization",
        "@id": "https://kondangjft.com/#organization",
        "name": "KondangSensei Indonesia",
        "url": "https://kondangjft.com",
        "logo": "https://kondangjft.com/favicon.svg",
        "description": "Lembaga Persiapan & Simulasi Ujian Bahasa Jepang untuk Tokutei Ginou (SSW)"
      },
      {
        "@type": "Course",
        "name": "Simulasi CBT JFT-Basic A2 & Mini Tryout Gratis",
        "description": "Latihan 5 Paket Soal Asli JFT-Basic A2 dengan Audio Chōkai, Timer Nyata, dan Rapor Evaluasi Resmi.",
        "provider": {
          "@type": "Organization",
          "name": "KondangSensei Indonesia",
          "sameAs": "https://kondangjft.com"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apa itu ujian JFT-Basic A2 dan mengapa perlu simulasi CBT?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "JFT-Basic A2 adalah ujian resmi berbasis komputer (CBT) syarat visa Tokutei Ginou Jepang. Simulasi CBT KondangSensei dirancang 99% mirip sistem Prometric asli agar terbiasa dengan tekanan waktu dan audio Chōkai."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah Mini Tryout di KondangSensei benar-benar gratis?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ya, 100% Gratis tanpa biaya dan tanpa kartu kredit! Cukup masukkan nama dan nomor WhatsApp untuk langsung mengerjakan 12 butir soal asli dan melihat skor serta analisis kelemahan secara real-time."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa banyak paket simulasi yang tersedia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tersedia 5 Paket Ujian Lengkap (250 butir soal asli) dengan audio Chōkai anti-cheat, pembahasan tiap butir soal, dan sertifikat rapor PDF A4 resmi."
            }
          }
        ]
      }
    ]
  };

  return (
    <html
      lang="id"
      style={{ colorScheme: 'light' }}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-stone-900" style={{ colorScheme: 'light' }}>
        {children}
      </body>
    </html>
  );
}
