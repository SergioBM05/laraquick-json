"use client";

import { useEffect, useState, use } from 'react'; // <--- Importamos 'use'
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import { jsonToLaravelMigration } from '@/utils/converter';

export default function SharedSchemaPage({ params }: { params: Promise<{ slug: string }> }) {
    // 1. Desempaquetamos los params usando el nuevo hook 'use'
    const { slug } = use(params); 
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                // Usamos el slug ya desempaquetado
                const res = await fetch(`${API_URL}/schemas/${slug}`);
                
                if (!res.ok) throw new Error("No encontrado");
                
                const result = await res.json();

                const cleanContent = typeof result.content === 'string'
                    ? JSON.parse(result.content)
                    : result.content;

                setData({
                    ...result,
                    content: cleanContent
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchData();
    }, [slug]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Cargando esquema...</div>;
    if (!data) return <div className="min-h-screen flex flex-col items-center justify-center font-bold text-slate-400">Esquema no encontrado <Link href="/" className="text-indigo-600 underline">Volver</Link></div>;

    const migration = jsonToLaravelMigration(JSON.stringify(data.content), data.table_name);

    return (
        <main className="min-h-screen bg-gray-50 p-8 md:p-20">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-8 inline-block">&larr; Crea tu propio esquema</Link>

                <header className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900">Laravel Migration for: <span className="text-indigo-600 underline uppercase">{data.table_name}</span></h1>
                    <p className="text-slate-500 mt-2">Este esquema fue compartido públicamente a través de LaraQuick JSON.</p>
                </header>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="bg-slate-900 p-2">
                        <p className="text-slate-500 text-[10px] font-mono px-4">database/migrations/shared_schema.php</p>
                    </div>
                    <CodeEditor value={migration} onChange={() => { }} language="php" readOnly={true} />
                </div>

                <div className="mt-12 p-8 bg-white border border-slate-200 rounded-3xl">
                    <h2 className="font-bold text-lg mb-4 italic">Estructura JSON original:</h2>
                    <div className="bg-slate-50 p-4 rounded-xl font-mono text-xs text-slate-600 overflow-auto">
                        <pre>{JSON.stringify(data.content, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </main>
    );
}