"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jsonToLaravelModel, jsonToLaravelFactory } from '@/utils/converter';
import CodeEditor from '@/components/CodeEditor';
import JSZip from 'jszip';

export default function Home() {
  const [json, setJson] = useState('{\n  "title": "Hello World",\n  "user_id": 1,\n  "is_active": true\n}');
  const [tableName, setTableName] = useState('posts');
  const [activeTab, setActiveTab] = useState('model');
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedJson = localStorage.getItem('laraquick_last_json');
    const savedTable = localStorage.getItem('laraquick_last_table');
    if (savedJson) setJson(savedJson);
    if (savedTable) setTableName(savedTable);
  }, []);

  useEffect(() => {
    if (json) localStorage.setItem('laraquick_last_json', json);
    if (tableName) localStorage.setItem('laraquick_last_table', tableName);
  }, [json, tableName]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    try {
      if (json.trim() === "") { setError("JSON cannot be empty"); return; }
      JSON.parse(json);
      setError(null);
    } catch (e: any) { setError(e.message); }
  }, [json]);

  const className = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');

  // --- FUNCIÓN PARA LOS SCHEMAS RÁPIDOS ---
  const loadExampleSql = (sql: string, name: string) => {
    // Mapeamos el ejemplo a JSON para que tu convertidor lo procese
    const examples: Record<string, string> = {
      "products": '{\n  "name": "Smartphone",\n  "price": 699.99,\n  "stock": 50,\n  "description": "Latest model",\n  "is_active": true\n}',
      "profiles": '{\n  "user_id": 1,\n  "bio": "Software developer",\n  "avatar_url": "https://example.com/a.jpg",\n  "birth_date": "1995-05-15",\n  "is_verified": true\n}',
      "posts": '{\n  "title": "Laravel 11 Guide",\n  "slug": "laravel-11-guide",\n  "body": "Content here...",\n  "category_id": 1\n}'
    };
    setJson(examples[name] || json);
    setTableName(name);
  };

  const getValidationRules = (data: any, isUpdate = false) => {
    let rules = "";
    Object.keys(data).forEach(key => {
      const val = data[key];
      let rule = isUpdate ? "sometimes|required" : "required";
      if (key.includes('email')) rule += "|string|email|max:255";
      else if (typeof val === 'string') rule += "|string";
      else if (typeof val === 'number') rule += "|numeric";
      else if (typeof val === 'boolean') rule += "|boolean";
      rules += `            '${key}' => '${rule}',\n`;
    });
    return rules;
  };

  const results: Record<string, string> = {
    model: error ? "<?php // Error" : `<?php\n\n${jsonToLaravelModel(json, className)}`,
    migration: error ? "<?php // Error" : (function () {
      try {
        const data = JSON.parse(json);
        const fields = Object.keys(Array.isArray(data) ? data[0] : data).map(key => {
          if (['id', 'created_at', 'updated_at'].includes(key.toLowerCase())) return null;
          if (key.endsWith('_id')) return `            $table->foreignId('${key}')->constrained();`;
          return `            $table->string('${key}');`;
        }).filter(Boolean).join('\n');
        return `<?php\n\nuse Illuminate\\Database\\Migrations\\Migration;\nuse Illuminate\\Database\\Schema\\Blueprint;\nuse Illuminate\\Support\\Facades\\Schema;\n\nreturn new class extends Migration {\n    public function up(): void {\n        Schema::create('${tableName.toLowerCase()}', function (Blueprint $table) {\n            $table->id();\n${fields}\n            $table->timestamps();\n        });\n    }\n};`;
      } catch (e) { return "<?php // Error"; }
    })(),
    controller: error ? "<?php // Error" : (function () {
      try {
        const data = JSON.parse(json);
        const rules = getValidationRules(Array.isArray(data) ? data[0] : data);
        const updateRules = getValidationRules(Array.isArray(data) ? data[0] : data, true);
        const varName = className.toLowerCase();
        return `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse App\\Models\\${className};\nuse Illuminate\\Http\\Request;\n\nclass ${className}Controller extends Controller\n{\n    public function index()\n    {\n        return response()->json(${className}::all());\n    }\n\n    public function store(Request $request)\n    {\n        $validated = $request->validate([\n${rules}        ]);\n\n        $${varName} = ${className}::create($validated);\n        return response()->json($${varName}, 201);\n    }\n\n    public function show(${className} $${varName})\n    {\n        return response()->json($${varName});\n    }\n\n    public function update(Request $request, ${className} $${varName})\n    {\n        $validated = $request->validate([\n${updateRules}        ]);\n\n        $${varName}->update($validated);\n        return response()->json($${varName});\n    }\n\n    public function destroy(${className} $${varName})\n    {\n        $${varName}->delete();\n        return response()->json(null, 204);\n    }\n}`;
      } catch (e) { return "<?php // Error"; }
    })(),
    factory: error ? "<?php // Error" : `<?php\n\n${jsonToLaravelFactory(json, className)}`
  };

  const getDynamicCommand = () => {
    const modelName = className || 'Model';
    switch (activeTab) {
      case 'model': return `make:model ${modelName} -mfs`;
      case 'controller': return `make:controller ${modelName}Controller --api`;
      case 'factory': return `make:factory ${modelName}Factory`;
      case 'migration': return `make:migration create_${tableName || 'table'}_table`;
      default: return `make:model ${modelName}`;
    }
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    zip.file(`app/Models/${className}.php`, results.model);
    zip.file(`app/Http/Controllers/${className}Controller.php`, results.controller);
    zip.file(`database/migrations/${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_create_${tableName.toLowerCase()}_table.php`, results.migration);
    zip.file(`database/factories/${className}Factory.php`, results.factory);
    zip.file(`routes/api_snippet.php`, `<?php\n\nuse App\\Http\\Controllers\\${className}Controller;\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::apiResource('${tableName.toLowerCase()}', ${className}Controller::class);`);
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `laraquick_${tableName.toLowerCase()}.zip`;
    link.click();
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'} p-4 md:p-12 font-sans`}>
      <div className="max-w-6xl mx-auto">
        <button onClick={() => setDarkMode(!darkMode)} className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all text-xl">{darkMode ? '☀️' : '🌙'}</button>

        <header className="text-center mb-16">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest shadow-sm">LaraQuick: Online Developer Tools</div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">JSON <span className="text-indigo-600">TO LARAVEL</span> CONVERTER</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Generate Full CRUD Structure & Download as ZIP</p>
        </header>

        {/* --- 4. Common SQL Schemas Section (IMPLEMENTADO AQUÍ) --- */}
        <div className="mt-8 mb-8 p-6 bg-indigo-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-indigo-200 dark:border-slate-700">
          <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 text-center">
            Quick Starter SQL Schemas
          </h4>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              {
                label: "🛒 Products Table",
                name: "products",
                sql: "CREATE TABLE products (\n  id INT PRIMARY KEY,\n  name VARCHAR(255),\n  price DECIMAL(10,2),\n  stock INT,\n  description TEXT,\n  is_active BOOLEAN\n);"
              },
              {
                label: "👤 Profiles Table",
                name: "profiles",
                sql: "CREATE TABLE profiles (\n  id INT PRIMARY KEY,\n  user_id INT,\n  bio TEXT,\n  avatar_url VARCHAR(255),\n  birth_date DATE,\n  is_verified BOOLEAN\n);"
              },
              {
                label: "📑 Blog Posts",
                name: "posts",
                sql: "CREATE TABLE posts (\n  id INT PRIMARY KEY,\n  title VARCHAR(255),\n  slug VARCHAR(255),\n  body TEXT,\n  published_at TIMESTAMP,\n  category_id INT\n);"
              }
            ].map((schema, i) => (
              <button
                key={i}
                onClick={() => loadExampleSql(schema.sql, schema.name)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold hover:border-indigo-500 transition-all shadow-sm dark:text-slate-200"
              >
                {schema.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- APP CORE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl shadow-sm border-2 transition-all bg-white dark:bg-slate-900 ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">Source JSON</h2>
                <div className="flex gap-2">
                  <button onClick={() => setJson(JSON.stringify(JSON.parse(json), null, 2))} className="text-[10px] font-black uppercase px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md">Format</button>
                  <button onClick={() => { if (confirm("Clear?")) setJson('{\n\n}'); }} className="text-[10px] font-black uppercase px-3 py-1 bg-red-50 text-red-600 rounded-md">Reset</button>
                  <input type="file" id="file-json" className="hidden" accept=".json" onChange={(e) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => setJson(ev.target?.result as string);
                    if (e.target.files?.[0]) reader.readAsText(e.target.files[0]);
                  }} />
                  <label htmlFor="file-json" className="text-[10px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md cursor-pointer">Import</label>
                </div>
              </div>
              <input className="w-full p-3 mb-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800" placeholder="Table name (e.g. posts)" value={tableName} onChange={(e) => setTableName(e.target.value)} />
              <CodeEditor value={json} onChange={setJson} language="json" />
              {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-mono rounded-lg border border-red-100 italic">{error}</div>}
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artisan {activeTab} Command</span>
                <button onClick={() => { navigator.clipboard.writeText(`php artisan ${getDynamicCommand()}`); alert("Command copied!"); }} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold transition">Copy</button>
              </div>
              <code className="text-sm sm:text-base block">
                <span className="text-emerald-400 font-bold">php artisan</span>
                <span className="text-slate-100 ml-2 italic text-sm">{getDynamicCommand()}</span>
              </code>
            </div>

            <button onClick={downloadZip} disabled={!!error} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl flex items-center justify-center gap-3">📦 DOWNLOAD FULL CRUD (.ZIP)</button>
          </div>

          <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
            <nav className="flex bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
              {['model', 'migration', 'controller', 'factory'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>{tab}</button>
              ))}
            </nav>
            <div className="grow relative bg-slate-900 min-h-[400px]">
              <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />
              {!error && (
                <button onClick={() => { navigator.clipboard.writeText(results[activeTab]); alert("Code copied!"); }} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition">COPY {activeTab.toUpperCase()}</button>
              )}
            </div>
          </div>
        </div>

        {/* --- SEO SECTION --- */}
        <section className="mt-20 max-w-4xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-black mb-4 dark:text-white">How it works?</h2>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex gap-3"><span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span><span><strong>Paste your JSON:</strong> Copy any object or array of objects from your API or database.</span></li>
                <li className="flex gap-3"><span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span><span><strong>Define Table Name:</strong> We automatically singularize it for your Models and Factories.</span></li>
                <li className="flex gap-3"><span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span><span><strong>Instant Code:</strong> Get PSR-12 compliant Laravel code and download the whole structure as ZIP.</span></li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30">
              <h2 className="text-2xl font-black mb-4 text-red-600 dark:text-red-400">Common Issues</h2>
              <ul className="space-y-3 text-sm text-red-700 dark:text-red-300/80">
                <li>• <strong>Trailing Commas:</strong> Standard JSON doesn't allow commas after the last element.</li>
                <li>• <strong>Double Quotes:</strong> Keys and strings must use "double quotes", not 'single'.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 border-t dark:border-slate-800 pt-10 text-center">
          <div><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">⚡ Instant Conversion</h3><p className="text-sm text-slate-500 dark:text-slate-400">Generate migrations and models in seconds. Optimized for Laravel 11.</p></div>
          <div><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">🛡️ PSR-12 Standard</h3><p className="text-sm text-slate-500 dark:text-slate-400">Clean, production-ready code following PHP community standards.</p></div>
          <div><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">🔗 ZIP Download</h3><p className="text-sm text-slate-500 dark:text-slate-400">Download Models, Controllers and Migrations in a single folder.</p></div>
        </section>

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
          <div className="mt-12 p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">Why use LaraQuick?</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
              Modern web applications require rapid prototyping. LaraQuick follows the <strong>PSR-12 coding standard</strong> and es compatible con <strong>Laravel 10 y 11</strong>. Genera estructuras limpias para que tu equipo pueda escalar sin deuda técnica.
            </p>
          </div>
        </section>

        <section className="mt-24 max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-black mb-8 dark:text-white">Why use our JSON to Laravel Generator?</h2>
          <div className="grid gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-200 mb-2 italic">How to convert JSON to Laravel Migrations?</h3>
              <p>Paste your JSON, define your table name, and our tool maps data types like strings, integers, and booleans automatically to Schema methods.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-200 mb-2 italic">Does it support Laravel 11?</h3>
              <p>Yes, LaraQuick is optimized for Laravel 11, generating clean code for Models, Factories, Controllers and Migrations.</p>
            </div>
          </div>
        </section>

        <footer className="mt-32 text-center border-t border-slate-200 dark:border-slate-800 pt-16 pb-16">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-10">
            <Link href="/about" className="text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">The Project</Link>
            <Link href="/terms" className="text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Usage Policy</Link>
            <Link href="/contact" className="text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition">Feedback</Link>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.4em] mb-6">
            LaraQuick &copy; {new Date().getFullYear()} • Optimized for Laravel 11.x
          </div>
          <p className="text-[9px] text-slate-400 max-w-lg mx-auto leading-relaxed font-medium">
            DISCLAIMER: This tool is an independent utility provided for the developer community. Laravel™ is a registered trademark of Laravel Holdings Inc. Always audit generated code before deploying to production environments.
          </p>
        </footer>
      </div>
    </main>
  );
}