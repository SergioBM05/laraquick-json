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
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // Lógica de conversión mejorada con prioridad al Input
    const results: GeneratedResults = useMemo(() => {
        // 1. Intentar sacar el nombre del SQL, pero si el usuario escribió en el input, usar el input.
        const tableMatch = sql.match(/CREATE TABLE\s+[`"']?(\w+)[`"']?/i);
        const sqlDetectedName = tableMatch ? tableMatch[1] : 'table';
        
        // Prioridad: Input del usuario > Nombre detectado en SQL
        const finalTableName = tableName.trim() !== "" ? tableName : sqlDetectedName;
        
        const modelName = finalTableName
            .replace(/s$/, '') // Quitar plural simple
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        const lines = sql.split('\n').filter(l => !l.includes('CREATE TABLE') && !l.includes(');') && l.trim() !== '');

        let migrationFields = "";
        let fillableFields: string[] = [];
        let factoryFields = "";

        lines.forEach(line => {
            const clean = line.trim().toLowerCase();
            if (clean.startsWith('--') || clean.startsWith('#') || clean === '') return;
            
            const parts = clean.split(/\s+/);
            const colName = parts[0].replace(/['"`]/g, '').replace(',', '');
            
            // Ignorar campos automáticos de Laravel
            if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(colName) || clean.includes('primary key')) return;

            fillableFields.push(`'${colName}'`);

            if (clean.includes('varchar') || clean.includes('string')) {
                migrationFields += `            $table->string('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->sentence(),\n`;
            } else if (clean.includes('text')) {
                migrationFields += `            $table->text('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->paragraph(),\n`;
            } else if (clean.includes('int')) {
                migrationFields += `            $table->integer('${colName}');\n`;
                factoryFields += `            '${colName}' => fake()->randomNumber(),\n`;
            } else if (clean.includes('boolean') || clean.includes('tinyint(1)')) {
                migrationFields += `            $table->boolean('${colName}')->default(false);\n`;
                factoryFields += `            '${colName}' => fake()->boolean(),\n`;
            } else if (clean.includes('timestamp') || clean.includes('datetime')) {
                migrationFields += `            $table->timestamp('${colName}')->nullable();\n`;
                factoryFields += `            '${colName}' => fake()->dateTime(),\n`;
            }
        });

        return {
            migration: `<?php\n\nuse Illuminate\\Database\\Migrations\\Migration;\nuse Illuminate\\Database\\Schema\\Blueprint;\nuse Illuminate\\Support\\Facades\\Schema;\n\nreturn new class extends Migration\n{\n    public function up(): void\n    {\n        Schema::create('${finalTableName}', function (Blueprint $table) {\n            $table->id();\n${migrationFields}            $table->timestamps();\n        });\n    }\n};`,
            model: `<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\nuse Illuminate\\Database\\Eloquent\\Factories\\HasFactory;\n\nclass ${modelName} extends Model\n{\n    use HasFactory;\n\n    protected $fillable = [\n        ${fillableFields.join(',\n        ')}\n    ];\n}`,
            factory: `<?php\n\nnamespace Database\\Factories;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\Factory;\n\nclass ${modelName}Factory extends Factory\n{\n    public function definition(): array\n    {\n        return [\n${factoryFields}        ];\n    }\n}`
        };
    }, [sql, tableName]);

    const getDynamicCommand = () => {
        const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');
        switch (activeTab) {
            case 'migration': return `make:migration create_${tableName || 'table'}_table`;
            case 'model': return `make:model ${modelName}`;
            case 'factory': return `make:factory ${modelName}Factory --model=${modelName}`;
            default: return `make:model ${modelName} -mfs`;
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setSql(ev.target?.result as string);
            reader.readAsText(file);
        }
    };

    const handleReset = () => {
        if (confirm("Are you sure?")) {
            setSql('');
            setTableName('');
            setShareUrl(null);
        }
    };

    const loadExample = (type: 'user' | 'blog' | 'product') => {
        const examples = {
            user: `CREATE TABLE users (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255),\n  email VARCHAR(255) UNIQUE,\n  password VARCHAR(255)\n);`,
            blog: `CREATE TABLE posts (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  title VARCHAR(255),\n  content TEXT,\n  is_published BOOLEAN DEFAULT false\n);`,
            product: `CREATE TABLE products (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  sku VARCHAR(100),\n  price INT\n);`
        };
        setSql(examples[type]);
        setTableName(type === 'blog' ? 'posts' : type + 's');
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
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eloquentgenback-production.up.railway.app/api';
            const response = await fetch(`${API_URL}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table_name: tableName, sql_content: sql }),
            });
            const data = await response.json();
            setShareUrl(`${window.location.origin}/s/${data.slug}`);
        } catch (e) {
            alert("Error connecting to server.");
        } finally {
            setIsSharing(false);
        }
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

                <div className="flex gap-2 mb-4 justify-center items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Try examples:</span>
                    {(['user', 'blog', 'product'] as const).map((type) => (
                        <button key={type} onClick={() => loadExample(type)} className="text-[10px] px-3 py-1 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition font-bold uppercase shadow-sm">
                            {type}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl shadow-sm border-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">Source SQL</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleReset} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-600 hover:text-white transition">Reset</button>
                                    <input type="file" id="file-sql" className="hidden" accept=".sql,.txt" onChange={handleFileUpload} />
                                    <label htmlFor="file-sql" className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-600 hover:text-white transition shadow-sm">
                                        Import .SQL
                                    </label>
                                </div>
                            </div>
                            {/* ESTE INPUT AHORA TIENE PRIORIDAD */}
                            <input
                                className="w-full p-3 mb-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Override Table Name (e.g. custom_table)"
                                value={tableName}
                                onChange={(e) => setTableName(e.target.value)}
                            />
                            <CodeEditor value={sql} onChange={setSql} language="sql" />
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Artisan {activeTab} Command</span>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(`php artisan ${getDynamicCommand()}`); alert("Copied!"); }}
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
                    </div>

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
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 space-y-3 text-center">
                            <button
                                onClick={handleShare}
                                disabled={isSharing || !sql}
                                className={`w-full py-4 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${(isSharing || !sql) ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-95'}`}
                            >
                                {isSharing ? 'Saving...' : '🚀 Save & Share Schema'}
                            </button>

                            {shareUrl && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-3 tracking-widest text-center">✅ Schema saved successfully!</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input readOnly value={shareUrl} className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg text-xs font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 outline-none" />
                                        <div className="flex gap-2">
                                            <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Copied!"); }} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition uppercase tracking-wider">Copy</button>
                                            <button onClick={() => window.open(shareUrl, '_blank')} className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg hover:bg-slate-950 transition uppercase tracking-wider border border-slate-700">Preview</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button onClick={downloadPhpFile} className="w-full py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition uppercase text-xs tracking-widest">
                                📥 Download .php File
                            </button>
                        </div>
                    </div>
                </div>

                <section className="mt-24 border-t dark:border-slate-800 pt-16">
                    <h2 className="text-4xl font-black mb-12 dark:text-white text-center italic tracking-tight">Supercharge Your Laravel Workflow</h2>
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6">🚀</div>
                            <h3 className="font-bold text-lg mb-3">Instant Migrations</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Convert legacy MySQL tables into Laravel 11 migration files. Support for complex data types and automatic timestamps.</p>
                        </div>
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6">🏗️</div>
                            <h3 className="font-bold text-lg mb-3">Eloquent Models</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Generate models with the <code>$fillable</code> array pre-configured based on your SQL columns to prevent Mass Assignment errors.</p>
                        </div>
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6">🧪</div>
                            <h3 className="font-bold text-lg mb-3">Faker Factories</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Create realistic test data automatically. We map common column names to the appropriate Faker methods for you.</p>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-8 bg-indigo-50/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-indigo-100 dark:border-slate-800">
                        <h3 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions (FAQ)</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">Is it compatible with Laravel 11?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Yes, the generated code uses anonymous migrations and the simplified syntax introduced in the latest Laravel versions.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">How do I import SQL files?</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Simply use the "Import .SQL" button to load your database dump and extract the table creation logic instantly.</p>
                            </div>
                        </div>
                    </div>
                </section>

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