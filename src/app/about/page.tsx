import Link from 'next/link';

export default function About() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-20 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline mb-8 inline-block">
          &larr; Back to Tool
        </Link>
        
        <article className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm prose prose-slate max-w-none">
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">About LaraQuick JSON</h1>
          
          <p className="text-lg text-slate-600 leading-relaxed">
            LaraQuick JSON was born from a common need among developers: <strong>time is gold</strong>. 
            Manually setting up migrations, models, and factories in Laravel from an API response can be 
            a repetitive and error-prone process.
          </p>

          <h2 className="text-2xl font-bold mt-10 text-slate-800">Our Mission</h2>
          <p className="text-slate-600">
            We want to simplify the workflow for PHP and Laravel developers. 
            Our tool allows you to transform complex JSON structures into clean Eloquent code, 
            following the best practices of the most recent Laravel versions (10 and 11).
          </p>

          <div className="bg-indigo-50 p-6 rounded-2xl my-8 border-l-4 border-indigo-600">
            <h3 className="text-indigo-900 font-bold m-0 text-lg">Privacy Commitment</h3>
            <p className="text-indigo-800 text-sm mb-0 mt-2">
              Unlike other online converters, LaraQuick processes your information 
              directly in your browser. Your code never travels to an external server, 
              ensuring your data structures remain private.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-10 text-slate-800">Who is behind this?</h2>
          <p className="text-slate-600">
            We are a team passionate about the Laravel ecosystem and modern web development with React and Next.js. 
            We believe in simple tools that solve specific problems elegantly.
          </p>

          <footer className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
              Thanks for using LaraQuick JSON • Happy Coding!
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}