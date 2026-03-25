import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de visualización móvil optimizada
export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

// --- CONFIGURACIÓN DE SEO GLOBAL ---
export const metadata: Metadata = {
  metadataBase: new URL('https://laraquicktool.com'),
  title: {
    default: 'LaraQuick | JSON & SQL to Laravel CRUD Generator',
    template: '%s | LaraQuick'
  },
  description: 'The fastest online tool to convert JSON and SQL schemas into Laravel Migrations, Eloquent Models, Factories, and Controllers. Full support for Laravel 11.',
  keywords: [
    'JSON to Laravel', 
    'SQL to Laravel converter', 
    'Laravel 11 code generator', 
    'Laravel Migration builder', 
    'Eloquent model generator', 
    'Laravel scaffold tool',
    'Laravel CRUD generator online',
    'SQL dump to Laravel'
  ],
  authors: [{ name: 'LaraQuick Team' }],
  creator: 'LaraQuick',
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    google: 'WN6TqtQCdVLQE6j4qWpyOmx5mSxuZ1p5Ytw3QtYpZZM',
  },
  openGraph: {
    title: 'LaraQuick | Laravel Code Generator & Boilerplate Tool',
    description: 'Transform your SQL or JSON structures into production-ready Laravel code in seconds. Download as ZIP.',
    url: 'https://laraquicktool.com',
    siteName: 'LaraQuick Tool',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LaraQuick Tool - JSON & SQL to Laravel',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaraQuick | SQL & JSON to Laravel',
    description: 'Automate your Laravel backend. Generate migrations, models and controllers instantly.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Marcado estructurado Schema.org para aplicaciones web de desarrollo
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LaraQuick",
    "url": "https://laraquicktool.com",
    "description": "Professional tool to convert JSON/SQL schemas to Laravel Migrations, Models, Factories, and Controllers.",
    "applicationCategory": "DeveloperApplication",
    "genre": "Software Development Tool",
    "browserRequirements": "Requires JavaScript",
    "softwareVersion": "2.1 (Laravel 11 Optimized)",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "SQL to Laravel Migration",
      "JSON to Eloquent Model",
      "Automatic CRUD Controller generation",
      "ZIP Export",
      "Dark Mode Support"
    ]
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7914564898894869"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300`}>
        
        {/* Marcado estructurado para buscadores */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Barra de Navegación Profesional */}
        <nav className="flex justify-center items-center gap-4 sm:gap-8 py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-4">
          <Link 
            href="/" 
            className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition flex items-center gap-2 group"
          >
            <span className="w-2 h-2 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform"></span>
            JSON <span className="hidden sm:inline">to Laravel</span>
          </Link>
          
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
          
          <Link 
            href="/sql-to-laravel" 
            className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition flex items-center gap-2 group"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full group-hover:scale-125 transition-transform"></span>
            SQL <span className="hidden sm:inline">to Laravel</span>
          </Link>

          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>

          <Link 
            href="/laravelLivePreview" 
            className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-600 hover:text-white transition shadow-sm"
          >
            Live Preview
          </Link>
        </nav>

        {/* Contenido Principal */}
        <main className="grow">
          {children}
        </main>

      </body>
    </html>
  );
}