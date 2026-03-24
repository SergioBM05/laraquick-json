"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';

type TabType = 'migration' | 'model' | 'factory';

interface GeneratedResults {
    migration: string;
    model: string;
    factory: string;
}

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
    const [activeTab, setActiveTab] = useState<TabType>('migration');
    const [darkMode, setDarkMode] = useState(false);

    // 1. Persistencia con LocalStorage
    useEffect(() => {
        const savedSql = localStorage.getItem('laraquick_last_sql');
        const savedTable = localStorage.getItem('laraquick_last_table');
        if (savedSql) setSql(savedSql);
        if (savedTable) setTableName(savedTable);
    }, []);

    useEffect(() => {
        if (sql) localStorage.setItem('laraquick_last_sql', sql);
        if (tableName) localStorage.setItem('laraquick_last_table', tableName);
    }, [sql, tableName]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // 2. Lógica de conversión SQL -> Laravel
    const results: GeneratedResults = useMemo(() => {
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
        let castsFields: string[] = [];

        lines.forEach(line => {
            const clean = line.trim().toLowerCase();
            if (clean.startsWith('--') || clean.startsWith('#') || clean.startsWith('/*')) return;

            const parts = clean.split(/\s+/);
            if (parts.length < 2) return;

            const colName = parts[0].replace(/['"`]/g, '').replace(',', '');

            // Ignorar IDs y Timestamps automáticos
            if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(colName) || clean.includes('primary key')) return;

            fillableFields.push(`'${colName}'`);

            // Lógica de detección de tipos y generación de Casts
            if (clean.includes('varchar') || clean.includes('string') || clean.includes('char')) {
                migrationFields += `            $table->string('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->sentence(),\n`;
            } else if (clean.includes('text')) {
                migrationFields += `            $table->text('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->paragraph(),\n`;
            } else if (clean.includes('boolean') || clean.includes('tinyint(1)')) {
                migrationFields += `            $table->boolean('${colName}')->default(false);\n`;
                factoryFields += `            '${colName}' => fake()->boolean(),\n`;
                castsFields.push(`'${colName}' => 'boolean'`);
            } else if (clean.includes('int')) {
                migrationFields += `            $table->integer('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->randomNumber(),\n`;
            } else if (clean.includes('timestamp') || clean.includes('datetime') || clean.includes('date')) {
                migrationFields += `            $table->timestamp('${colName}')->nullable();\n`;
                factoryFields += `            '${colName}' => fake()->dateTime(),\n`;
                castsFields.push(`'${colName}' => 'datetime'`);
            } else if (clean.includes('decimal') || clean.includes('float') || clean.includes('double')) {
                migrationFields += `            $table->decimal('${colName}', 8, 2);\n`;
                factoryFields += `            '${colName}' => fake()->randomFloat(2, 10, 1000),\n`;
            }
        });

        const castsProperty = castsFields.length > 0
            ? `\n    protected $casts = [\n        ${castsFields.join(',\n        ')}\n    ];\n`
            : "";

        return {
            migration: `<?php\n\nuse Illuminate\\Database\\Migrations\\Migration;\nuse Illuminate\\Database\\Schema\\Blueprint;\nuse Illuminate\\Support\\Facades\\Schema;\n\nreturn new class extends Migration\n{\n    public function up(): void\n    {\n        Schema::create('${finalTableName}', function (Blueprint $table) {\n            $table->id();\n${migrationFields}            $table->timestamps();\n        });\n    }\n};`,
            model: `<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\nuse Illuminate\\Database\\Eloquent\\Factories\\HasFactory;\n\nclass ${modelName} extends Model\n{\n    use HasFactory;\n\n    protected $fillable = [\n        ${fillableFields.join(',\n        ')}\n    ];${castsProperty}\n}`,
            factory: `<?php\n\nnamespace Database\\Factories;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\Factory;\n\nclass ${modelName}Factory extends Factory\n{\n    public function definition(): array\n    {\n        return [\n${factoryFields}        ];\n    }\n}`
        };
    }, [sql, tableName]);

    // 3. Handlers
    const loadExampleSql = (sqlText: string, name: string) => {
        setSql(sqlText);
        setTableName(name);
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

    return (
        <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'} p-4 md:p-12 font-sans`}>
            <div className="max-w-6xl mx-auto">
                <button onClick={() => setDarkMode(!darkMode)} className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all text-xl">
                    {darkMode ? '☀️' : '🌙'}
                </button>

                <header className="text-center mb-10">
                    <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest shadow-sm">
                        LaraQuick: Online Developer Tools
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter text-indigo-600">
                        SQL <span className="dark:text-white">to Laravel</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mt-2 font-medium max-w-2xl mx-auto">
                        Paste your SQL Schema, get your Laravel Files. <span className="text-indigo-600 underline decoration-2">It's that simple.</span>
                    </p>
                </header>

                {/* 4. Common SQL Schemas Section */}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Editor */}
                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl shadow-sm border-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">Source SQL</h2>
                                <button onClick={() => { setSql(''); setTableName(''); }} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-600 hover:text-white transition">Reset</button>
                            </div>
                            <input
                                className="w-full p-3 mb-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Table Name (optional)"
                                value={tableName}
                                onChange={(e) => setTableName(e.target.value)}
                            />
                            <CodeEditor value={sql} onChange={setSql} language="sql" />
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artisan Command</span>
                                <button onClick={() => { navigator.clipboard.writeText(`php artisan make:model ${tableName.replace(/s$/, '')} -mfs`); alert("Copied!"); }} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold transition">Copy</button>
                            </div>
                            <code className="text-sm block text-slate-100">
                                <span className="text-emerald-400 font-bold">php artisan</span> make:model {tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '')} -mfs
                            </code>
                        </div>
                    </div>

                    {/* Right Column: Output */}
                    <div className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                        <nav className="flex bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                            {(['migration', 'model', 'factory'] as const).map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {tab}
                                </button>
                            ))}
                        </nav>
                        <div className="grow relative bg-slate-900 min-h-[450px]">
                            <CodeEditor value={results[activeTab]} onChange={() => { }} language="php" readOnly={true} />
                            <button
                                onClick={() => { navigator.clipboard.writeText(results[activeTab]); alert("Copied!"); }}
                                className="absolute bottom-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-xl active:scale-95 hover:bg-indigo-700 transition z-10"
                            >
                                COPY {activeTab.toUpperCase()}
                            </button>
                        </div>
                        <div className="p-4">
                            <button onClick={downloadPhpFile} className="w-full py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition uppercase text-xs tracking-widest">
                                📥 Download .php File
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN SEO Y CONTENIDO DE VALOR --- */}
                <section className="mt-24 border-t dark:border-slate-800 pt-16">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4 dark:text-white italic tracking-tight">
                            The Ultimate Laravel Developer Utility
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                            Stop wasting time manually writing Boilerplate. LaraQuick handles the heavy lifting
                            so you can focus on building features.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6">🚀</div>
                            <h3 className="font-bold text-lg mb-3">Laravel 11 Ready</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                We use <strong>Anonymous Migrations</strong> and the latest Eloquent standards.
                                Compatible with Laravel 10, 11 and beyond.
                            </p>
                        </div>
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6">🧠</div>
                            <h3 className="font-bold text-lg mb-3">Smart Casting</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Our engine detects <code>boolean</code>, <code>datetime</code>, and <code>decimal</code>
                                types to automatically generate the <code>$casts</code> array in your Models.
                            </p>
                        </div>
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6">🛠️</div>
                            <h3 className="font-bold text-lg mb-3">Mass Assignment Protection</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Avoid <code>Add [column] to fillable property</code> errors. We pre-fill
                                the <code>$fillable</code> array based on your SQL schema.
                            </p>
                        </div>
                    </div>

                    {/* FAQ Engine for SEO (Google loves this) */}
                    <div className="max-w-4xl mx-auto space-y-8 bg-indigo-50/30 dark:bg-slate-900/50 p-10 rounded-3xl border border-indigo-100 dark:border-slate-800">
                        <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
                        <div className="grid md:grid-cols-2 gap-10">
                            <div>
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">How to convert SQL to Laravel Migration?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Simply paste your <code>CREATE TABLE</code> statement into the editor.
                                    LaraQuick parses the data types and constraints to generate a
                                    standard Laravel Schema Blueprint.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">Does it support Foreign Keys?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Currently, it detects <code>_id</code> columns. We recommend using
                                    <code>$table-$gt foreignId()</code> for a cleaner migration structure in your generated files.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">Is my data safe?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Yes. LaraQuick is a <strong>client-side tool</strong>. Your SQL code
                                    never leaves your browser; all conversions happen locally via JavaScript.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">Can I export to PHP?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Absolutely. You can copy the code directly or use the <strong>Download .php File</strong>
                                    button to save it directly into your Laravel project.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="mt-20 text-center border-t border-slate-200 dark:border-slate-800 pt-10 pb-12">
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-8">
                        <Link href="/about" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">About Tool</Link>
                        <Link href="/sql-to-laravel" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">SQL Converter</Link>
                        <Link href="/privacy" className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition">Privacy</Link>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-[0.3em] mb-4">
                        &copy; {new Date().getFullYear()} LaraQuick Tool • Created for the Laravel Ecosystem
                    </div>
                    <p className="text-[9px] text-slate-400 max-w-md mx-auto leading-loose">
                        LaraQuick is not affiliated with Laravel LLC. Laravel is a trademark of Taylor Otwell.
                        The generated code should be reviewed before production use.
                    </p>
                </footer>
            </div>
        </main>
    );
}