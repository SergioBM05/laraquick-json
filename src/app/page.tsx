"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link'; // Importante para los enlaces del footer
import { jsonToLaravelMigration, jsonToLaravelModel } from '@/utils/converter';
import CodeEditor from '@/components/CodeEditor';

// Función para generar Factory
const jsonToLaravelFactory = (json: string, className: string = 'Example'): string => {
  try {
    const data = JSON.parse(json);
    const obj = Array.isArray(data) ? data[0] : data;
    let definition = "";
    Object.keys(obj).forEach((key) => {
      definition += `            '${key}' => fake()->word(),\n`;
    });
    return `namespace Database\\Factories;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\Factory;\n\nclass ${className}Factory extends Factory\n{\n    public function definition(): array\n    {\n        return [\n${definition}        ];\n    }\n}`;
  } catch (e) { return "// Esperando JSON válido..."; }
};

export default function Home() {
  const [json, setJson] = useState('{\n  "title": "Hola Mundo",\n  "views": 100,\n  "is_active": true\n}');
  const [tableName, setTableName] = useState('posts');
  const [activeTab, setActiveTab] = useState('migration');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      JSON.parse(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [json]);

  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');

  const results: Record<string, string> = {
    migration: error ? "// Error en el JSON" : jsonToLaravelMigration(json, tableName),
    model: error ? "// Error en el JSON" : jsonToLaravelModel(json, className),
    factory: error ? "// Error en el JSON" : jsonToLaravelFactory(json, className)
  };

  const prettifyJson = () => {
    try {
      const obj = JSON.parse(json);
      setJson(JSON.stringify(obj, null, 2));
      setError(null);
    } catch (e: any) {
      setError("No se puede formatear: " + e.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* HEADER SEO OPTIMIZED */}
        <header className="text-center mb-10">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-2 uppercase tracking-widest">
            Laravel Developer Tools
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            LaraQuick <span className="text-indigo-600">JSON</span>
          </h1>
          <p className="text-lg text-slate-600 mt-2 font-medium max-w-2xl mx-auto">
            The fastest <strong>JSON to Laravel</strong> converter. Generate migrations, models, and factories in one click.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PANEL IZQUIERDO */}
          <div className="space-y-4">
            <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${error ? 'border-red-300' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Source JSON</h2>
                <button onClick={prettifyJson} disabled={!!error} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition">
                  Format JSON
                </button>
              </div>
              <input className="w-full p-3 mb-4 border border-slate-200 rounded-xl bg-slate-50 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Table name (e.g. products)" value={tableName} onChange={(e) => setTableName(e.target.value)} />
              <CodeEditor value={json} onChange={setJson} language="json" />
              {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-mono rounded-lg border border-red-100 italic">{error}</div>}
            </div>
          </div>

          {/* PANEL DERECHO */}
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
                <button onClick={() => navigator.clipboard.writeText(results[activeTab])} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition">
                  COPY CODE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FEATURES SECTION (MUY IMPORTANTE PARA SEO) */}
        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">Instant Conversion</h3>
            <p className="text-sm text-slate-500">Generate your <strong>Laravel Schema</strong> and <strong>Eloquent Models</strong> instantly as you type.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">100% Secure</h3>
            <p className="text-sm text-slate-500">Your JSON data never leaves your browser. All transformations happen locally.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">📂</div>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">Clean Code</h3>
            <p className="text-sm text-slate-500">Code follows <strong>PSR-12</strong> standards and is compatible with Laravel 10 and 11.</p>
          </div>
        </section>

        {/* FOOTER CON ENLACES (VITAL PARA ADSENSE) */}
        <footer className="mt-20 pt-10 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-8">
            <Link href="/about" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">About Us</Link>
            <Link href="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Privacy Policy</Link>
            <Link href="/contact" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Contact</Link>
          </div>
          <div className="text-center text-[10px] text-slate-300 font-medium uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} LaraQuick Tools • Built for the Laravel Community
          </div>
        </footer>
      </div>
    </main>
  );
}