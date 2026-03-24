"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jsonToLaravelModel, jsonToLaravelFactory } from '@/utils/converter';
import CodeEditor from '@/components/CodeEditor';
import { useRouter } from 'next/navigation';


export default function Home() {
  const [json, setJson] = useState('{\n  "title": "Hello World",\n  "user_id": 1,\n  "is_active": true\n}');
  const [tableName, setTableName] = useState('posts');
  const [activeTab, setActiveTab] = useState('model');
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

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

  const getDynamicCommand = () => {
    const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');
    switch (activeTab) {
      case 'model': return `make:model ${modelName}`;
      case 'factory': return `make:factory ${modelName}Factory --model=${modelName}`;
      case 'validation': return `make:request Store${modelName}Request`;
      default: return `make:model ${modelName} -mfs`;
    }
  };

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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Si estamos en la de JSON:
      setJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'} p-4 md:p-12 font-sans`}>
      <div className="max-w-6xl mx-auto">

        {/* DARK MODE TOGGLE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all text-xl"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <header className="text-center mb-10">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest shadow-sm">
            LaraQuick: Online Developer Tools
          </div>
          <h1 className="text-6xl font-black tracking-tighter  text-indigo-600">
            JSON <span className="dark:text-white">to Laravel</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-2 font-medium max-w-2xl mx-auto">
            Paste your JSON, get your Laravel Model. <span className="text-indigo-600 underline decoration-2">It's that simple.</span>
          </p>
        </header>

        {/* EXAMPLES */}
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
          {/* EDITOR SIDE */}
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl shadow-sm border-2 transition-all bg-white dark:bg-slate-900 ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">Source JSON</h2>
                <div className="flex gap-2">
                  <button onClick={prettifyJson} disabled={!!error} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-600 hover:text-white transition">Format</button>
                  <button onClick={handleReset} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-600 hover:text-white transition">Reset</button>
                  <input type="file" id="file-json" className="hidden" accept=".json" onChange={handleFileUpload} />
                  <label htmlFor="file-json" className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-600 hover:text-white transition shadow-sm">
                    Import .JSON
                  </label>
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
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artisan {activeTab} Command</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`php artisan ${getDynamicCommand()}`); alert("Command copied!"); }}
                  className="text-[10px] text-slate-400 hover:text-white uppercase font-bold transition"
                >
                  Copy
                </button>
              </div>
              <code className="text-sm sm:text-base block">
                <span className="text-emerald-400 font-bold">php artisan</span>
                <span className="text-slate-100 ml-2 italic text-sm">{getDynamicCommand()}</span>
              </code>
            </div>

            <div className="flex justify-between items-end mb-2 ml-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Input {activeTab === 'sql' ? 'SQL' : 'JSON'}:
              </label>

              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".sql,.json,.txt"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-tight text-slate-600 cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import File
                </label>
              </div>
            </div>
          </div>

          {/* PREVIEW SIDE */}
          <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
            <nav className="flex bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
              {['model', 'factory', 'validation'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
                  {tab}
                </button>
              ))}
            </nav>
            <div className="grow relative bg-slate-900 min-h-[400px]">
              <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />

              {/* BOTÓN DE COPIAR EN PREVIEW (RECUPERADO) */}
              {!error && (
                <button
                  onClick={() => { navigator.clipboard.writeText(results[activeTab]); alert("Copied!"); }}
                  className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 hover:bg-indigo-700 transition z-10"
                >
                  COPY {activeTab.toUpperCase()}
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

              {/* SECCIÓN DE ÉXITO POST-GENERACIÓN DE ENLACE */}
              {shareUrl && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-in fade-in zoom-in duration-300">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-3 tracking-widest">
                    ✅ Schema saved successfully!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-xs font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition uppercase tracking-wider"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => window.open(shareUrl, '_blank')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg hover:bg-slate-950 transition uppercase tracking-wider border border-slate-700"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

        {/* DOCUMENTACIÓN Y ERRORES (RECUPERADO) */}
        <section className="mt-20 max-w-4xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-black mb-4">How it works?</h2>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex gap-3">
                  <span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
                  <span><strong>Paste your JSON:</strong> Copy any object or array of objects from your API or database.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
                  <span><strong>Define Table Name:</strong> We automatically singularize it for your Models and Factories.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
                  <span><strong>Instant Code:</strong> Switch between tabs to get Migrations, Models, and even Form Requests.</span>
                </li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30">
              <h2 className="text-2xl font-black mb-4 text-red-600 dark:text-red-400">Common Issues</h2>
              <ul className="space-y-3 text-sm text-red-700 dark:text-red-300/80">
                <li>• <strong>Trailing Commas:</strong> Standard JSON doesn't allow commas after the last element.</li>
                <li>• <strong>Double Quotes:</strong> Keys and strings must use "double quotes", not 'single'.</li>
                <li>• <strong>Data Types:</strong> Ensure numbers don't have quotes if you want 'integer' columns.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SEO SECTION */}
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

        {/* ARTISAN COMMANDS SECTION */}
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

        <section className="mt-24 max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-black mb-8 dark:text-white">Why use our JSON to Laravel Generator?</h2>
          <div className="grid gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-200 mb-2 italic">How to convert JSON to Laravel Migrations?</h3>
              <p>Simply paste your JSON object into the editor, define your table name, and our tool will automatically map data types like strings, integers, and booleans to the correct Laravel Schema methods.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-200 mb-2 italic">Does it support Laravel 11?</h3>
              <p>Yes, LaraQuick is fully optimized for Laravel 11, generating clean PSR-12 compliant code for Models, Factories, and Migrations.</p>
            </div>
          </div>
        </section>

        {/* FOOTER (RECUPERADO TERMS) */}
        <footer className="mt-20 text-center border-t border-slate-200 dark:border-slate-800 pt-10 pb-10">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-8">
            <Link href="/about" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">About Us</Link>
            <Link href="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">Privacy Policy</Link>
            <Link href="/terms" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">Terms of Service</Link>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} LaraQuick Tool • Built for the Laravel Community
          </div>
        </footer>
      </div>
    </main>
  );
}