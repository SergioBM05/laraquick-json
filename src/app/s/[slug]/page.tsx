"use client";

import { useEffect, useState, use } from 'react'; 
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import { jsonToLaravelMigration, jsonToLaravelModel, jsonToLaravelFactory } from '@/utils/converter';



export default function SharedSchemaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params); 
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('migration');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${API_URL}/schemas/${slug}`);
                if (!res.ok) throw new Error("Not found");
                const result = await res.json();
                const cleanContent = typeof result.content === 'string'
                    ? JSON.parse(result.content)
                    : result.content;

                setData({ ...result, content: cleanContent });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchData();
    }, [slug]);

    const className = data?.table_name 
        ? data.table_name.charAt(0).toUpperCase() + data.table_name.slice(1).replace(/s$/, '') 
        : 'Schema';

    const getGeneratedCode = () => {
        if (!data) return "";
        const jsonStr = JSON.stringify(data.content);
        switch (activeTab) {
            case 'model': return jsonToLaravelModel(jsonStr, className);
            case 'factory': return jsonToLaravelFactory(jsonStr, className);
            default: return jsonToLaravelMigration(jsonStr, data.table_name);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getGeneratedCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading schema...</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-slate-400">
            <h2 className="text-2xl font-black mb-4 uppercase text-slate-600">Schema not found</h2>
            <Link href="/" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                Back to Home
            </Link>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-20 text-slate-900">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <Link href="/" className="group flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                        <span className="transition-transform group-hover:-translate-x-1">&larr;</span> 
                        Create your own schema
                    </Link>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-200 px-2 py-1 rounded">
                        ID: {slug}
                    </div>
                </div>

                <header className="mb-10 text-center md:text-left">
                    {/* TÍTULO DINÁMICO SEGÚN EL TAB */}
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight capitalize">
                        {activeTab} for: <span className="text-indigo-600 uppercase">{data.table_name}</span>
                    </h1>
                    <p className="text-slate-500 mt-3 font-medium">
                        Automatically generated {activeTab} with <strong className="text-slate-700">LaraQuick JSON</strong>. 
                        Ready to use in your Laravel project.
                    </p>
                </header>

                <div className="flex gap-1 mb-0 px-2">
                    {['migration', 'model', 'factory'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-t-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative group bg-white rounded-3xl rounded-tl-none border border-slate-200 shadow-2xl overflow-hidden transition-all hover:border-indigo-300">
                    <div className="bg-slate-900 p-3 flex justify-between items-center px-6 border-b border-slate-800">
                        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">
                            {activeTab === 'migration' && `database/migrations/create_${data.table_name}_table.php`}
                            {activeTab === 'model' && `app/Models/${className}.php`}
                            {activeTab === 'factory' && `database/factories/${className}Factory.php`}
                        </p>
                    </div>
                    
                    <div className="relative">
                        <CodeEditor value={getGeneratedCode()} onChange={() => { }} language="php" readOnly={true} />
                        
                        <button
                            onClick={handleCopy}
                            className={`absolute top-6 right-6 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl active:scale-95
                                ${copied 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-1'
                                }`}
                        >
                            {copied ? 'Copied! ✓' : 'Copy Code'}
                        </button>
                    </div>
                </div>

                {/* RESTO DEL CONTENIDO TRADUCIDO */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                        <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4 italic">Source JSON:</h2>
                        <div className="bg-slate-50 p-4 rounded-xl font-mono text-[11px] text-slate-600 overflow-auto max-h-[300px] border border-slate-100">
                            <pre>{JSON.stringify(data.content, null, 2)}</pre>
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-3xl text-white shadow-xl flex flex-col justify-center min-h-[200px]">
                        <h3 className="text-2xl font-black mb-2">Build faster?</h3>
                        <p className="text-indigo-100 text-sm font-medium mb-6">
                            Paste your JSON and get all Laravel components instantly.
                        </p>
                        <Link href="/" className="w-full py-3 bg-white text-indigo-600 text-center rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition">
                            Try LaraQuick Now
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}