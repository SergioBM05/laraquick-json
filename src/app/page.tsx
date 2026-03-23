"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (json.trim() === "") {
        setError("El JSON no puede estar vacío");
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

  // NUEVA FUNCIÓN: Descargar archivo .php
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          table_name: tableName,
          json_content: json
        }),
      });
      
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      
      const data = await response.json();
      const url = `${window.location.origin}/s/${data.slug}`;
      setShareUrl(url);
    } catch (e) {
      alert("Error al conectar con el servidor de Laravel.");
    } finally {
      setIsSharing(false);
    }
  };

  // Validación para deshabilitar botones
  const isInvalid = !!error || json.trim() === "" || json === "{}";

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">

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
          <div className="space-y-4">
            <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${error ? 'border-red-300' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Source JSON</h2>
                <button onClick={prettifyJson} disabled={!!error} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white disabled:opacity-50 transition">
                  Format JSON
                </button>
              </div>
              <input className="w-full p-3 mb-4 border border-slate-200 rounded-xl bg-slate-50 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Table name (e.g. products)" value={tableName} onChange={(e) => setTableName(e.target.value)} />
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
                <button onClick={() => navigator.clipboard.writeText(results[activeTab])} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition">
                  COPY CODE
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t space-y-3">
              <button 
                onClick={handleShare}
                disabled={isSharing || isInvalid}
                className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${
                  (isSharing || isInvalid) ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'
                }`}
              >
                {isSharing ? 'Saving...' : '🚀 Save & Share Schema'}
              </button>

              {!error && (
                <button 
                  onClick={downloadPhpFile}
                  className="w-full py-3 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition uppercase text-xs tracking-widest"
                >
                  📥 Download .php File
                </button>
              )}

              {shareUrl && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in zoom-in duration-300">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Public Link Generated:</p>
                  <div className="flex gap-2">
                    <input readOnly value={shareUrl} className="flex-1 bg-white border border-emerald-200 rounded-lg p-2 text-xs font-mono text-emerald-800 outline-none" />
                    <button onClick={() => {navigator.clipboard.writeText(shareUrl); alert("URL Copied!");}} className="bg-emerald-600 text-white px-4 rounded-lg text-xs font-bold">Copy</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">Instant Conversion</h3>
            <p className="text-sm text-slate-500">Generate your <strong>Laravel Schema</strong> and <strong>Eloquent Models</strong> instantly.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">SEO Optimized</h3>
            <p className="text-sm text-slate-500">Shareable links help Google index your database structures.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">📂</div>
            <h3 className="font-bold text-slate-800 mb-2 text-lg">PSR-12 Standard</h3>
            <p className="text-sm text-slate-500">Clean, production-ready code for <strong>Laravel 10 & 11</strong>.</p>
          </div>
        </section>

        <footer className="mt-20 pt-10 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-8">
            <Link href="/about" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">About Us</Link>
            <Link href="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Privacy Policy</Link>
            <Link href="/terms" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Terms</Link>
          </div>
          <div className="text-center text-[10px] text-slate-300 font-medium uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} LaraQuick Tools • Built for the Laravel Community
          </div>
        </footer>
      </div>
    </main>
  );
}