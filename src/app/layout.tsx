import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'LaraQuick Tool - JSON to Laravel Converter',
  description: 'Convert your JSON schemas into Laravel Eloquent models in seconds.',
  verification: {
    google: 'WN6TqtQCdVLQE6j4qWpyOmx5mSxuZ1p5Ytw3QtYpZZM',
  },
  openGraph: {
    title: 'LaraQuick Tool',
    description: 'The ultimate tool for Laravel developers',
    url: 'https://laraquicktool.com',
    siteName: 'LaraQuick',
    locale: 'en_US',
    type: 'website',
  },
};

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth"> {/* Asegúrate de que no tenga 'light' fijo */}
      <body>{children}</body>
    </html>
  );
}

