import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import { Zap, Database, ShieldCheck, Eye, Code2, LayoutDashboard, Layers } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

// --- SEO TOTALMENTE OPTIMIZADO PARA LA NUEVA FUNCIÓN ---
export const metadata: Metadata = {
  metadataBase: new URL('https://laraquicktool.com'),
  title: {
    default: 'LaraQuick | Laravel Blueprint & Relationship Architect',
    template: '%s | LaraQuick'
  },
  description: 'Design your Laravel database visually. The first Blueprint Architect to map Eloquent relationships, generate Migrations and Spatie Policies online.',
  keywords: [
    'Laravel Blueprint Architect',
    'Eloquent Relationship Visualizer',
    'Laravel Schema Designer',
    'Spatie Permissions UI',
    'Laravel 11 Code Generator',
    'Visual Database Mapper'
  ],
  authors: [{ name: 'LaraQuick Team' }],
  creator: 'LaraQuick',
  openGraph: {
    title: 'LaraQuick | Visual Laravel Architect',
    description: 'Draw your models and relationships. We generate the Laravel code.',
    url: 'https://laraquicktool.com',
    siteName: 'LaraQuick Tool',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'LaraQuick Hub' }],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LaraQuick",
    "url": "https://laraquicktool.com",
    "description": "Professional tool for Laravel 11 scaffolding, Blueprints and Spatie Policies.",
    "applicationCategory": "DeveloperApplication",
    "featureList": [
      "Visual Blueprint Architect",
      "Eloquent Relationship Mapping",
      "SQL to Laravel Migration",
      "JSON to Eloquent Model",
      "Visual Spatie Permission Manager"
    ]
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7914564898894869"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col`}>
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* --- PROFESSIONAL ENTERPRISE NAV --- */}
        <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* BRANDING */}
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-all">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black uppercase tracking-tighter text-lg">
                      Lara<span className="text-indigo-600">Quick</span>
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Architect Suite 2026</span>
                  </div>
                </Link>

                {/* MAIN LINKS - DESKTOP */}
                <nav className="hidden xl:flex items-center gap-1">
                  <Link href="/blueprint-architect" className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-all border border-indigo-100 dark:border-indigo-800">
                    <LayoutDashboard size={14} /> Blueprint Architect
                  </Link>
                  <Link href="/" className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                    <Code2 size={14} /> JSON
                  </Link>
                  <Link href="/sql-to-laravel" className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                    <Database size={14} /> SQL
                  </Link>
                  <Link href="/laravelLivePreview" className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                    <Eye size={14} /> Preview
                  </Link>
                </nav>
              </div>

              {/* ACTION CALLS */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                <Link 
                  href="/permissions-visualizer" 
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                >
                  <ShieldCheck size={16} className="text-indigo-400" /> 
                  <span>Security Hub</span>
                </Link>
              </div>

            </div>
          </div>
        </header>

        {/* MOBILE SUB-NAV */}
        <div className="xl:hidden flex overflow-x-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 gap-6 no-scrollbar">
            <Link href="/blueprint-architect" className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1"><Layers size={12}/> Blueprint</Link>
            <Link href="/" className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400">JSON</Link>
            <Link href="/sql-to-laravel" className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400">SQL</Link>
            <Link href="/laravelLivePreview" className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400">Preview</Link>
        </div>

        <main className="grow">
          {children}
        </main>

        <footer className="py-12 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              © 2026 LaraQuick Architect • Visual Laravel Suites
            </p>
            <div className="flex gap-6">
              <span className="text-[9px] font-black text-slate-300 uppercase">Eloquent Mapper</span>
              <span className="text-[9px] font-black text-slate-300 uppercase">Spatie Support</span>
              <span className="text-[9px] font-black text-slate-300 uppercase">Laravel 11 Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}