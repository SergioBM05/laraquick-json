import type { Metadata } from "next";
import Script from "next/script"; // 1. Importa esto
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 1. Título con la palabra clave al principio (lo más importante)
  title: 'JSON to Laravel Converter | Migrations, Models & Factories',

  // 2. Descripción con palabras clave secundarias
  description: 'The fastest online tool to convert JSON to Laravel Migrations, Eloquent Models, and Factories. Speed up your Laravel development with LaraQuick.',

  // 3. Keywords (aunque Google ya no las usa tanto, otros buscadores sí)
  keywords: ['JSON to Laravel', 'Laravel Migration Generator', 'JSON to Eloquent', 'Laravel Schema Builder', 'LaraQuick'],

  verification: {
    google: 'WN6TqtQCdVLQE6j4qWpyOmx5mSxuZ1p5Ytw3QtYpZZM',
  },

  // 4. OpenGraph para que cuando compartas el link en redes se vea profesional
  openGraph: {
    title: 'LaraQuick | JSON to Laravel Converter',
    description: 'Generate Laravel code from JSON in seconds. Free developer tool.',
    url: 'https://laraquicktool.com',
    siteName: 'LaraQuick',
    images: [
      {
        url: 'https://laraquicktool.com/og-image.png', // Si tienes una imagen de preview, ponla aquí
        width: 1200,
        height: 630,
        alt: 'LaraQuick Tool Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // 5. Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'JSON to Laravel Converter',
    description: 'Convert JSON to Laravel Migrations & Models instantly.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* 2. Pega el código de AdSense aquí dentro */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7914564898894869"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <nav className="flex justify-center gap-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-50">
          <Link href="/" className="text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition">JSON to Laravel</Link>
          <Link href="/sql-to-laravel" className="text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition">SQL to Laravel</Link>
          <Link href="/laravel-validation-generator" className="text-xs font-black uppercase tracking-widest hover:text-indigo-600 transition">Validation Gen</Link>
        </nav>
      </body>
    </html>
  );
}