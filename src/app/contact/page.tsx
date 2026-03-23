import Link from 'next/link';

export default function Contact() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-20 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline mb-8 inline-block">
          &larr; Back to Tool
        </Link>
        
        <article className="bg-white p-10 md:p-16 rounded-3xl border border-slate-200 shadow-sm">
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Contact Us</h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Have a suggestion to improve the tool or found a bug? We would love to hear from you.
          </p>
          
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Email Address</h2>
            <a 
              href="mailto:laraquick@gmail.com" 
              className="text-2xl md:text-3xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors break-all"
            >
              laraquick@gmail.com
            </a>
          </div>
          
          <p className="mt-10 text-sm text-slate-400 italic">
            * We aim to respond to all inquiries within 24-48 business hours.
          </p>
        </article>
      </div>
    </main>
  );
}