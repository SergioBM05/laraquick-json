"use client";
import { useState, useEffect } from 'react';
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

  // Validar JSON cada vez que cambie
  useEffect(() => {
    try {
      JSON.parse(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [json]);

  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');

  // Solo generamos resultados si el JSON es válido
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

        {/* HEADER */}
        <header className="text-center mb-10">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-2 uppercase tracking-widest">
            v1.0 Stable
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            LaraQuick <span className="text-indigo-600">JSON</span>
          </h1>
          <p className="text-lg text-slate-600 mt-2 font-medium">
            Valida y convierte JSON a código Eloquent al instante.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* COLUMNA IZQUIERDA: ENTRADA */}
          <div className="space-y-4">
            <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${error ? 'border-red-300 shadow-red-50' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 flex items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold transition-colors ${error ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    1
                  </span>
                  Input JSON
                </h2>
                <button 
                  onClick={prettifyJson}
                  disabled={!!error}
                  className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                    error 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                  }`}
                >
                  Validar y Formatear
                </button>
              </div>
              
              <div className="mb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Table Name</label>
                <input
                  className="w-full p-3 mt-1 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-mono text-sm"
                  placeholder="ej: users, products..."
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
              
              <CodeEditor value={json} onChange={setJson} language="json" />
              
              {/* MENSAJE DE ERROR DINÁMICO */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase">JSON Inválido</p>
                    <p className="text-xs text-red-600 font-mono">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: SALIDA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex bg-slate-50 border-b">
              {['migration', 'model', 'factory'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-0 flex-grow relative bg-slate-900">
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">🚫</div>
                  <p className="font-bold text-sm uppercase tracking-widest">Esperando JSON válido</p>
                  <p className="text-xs mt-2 opacity-50">Corrige los errores en el panel de la izquierda para generar el código.</p>
                </div>
              ) : (
                <>
                  <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />
                  <button
                    onClick={() => navigator.clipboard.writeText(results[activeTab])}
                    className="absolute bottom-6 right-6 bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-xl hover:bg-indigo-700 transition-all font-bold text-sm active:scale-95 border-b-4 border-indigo-800"
                  >
                    COPY {activeTab.toUpperCase()}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN SEO ADENSE (SIN CAMBIOS PERO NECESARIA) */}
        <section className="mt-16 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm prose prose-slate max-w-none">
           {/* ... contenido SEO anterior ... */}
           <h2 className="text-3xl font-black">Herramienta de desarrollo Laravel</h2>
           <p>Convierte objetos JSON complejos en estructuras listas para usar en proyectos <strong>Laravel 11</strong>.</p>
        </section>

        <footer className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-8">
          &copy; {new Date().getFullYear()} LaraQuick Tools • Built for Developers
        </footer>
      </div>
    </main>
  );
}