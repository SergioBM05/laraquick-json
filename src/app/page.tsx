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
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // --- LÓGICA MODO OSCURO (CORREGIDA) ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  const generateValidation = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      let rules = "public function rules(): array\n{\n    return [\n";
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        let rule = "'required'";
        if (key.includes('email')) rule += "|'string'|'email'|'max:255'";
        else if (typeof val === 'string') rule += "|'string'";
        else if (typeof val === 'number' && Number.isInteger(val)) rule += "|'integer'";
        else if (typeof val === 'number') rule += "|'numeric'";
        else if (typeof val === 'boolean') rule += "|'boolean'";
        if (key.endsWith('_id')) rule += "|'exists:" + key.replace('_id', 's') + ",id'";
        rules += `        '${key}' => ${rule.replace(/'/g, "'")},\n`;
      });
      return rules + "    ];\n}";
    } catch (e) { return "// Invalid JSON for validation"; }
  };

  const loadExample = (type: 'user' | 'blog' | 'product') => {
    const examples = {
      user: { name: "John Doe", email: "john@example.com", age: 25, is_active: true, bio: "Laravel Lover" },
      blog: { title: "My First Post", content: "Hello World", category_id: 1, published_at: "2024-05-20", views: 0 },
      product: { name: "MacBook Pro", price: 1999.99, stock: 50, description: "Powerful laptop", on_sale: false }
    };
    setJson(JSON.stringify(examples[type], null, 2));
    setTableName(type === 'blog' ? 'posts' : type + 's');
  };

  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');

  const results: Record<string, string> = {
    migration: error ? "// Error in JSON" : jsonToLaravelMigration(json, tableName),
    model: error ? "// Error in JSON" : jsonToLaravelModel(json, className),
    factory: error ? "// Error in JSON" : jsonToLaravelFactory(json, className),
    validation: error ? "// Error in JSON" : generateValidation(json)
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
    <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'} p-4 md:p-12 font-sans`}>
      <div className="max-w-6xl mx-auto">

        {/* BOTÓN MODO OSCURO */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all text-xl"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <header className="text-center mb-10">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest shadow-sm">
            Laravel Developer Tools
          </div>
          <h1 className="text-6xl font-black tracking-tighter dark:text-white">
            LaraQuick <span className="text-indigo-600">JSON</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-2 font-medium max-w-2xl mx-auto">
            Paste your JSON, get your Laravel Model. <span className="text-indigo-600 underline decoration-2">It's that simple.</span>
          </p>
        </header>

        {/* EXAMPLES CON TEXTO LEGIBLE */}
        <div className="flex gap-2 mb-4 justify-center items-center">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Try examples:</span>
          {['user', 'blog', 'product'].map((type) => (
            <button
              key={type}
              onClick={() => loadExample(type as any)}
              className="text-[10px] px-3 py-1 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition font-bold uppercase shadow-sm"
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl shadow-sm border-2 transition-all bg-white dark:bg-slate-900 ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">Source JSON</h2>
                <div className="flex gap-2">
                  <button onClick={prettifyJson} disabled={!!error} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-600 hover:text-white transition">Format</button>
                  <button onClick={handleReset} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-600 hover:text-white transition">Reset</button>
                </div>
              </div>
              <input
                className="w-full p-3 mb-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Table name (e.g. users)"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
              <CodeEditor value={json} onChange={setJson} language="json" />
              {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-xs font-mono rounded-lg border border-red-100 dark:border-red-900 italic">{error}</div>}
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artisan Quick Command</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`php artisan make:model ${className} -mfs`); alert("Command copied!"); }}
                  className="text-[10px] text-slate-400 hover:text-white uppercase font-bold transition"
                >
                  Copy
                </button>
              </div>
              <code className="text-sm sm:text-base block">
                <span className="text-emerald-400 font-bold">php artisan</span>
                <span className="text-slate-100 ml-2 italic text-sm">make:model {className} -mfs</span>
              </code>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
            <nav className="flex bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
              {['migration', 'model', 'factory', 'validation'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
                  {tab}
                </button>
              ))}
            </nav>
            <div className="grow relative bg-slate-900 min-h-[400px]">
              <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />
              {!error && (
                <button onClick={() => { navigator.clipboard.writeText(results[activeTab]); alert("Copied!"); }} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition">
                  COPY CODE
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 space-y-3 text-center">
              <button
                onClick={handleShare}
                disabled={isSharing || isInvalid}
                className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${(isSharing || isInvalid) ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'}`}
              >
                {isSharing ? 'Saving...' : '🚀 Save & Share Schema'}
              </button>

              {!error && (
                <button
                  onClick={downloadPhpFile}
                  className="w-full py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition uppercase text-xs tracking-widest"
                >
                  📥 Download .php File
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN SEO CON CONTRASTE ALTO */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 border-t dark:border-slate-800 pt-10">
          <div className="text-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">⚡ Instant Conversion</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate migrations and models in seconds. Optimized for Laravel 11.</p>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">🛡️ PSR-12 Standard</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Clean, production-ready code following PHP community standards.</p>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">🔗 Shareable Schemas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Save your structures in the cloud and share them with your team.</p>
          </div>
        </section>

        {/* COMANDOS LARAVEL - LEGIBILIDAD MEJORADA */}
        <section className="mt-20 max-w-4xl mx-auto prose dark:prose-invert prose-slate">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Laravel Essential Commands</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
            {[
              { cmd: "php artisan serve", desc: "Start the development server" },
              { cmd: "php artisan make:controller NameController", desc: "Create a new controller" },
              { cmd: "php artisan migrate", desc: "Run database migrations" },
              { cmd: "php artisan migrate:rollback", desc: "Rollback the last migration" },
              { cmd: "php artisan make:middleware Name", desc: "Create a new middleware" },
              { cmd: "php artisan route:list", desc: "Show all registered routes" },
              { cmd: "php artisan cache:clear", desc: "Flush the application cache" },
              { cmd: "php artisan make:request StoreRequest", desc: "Create a Form Request class" }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <code className="text-indigo-600 dark:text-indigo-400 font-bold text-xs block mb-1">{item.cmd}</code>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-tight">{item.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">

            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">Why use LaraQuick?</h3>

            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">

              Modern web applications require rapid prototyping. LaraQuick follows the <strong>PSR-12 coding standard</strong> and is fully compatible with <strong>Laravel 10 and 11</strong>. By using our tool, you ensure that your code is clean, consistent, and ready for production, reducing the risk of syntax errors in your database schemas.

            </p>

          </div>
        </section>

        <footer className="mt-20 text-center border-t border-slate-200 dark:border-slate-800 pt-10 pb-10">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-8">
            <Link href="/about" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">About Us</Link>
            <Link href="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">Privacy Policy</Link>
          </div>
          <div className="text-[10px] text-slate-300 dark:text-slate-600 font-medium uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} LaraQuick Tool • Built for the Laravel Community
          </div>
        </footer>
      </div>
    </main>
  );
}