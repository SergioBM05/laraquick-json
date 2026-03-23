"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jsonToLaravelMigration, jsonToLaravelModel, jsonToLaravelFactory } from '@/utils/converter';
import CodeEditor from '@/components/CodeEditor';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [json, setJson] = useState('{\n  "title": "Hello World",\n  "user_id": 1,\n  "is_active": true\n}');
  const [tableName, setTableName] = useState('posts');
  const [activeTab, setActiveTab] = useState('migration');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = "LaraQuick Tool | JSON to Laravel Converter";
  }, []);

  useEffect(() => {
    try {
      if (json.trim() === "") {
        setError("JSON cannot be empty");
        return;
      }
      JSON.parse(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [json]);

  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');

  const results: Record<string, string> = {
    migration: error ? "// Error in JSON" : jsonToLaravelMigration(json, tableName),
    model: error ? "// Error in JSON" : jsonToLaravelModel(json, className),
    factory: error ? "// Error in JSON" : jsonToLaravelFactory(json, className)
  };

  const prettifyJson = () => {
    try {
      const obj = JSON.parse(json);
      setJson(JSON.stringify(obj, null, 2));
      setError(null);
    } catch (e: any) {
      setError("Format error: " + e.message);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setJson('{\n  \n}');
      setTableName('');
      setShareUrl(null);
    }
  };

  // RESTAURADO: Función de descarga
  const downloadPhpFile = () => {
    const content = results[activeTab];
    const fileName = `${tableName || 'schema'}_${activeTab}.php`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareUrl(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eloquentgenback-production.up.railway.app/api';
      const response = await fetch(`${API_URL}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          table_name: tableName,
          json_content: json
        }),
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setShareUrl(`${window.location.origin}/s/${data.slug}`);
    } catch (e) {
      alert("Error connecting to the server.");
    } finally {
      setIsSharing(false);
    }
  };

  const isInvalid = !!error || json.trim() === "" || json === "{}";

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest shadow-sm">
            Laravel Developer Tools
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
            LaraQuick <span className="text-indigo-600">JSON</span>
          </h1>
          <p className="text-xl text-slate-600 mt-2 font-medium max-w-2xl mx-auto">
            Paste your JSON, get your Laravel Model. <span className="text-indigo-600 underline decoration-2">It's that simple.</span>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${error ? 'border-red-300' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Source JSON</h2>
                <div className="flex gap-2">
                  <button onClick={prettifyJson} disabled={!!error} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition">Format</button>
                  <button onClick={handleReset} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition">Reset</button>
                </div>
              </div>
              <input
                className="w-full p-3 mb-4 border border-slate-200 rounded-xl bg-slate-50 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Table name (e.g. users)"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
              <CodeEditor value={json} onChange={setJson} language="json" />
              {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-mono rounded-lg border border-red-100 italic">{error}</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <nav className="flex bg-slate-50 border-b">
              {['migration', 'model', 'factory'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
                  {tab}
                </button>
              ))}
            </nav>
            <div className="grow relative bg-slate-900 min-h-[400px]">
              <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />
              {!error && (
                <button onClick={() => { navigator.clipboard.writeText(results[activeTab]); alert("Copied to clipboard!"); }} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition">
                  COPY CODE
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t space-y-3">
              <button
                onClick={handleShare}
                disabled={isSharing || isInvalid}
                className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${(isSharing || isInvalid) ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'
                  }`}
              >
                {isSharing ? 'Saving...' : '🚀 Save & Share Schema'}
              </button>

              {/* RESTAURADO: Botón de Descarga */}
              {!error && (
                <button
                  onClick={downloadPhpFile}
                  className="w-full py-3 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition uppercase text-xs tracking-widest"
                >
                  📥 Download .php File
                </button>
              )}
            </div>
          </div>
        </div>

        {shareUrl && (
          <div className="mt-8 p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-3">Public Link Generated:</p>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="flex-1 bg-white border border-emerald-200 rounded-xl p-3 text-xs font-mono text-emerald-800 outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert("URL Copied!"); }} className="bg-emerald-600 text-white px-6 rounded-xl text-xs font-bold">Copy</button>
              <a href={shareUrl} target="_blank" className="p-3 bg-white border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-100 transition shadow-sm">Preview</a>
            </div>
          </div>
        )}

        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 border-t pt-10">
          <div className="text-center">
            <h3 className="font-bold text-slate-800 mb-2">⚡ Instant Conversion</h3>
            <p className="text-sm text-slate-500">Generate migrations and models in seconds. Optimized for Laravel 11.</p>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 mb-2">🛡️ PSR-12 Standard</h3>
            <p className="text-sm text-slate-500">Clean, production-ready code following PHP community standards.</p>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 mb-2">🔗 Shareable Schemas</h3>
            <p className="text-sm text-slate-500">Save your structures in the cloud and share them with your team.</p>
          </div>
        </section>

        <section className="mt-20 max-w-4xl mx-auto prose prose-slate">
          <h2 className="text-3xl font-black text-slate-900 mb-6">How to use LaraQuick: The Ultimate JSON to Laravel Guide</h2>

          <p className="text-slate-600 leading-relaxed mb-6">
            LaraQuick is designed to streamline your development workflow by automating the tedious process of writing Laravel Migrations, Models, and Factories. Instead of manually defining every column, you can simply paste your raw data in JSON format and let our generator do the heavy lifting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Common JSON Formatting Errors</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li><strong>Missing Quotes:</strong> All keys and string values must be wrapped in double quotes (").</li>
                <li><strong>Trailing Commas:</strong> Ensure the last item in an object or array does not have a comma after it.</li>
                <li><strong>Nested Objects:</strong> For the best results, use a flat JSON structure for single-table migrations.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Pro Tips for Developers</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li><strong>Relationships:</strong> Name your foreign keys ending with <code>_id</code> (e.g., <code>user_id</code>) and we will automatically generate <code>foreignId()-&gt;constrained()</code>.</li>
                <li><strong>Table Names:</strong> Use plural nouns for table names (e.g., <code>products</code>) to follow Laravel's naming conventions perfectly.</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">Why use LaraQuick?</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">
              Modern web applications require rapid prototyping. LaraQuick follows the <strong>PSR-12 coding standard</strong> and is fully compatible with <strong>Laravel 10 and 11</strong>. By using our tool, you ensure that your code is clean, consistent, and ready for production, reducing the risk of syntax errors in your database schemas.
            </p>
          </div>
        </section>

        {/* RESTAURADO: Footer con enlaces legales */}
        <footer className="mt-20 text-center border-t border-slate-200 pt-10 pb-10">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-8">
            <Link href="/about" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">About Us</Link>
            <Link href="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Privacy Policy</Link>
            <Link href="/terms" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Terms</Link>
          </div>
          <div className="text-[10px] text-slate-300 font-medium uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} LaraQuick Tools • Built for the Laravel Community
          </div>
        </footer>
      </div>
    </main>
  );
}