import Link from 'next/link';

export default function Privacy() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-20 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline mb-8 inline-block">
          &larr; Back to Tool
        </Link>

        <article className="bg-white p-10 md:p-16 rounded-3xl border border-slate-200 shadow-sm prose prose-slate max-w-none">
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Privacy Policy</h1>
          
          <p className="text-lg text-slate-600 leading-relaxed">
            At <strong>LaraQuick JSON</strong>, the security of your data is our absolute priority. 
            This policy explains how we handle information on our site.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-10">1. Local Processing</h2>
          <p className="text-slate-600">
            Unlike other tools, LaraQuick processes all JSON code directly in your browser. 
            <strong> We do not send your JSON to our servers</strong> nor do we store the content of your data structures unless you explicitly use the "Share" feature.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8">2. Google AdSense and Cookies</h2>
          <p className="text-slate-600">
            We use Google AdSense to display ads. Google may use cookies to serve ads 
            based on a user's prior visits to this website or other websites. Users may 
            opt out of personalized advertising by visiting Google Ads Settings.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8">3. Shared Data</h2>
          <p className="text-slate-600">
            When you use the "Save & Share" feature, the generated schema and the source JSON are stored in our database to provide you with a permanent public link. This information is public to anyone with the link.
          </p>

          <footer className="mt-12 pt-8 border-t border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-widest">
            Last updated: March 2026
          </footer>
        </article>
      </div>
    </main>
  );
}