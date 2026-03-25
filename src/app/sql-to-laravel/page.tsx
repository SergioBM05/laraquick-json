"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import JSZip from 'jszip';

type TabType = 'migration' | 'model' | 'factory' | 'controller';

export default function SqlToLaravel() {
    const [sql, setSql] = useState(`CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);`);
    const [tableName, setTableName] = useState('posts');
    const [activeTab, setActiveTab] = useState<TabType>('model');
    const [darkMode, setDarkMode] = useState(false);
    const className = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');

    // --- PERSISTENCIA ---
    useEffect(() => {
        const savedSql = localStorage.getItem('laraquick_sql_content');
        const savedTable = localStorage.getItem('laraquick_sql_table');
        if (savedSql) setSql(savedSql);
        if (savedTable) setTableName(savedTable);
    }, []);

    useEffect(() => {
        localStorage.setItem('laraquick_sql_content', sql);
        localStorage.setItem('laraquick_sql_table', tableName);
    }, [sql, tableName]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // --- LÓGICA DE CONVERSIÓN SQL -> LARAVEL ---
    const results = useMemo(() => {
        const tableMatch = sql.match(/CREATE TABLE\s+[`"']?(\w+)[`"']?/i);
        const sqlDetectedName = tableMatch ? tableMatch[1] : 'table';
        const finalTableName = tableName.trim() !== "" ? tableName : sqlDetectedName;

        const modelName = finalTableName
            .replace(/s$/, '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        const lines = sql.split('\n').filter(l =>
            !l.toUpperCase().includes('CREATE TABLE') &&
            !l.trim().startsWith(')') &&
            l.trim() !== ''
        );

        let migrationFields = "";
        let fillableFields: string[] = [];
        let factoryFields = "";
        let validationRules = "";

        lines.forEach(line => {
            const clean = line.trim().toLowerCase();
            if (clean.startsWith('--') || clean.startsWith('#') || clean.startsWith('/*')) return;

            const parts = clean.split(/\s+/);
            if (parts.length < 2) return;
            const colName = parts[0].replace(/['"`]/g, '').replace(',', '');

            if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(colName) || clean.includes('primary key')) return;

            fillableFields.push(`'${colName}'`);

            if (clean.includes('varchar') || clean.includes('string')) {
                migrationFields += `            $table->string('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->sentence(),\n`;
                validationRules += `            '${colName}' => 'required|string|max:255',\n`;
            } else if (clean.includes('text')) {
                migrationFields += `            $table->text('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->paragraph(),\n`;
                validationRules += `            '${colName}' => 'required|string',\n`;
            } else if (clean.includes('boolean') || clean.includes('tinyint(1)')) {
                migrationFields += `            $table->boolean('${colName}')->default(false);\n`;
                factoryFields += `            '${colName}' => fake()->boolean(),\n`;
                validationRules += `            '${colName}' => 'boolean',\n`;
            } else if (clean.includes('int')) {
                migrationFields += `            $table->integer('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->randomNumber(),\n`;
                validationRules += `            '${colName}' => 'required|integer',\n`;
            } else if (colName.endsWith('_id')) {
                migrationFields += `            $table->foreignId('${colName}')->constrained()->cascadeOnDelete();\n`;
                factoryFields += `            '${colName}' => fake()->randomNumber(),\n`;
                validationRules += `            '${colName}' => 'required|exists:another_table,id',\n`;
            }
        });

        const varName = modelName.toLowerCase();

        return {
            migration: `<?php\n\nuse Illuminate\\Database\\Migrations\\Migration;\nuse Illuminate\\Database\\Schema\\Blueprint;\nuse Illuminate\\Support\\Facades\\Schema;\n\nreturn new class extends Migration {\n    public function up(): void {\n        Schema::create('${finalTableName}', function (Blueprint $table) {\n            $table->id();\n${migrationFields}            $table->timestamps();\n        });\n    }\n};`,
            model: `<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\nuse Illuminate\\Database\\Eloquent\\Factories\\HasFactory;\n\nclass ${modelName} extends Model {\n    use HasFactory;\n\n    protected $fillable = [\n        ${fillableFields.join(',\n        ')}\n    ];\n}`,
            factory: `<?php\n\nnamespace Database\\Factories;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\Factory;\n\nclass ${modelName}Factory extends Factory {\n    public function definition(): array {\n        return [\n${factoryFields}        ];\n    }\n}`,
            controller: `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse App\\Models\\${modelName};\nuse Illuminate\\Http\\Request;\n\nclass ${modelName}Controller extends Controller {\n    public function index() {\n        return response()->json(${modelName}::all());\n    }\n\n    public function store(Request $request) {\n        $validated = $request->validate([\n${validationRules}        ]);\n\n        $${varName} = ${modelName}::create($validated);\n        return response()->json($${varName}, 201);\n    }\n\n    public function show(${modelName} $${varName}) {\n        return response()->json($${varName});\n    }\n\n    public function update(Request $request, ${modelName} $${varName}) {\n        $validated = $request->validate([\n${validationRules.replace(/required/g, 'sometimes|required')}\n        ]);\n\n        $${varName}->update($validated);\n        return response()->json($${varName});\n    }\n\n    public function destroy(${modelName} $${varName}) {\n        $${varName}->delete();\n        return response()->json(null, 204);\n    }\n}`,
            modelName
        };
    }, [sql, tableName]);

    const downloadZip = async () => {
        const zip = new JSZip();
        const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '_');

        zip.file(`app/Models/${results.modelName}.php`, results.model);
        zip.file(`app/Http/Controllers/${results.modelName}Controller.php`, results.controller);
        zip.file(`database/migrations/${datePrefix}_create_${tableName.toLowerCase()}_table.php`, results.migration);
        zip.file(`database/factories/${results.modelName}Factory.php`, results.factory);
        zip.file(`routes/api_snippet.php`, `<?php\n\nuse App\\Http\\Controllers\\${results.modelName}Controller;\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::apiResource('${tableName.toLowerCase()}', ${results.modelName}Controller::class);`);

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `laraquick_sql_${tableName.toLowerCase()}.zip`;
        link.click();
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

    return (
        <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'} p-4 md:p-12 font-sans`}>
            <div className="max-w-6xl mx-auto">
                <button onClick={() => setDarkMode(!darkMode)} className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all text-xl">{darkMode ? '☀️' : '🌙'}</button>

                <header className="text-center mb-16">
                    <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest shadow-sm">LaraQuick: Modern Laravel Utilities</div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">SQL <span className="text-indigo-600">to Laravel</span> CONVERTER</h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Automate your Backend Workflow: From SQL Dumps to Eloquent Models</p>
                </header>

                {/* --- QUICK STARTER SQL --- */}
                <div className="mt-8 mb-8 p-6 bg-indigo-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-indigo-200 dark:border-slate-700">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 text-center">Instant Schema Templates</h4>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {[
                            { label: "🛒 E-commerce Product", name: "products", sql: "CREATE TABLE products (\n  id INT PRIMARY KEY,\n  name VARCHAR(255),\n  price DECIMAL(10,2),\n  stock INT,\n  is_active BOOLEAN\n);" },
                            { label: "👤 User Profile", name: "profiles", sql: "CREATE TABLE profiles (\n  id INT PRIMARY KEY,\n  user_id INT,\n  bio TEXT,\n  avatar_url VARCHAR(255),\n  is_verified BOOLEAN\n);" },
                            { label: "📑 CMS Blog Post", name: "posts", sql: "CREATE TABLE posts (\n  id INT PRIMARY KEY,\n  title VARCHAR(255),\n  slug VARCHAR(255),\n  body TEXT,\n  category_id INT\n);" }
                        ].map((schema, i) => (
                            <button key={i} onClick={() => { setSql(schema.sql); setTableName(schema.name); }} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold hover:border-indigo-500 transition-all shadow-sm dark:text-slate-200">
                                {schema.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- EDITOR CORE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                        <div className={`p-6 rounded-2xl shadow-sm border-2 transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">Source SQL Script</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setSql(sql.toUpperCase())} className="text-[10px] font-black uppercase px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md">Reset</button>
                                    <button onClick={() => { if (confirm("Discard all changes?")) setSql(''); }} className="text-[10px] font-black uppercase px-3 py-1 bg-red-50 text-red-600 rounded-md">Reset</button>
                                    <input type="file" id="file-sql" className="hidden" accept=".sql" onChange={(e) => {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setSql(ev.target?.result as string);
                                        if (e.target.files?.[0]) reader.readAsText(e.target.files[0]);
                                    }} />
                                    <label htmlFor="file-sql" className="text-[10px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md cursor-pointer">Import</label>
                                </div>
                            </div>
                            <input className="w-full p-3 mb-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Target table (e.g. products)" value={tableName} onChange={(e) => setTableName(e.target.value)} />
                            <CodeEditor value={sql} onChange={setSql} language="sql" />
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
                        <button onClick={downloadZip} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl flex items-center justify-center gap-3">📦 Export Laravel Boilerplate (.ZIP)</button>
                    </div>

                    {/* --- PREVIEW TABS --- */}
                    <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                        <nav className="flex bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                            {['model', 'migration', 'controller', 'factory'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab as TabType)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                            ))}
                        </nav>
                        <div className="grow relative bg-slate-900 min-h-[400px]">
                            <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />
                            <button onClick={() => { navigator.clipboard.writeText(results[activeTab]); alert("Copied to clipboard!"); }} className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 transition">COPY {activeTab.toUpperCase()}</button>
                        </div>
                    </div>
                </div>

                {/* --- NEW SEO & INFO SECTION --- */}
                <section className="mt-20 max-w-4xl mx-auto space-y-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-2xl font-black mb-4 dark:text-white uppercase tracking-tight">The Fast Way to Scaffold</h2>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Stop wasting time writing repetitive boilerplate. Our converter parses your SQL schema and generates production-ready Laravel components in seconds.</p>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                                <li className="flex gap-3 items-start"><span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs mt-0.5">1</span><span><strong>Parse SQL:</strong> Drop your `CREATE TABLE` script to extract columns and types.</span></li>
                                <li className="flex gap-3 items-start"><span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs mt-0.5">2</span><span><strong>Smart Mapping:</strong> Automagically detect Relationships, Booleans, and Strings.</span></li>
                                <li className="flex gap-3 items-start"><span className="flex-none w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs mt-0.5">3</span><span><strong>Bulk Download:</strong> Get a complete ZIP with Controllers, Models, and Migrations.</span></li>
                            </ul>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                            <h2 className="text-2xl font-black mb-4 text-amber-700 dark:text-amber-400 uppercase tracking-tight">Best Practices</h2>
                            <ul className="space-y-4 text-sm text-amber-800 dark:text-amber-300/80 leading-relaxed">
                                <li>• <strong>Relationship Awareness:</strong> Column names ending in <code>_id</code> are treated as foreign keys with <code>constrained()</code>.</li>
                                <li>• <strong>RESTful Design:</strong> Controllers follow standard API resource naming conventions for Laravel 11.</li>
                                <li>• <strong>Factory Ready:</strong> Data factories use localized Faker methods for realistic database seeding.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* --- COMMANDS SECTION --- */}
                <section className="mt-20 max-w-4xl mx-auto prose dark:prose-invert prose-slate">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">Terminal Cheat Sheet</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                        {[
                            { cmd: "php artisan migrate", desc: "Execute pending database migrations" },
                            { cmd: "php artisan make:model -mfs", desc: "Quick scaffold: Model, Mig, Factory, Seeder" },
                            { cmd: "php artisan route:list --path=api", desc: "Display all registered API endpoints" },
                            { cmd: "php artisan tinker", desc: "Interact with your database via Eloquent" }
                        ].map((item, idx) => (
                            <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-500 transition-colors">
                                <code className="text-indigo-600 dark:text-indigo-400 font-bold text-xs block mb-1">{item.cmd}</code>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- FOOTER --- */}
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