import type { Metadata } from "next";
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

// CONFIGURACIÓN DE SEO GLOBAL
export const metadata: Metadata = {
  metadataBase: new URL('https://laraquicktool.com'),
  title: {
    default: 'LaraQuick | JSON & SQL to Laravel Converter',
    template: '%s | LaraQuick'
  },
  description: 'The fastest online tool to convert JSON and SQL schemas to Laravel Migrations, Eloquent Models, and Factories. Speed up your Laravel 11 development.',
  keywords: [
    'JSON to Laravel', 
    'SQL to Laravel', 
    'Laravel Migration Generator', 
    'MySQL to Eloquent', 
    'Laravel Model Builder', 
    'LaraQuick'
  ],
  authors: [{ name: 'LaraQuick Team' }],
  creator: 'LaraQuick',
  verification: {
    google: 'WN6TqtQCdVLQE6j4qWpyOmx5mSxuZ1p5Ytw3QtYpZZM',
  },
  openGraph: {
    title: 'LaraQuick | JSON & SQL to Laravel Converter',
    description: 'Generate Laravel code from JSON or SQL in seconds. Free developer tool.',
    url: 'https://laraquicktool.com',
    siteName: 'LaraQuick',
    images: [
      {
        url: '/og-image.png', // Asegúrate de tener esta imagen en tu carpeta /public
        width: 1200,
        height: 630,
        alt: 'LaraQuick Tool Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaraQuick | Laravel Code Generator',
    description: 'Convert JSON/SQL to Laravel Migrations & Models instantly.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // JSON-LD para Google (Schema Markup)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "LaraQuick",
    "operatingSystem": "All",
    "applicationCategory": "DeveloperApplication",
    "description": "Convert JSON and SQL to Laravel Migrations, Models, and Factories in seconds.",
    "url": "https://laraquicktool.com",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7914564898894869"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-slate-950`}>
        {/* Marcado estructurado para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Barra de Navegación Optimizada para Tráfico */}
        <nav className="flex justify-center gap-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
          <Link 
            href="/" 
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
          >
            JSON <span className="hidden sm:inline">to Laravel</span>
          </Link>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 my-auto"></div>
          <Link 
            href="/sql-to-laravel" 
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
          >
            SQL <span className="hidden sm:inline">to Laravel</span>
          </Link>
        </nav>

        {children}
      </body>
    </html>
  );
}