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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://kondangsensei.my.id'),
  title: {
    default: "Simulasi JFT A2 Online & Tryout CBT Gratis | KondangSensei Bogor & Indonesia",
    template: "%s | KondangSensei CBT"
  },
  description:
    "Platform Simulasi CBT JFT-Basic A2 resmi 99% mirip ujian aslinya. Coba 1 Mini Tryout Gratis 12 Soal + Audio Chōkai! Pilihan tepat peserta Tokutei Ginou (SSW) & siswa LPK bahasa Jepang di Bogor, Jabodetabek, dan seluruh Indonesia di kondangsensei.my.id.",
  keywords: [
    "simulasi jft a2",
    "simulasi jft a2 bogor",
    "tryout jft a2 bogor",
    "simulasi jft basic a2",
    "simulasi jft basic a2 online",
    "latihan soal jft a2 bogor",
    "cbt jft basic a2 bogor",
    "tryout jft gratis",
    "mini tryout jft a2",
    "jft basic listening audio chokai",
    "ujian cbt jft jepang bogor",
    "tokutei ginou ssw jepang bogor 2026",
    "lpk bahasa jepang bogor ssw",
    "kursus jft a2 bogor",
    "kondangsensei",
    "kondangsensei.my.id",
    "kondang sensei bogor",
    "contoh soal jft basic a2 dan pembahasan"
  ],
  authors: [{ name: "KondangSensei Indonesia", url: "https://kondangsensei.my.id" }],
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
    canonical: "https://kondangsensei.my.id",
  },
  openGraph: {
    title: "Simulasi JFT A2 Online & Tryout CBT Gratis | KondangSensei Bogor & Indonesia",
    description:
      "Simulasi CBT JFT-Basic A2 99% mirip ujian aslinya. Coba Mini Tryout Gratis 12 Soal + Audio Chōkai langsung di kondangsensei.my.id. Terpercaya untuk siswa & LPK Bogor dan seluruh Indonesia!",
    url: "https://kondangsensei.my.id",
    siteName: "KondangSensei CBT",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Simulasi JFT A2 Online KondangSensei Bogor & Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulasi JFT A2 Online & Tryout CBT Gratis | KondangSensei Bogor & Indonesia",
    description:
      "Simulasi CBT JFT-Basic A2 99% mirip ujian aslinya. Latihan soal resmi untuk peserta Tokutei Ginou SSW di Bogor & seluruh Indonesia di kondangsensei.my.id!",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Rich Structured Data (JSON-LD) for Local & National SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://kondangsensei.my.id/#website",
        "url": "https://kondangsensei.my.id",
        "name": "KondangSensei CBT",
        "description": "Platform Simulasi Ujian CBT JFT-Basic A2 Terlengkap di Bogor, Jabodetabek & Seluruh Indonesia",
        "inLanguage": "id-ID"
      },
      {
        "@type": "EducationalOrganization",
        "@id": "https://kondangsensei.my.id/#organization",
        "name": "KondangSensei Indonesia",
        "url": "https://kondangsensei.my.id",
        "logo": "https://kondangsensei.my.id/favicon.svg",
        "image": "https://kondangsensei.my.id/og-image.png",
        "description": "Pusat Simulasi Ujian CBT JFT-Basic A2 Bahasa Jepang untuk Program Tokutei Ginou (SSW) di Bogor, Jabodetabek, dan Seluruh Indonesia",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Bogor",
          "addressRegion": "Jawa Barat",
          "addressCountry": "ID"
        },
        "areaServed": [
          { "@type": "City", "name": "Bogor" },
          { "@type": "AdministrativeArea", "name": "Kota Bogor" },
          { "@type": "AdministrativeArea", "name": "Kabupaten Bogor" },
          { "@type": "AdministrativeArea", "name": "Jabodetabek" },
          { "@type": "AdministrativeArea", "name": "Jawa Barat" },
          { "@type": "Country", "name": "Indonesia" }
        ]
      },
      {
        "@type": "WebApplication",
        "@id": "https://kondangsensei.my.id/#app",
        "name": "KondangSensei CBT Simulator JFT-Basic A2",
        "url": "https://kondangsensei.my.id",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "35000",
          "priceCurrency": "IDR",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "KondangSensei"
          }
        }
      },
      {
        "@type": "Course",
        "name": "Simulasi CBT JFT-Basic A2 Online & Mini Tryout Gratis",
        "description": "Simulasi ujian CBT JFT-Basic A2 dengan 50 soal resmi seksi S1-S4, audio Chōkai terstandar, batas waktu otomatis 60 menit, dan analisis rapor kelulusan untuk peserta di Bogor dan seluruh Indonesia.",
        "provider": {
          "@type": "Organization",
          "name": "KondangSensei Indonesia",
          "sameAs": "https://kondangsensei.my.id"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apakah peserta dan LPK dari Bogor bisa mengakses simulasi JFT-Basic A2 ini?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bisa sekali! KondangSensei (kondangsensei.my.id) adalah platform CBT JFT-Basic A2 online 24 jam. Siswa mandiri maupun LPK bahasa Jepang di Kota Bogor, Kabupaten Bogor, Jabodetabek, dan seluruh Indonesia dapat melakukan latihan simulasi mandiri maupun ujian serentak tanpa perlu instalasi aplikasi tambahan."
            }
          },
          {
            "@type": "Question",
            "name": "Apa itu ujian JFT-Basic A2 dan mengapa simulasi CBT sangat penting?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "JFT-Basic A2 adalah tes kemampuan bahasa Jepang berbasis komputer (CBT) sebagai syarat wajib visa Tokutei Ginou (Specified Skilled Worker/SSW). Simulasi CBT KondangSensei dirancang 99% persis seperti sistem ujian asli dengan batas waktu 60 menit dan audio Chōkai standar resmi (maks. 2x putar)."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah ada Mini Tryout JFT-Basic A2 yang bisa dicoba secara gratis?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ya, 100% Gratis! Cukup masukkan nama dan nomor WhatsApp di halaman utama, Anda langsung dapat mengerjakan 12 butir soal asli JFT-Basic A2 lengkap dengan audio Chōkai serta mendapatkan skor instan skala 10-250 dan laporan kelemahan."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa passing grade resmi untuk lulus JFT-Basic A2?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Berdasarkan standar kelulusan resmi Level A2, total skor berkisar antara 10 - 250. Peserta dinyatakan lulus jika memperoleh skor minimal 200 poin (Level A2.2 / ~80% benar) atau 175 poin (Level A2.1)."
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
