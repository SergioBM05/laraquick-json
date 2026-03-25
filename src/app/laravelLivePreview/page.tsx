"use client";

import { useState, useRef, useEffect } from "react";
import LaravelLivePreview from "@/components/LaravelLivePreview";
import Link from 'next/link';

export default function PreviewPage() {
  const [userInput, setUserInput] = useState("");
  const [className, setClassName] = useState("Album");
  const [isValid, setIsValid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const example = [{
      "cod": 1,
      "nom": "Paranoid",
      "dia": "1-09-1970",
      "cod_gru": 1,
      "companyia": { "nom": "Vertigo Records" },
      "canciones": [
        { "codi": 1, "nom": "War Pigs", "durada": "7:55" }
      ]
    }];
    setUserInput(JSON.stringify(example, null, 2));
  }, []);

  // --- LÓGICA DE DATOS ---
  const handleTableEdit = (index: number, key: string, newValue: string) => {
    try {
      const data = JSON.parse(userInput);
      const list = Array.isArray(data) ? data : [data];
      let finalValue: any = newValue;
      if (newValue.toLowerCase() === "true") finalValue = true;
      else if (newValue.toLowerCase() === "false") finalValue = false;
      else if (!isNaN(Number(newValue)) && newValue !== "") finalValue = Number(newValue);
      list[index][key] = finalValue;
      setUserInput(JSON.stringify(list, null, 2));
    } catch (e) { console.error("Edit error"); }
  };

  const handleDeleteRow = (index: number) => {
    try {
      const data = JSON.parse(userInput);
      if (!Array.isArray(data)) return;
      const newList = data.filter((_, i) => i !== index);
      setUserInput(JSON.stringify(newList, null, 2));
    } catch (e) { console.error("Delete error"); }
  };

  const handleAddRow = () => {
    try {
      const data = JSON.parse(userInput);
      const list = Array.isArray(data) ? data : [data];
      const newRow = JSON.parse(JSON.stringify(list[0])); // Clon profundo
      Object.keys(newRow).forEach(key => {
        if (typeof newRow[key] === 'string') newRow[key] = "New " + key;
        if (typeof newRow[key] === 'number') newRow[key] = 0;
      });
      setUserInput(JSON.stringify([...list, newRow], null, 2));
    } catch (e) { console.error("Add error"); }
  };

  const handleFormat = () => {
    try {
      const data = JSON.parse(userInput);
      setUserInput(JSON.stringify(data, null, 2));
      setIsValid(true);
    } catch (e) { setIsValid(false); }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest shadow-sm">LaraQuick: Online Developer Tools</div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">
            LIVE <span className="text-indigo-600">CRUD</span> PREVIEW
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">The Ultimate Laravel UI Prototyper</p>
        </div>

        {/* EDITOR & PREVIEW GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-28">
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setUserInput(ev.target?.result as string);
                  reader.readAsText(file);
                }
              }} />
              <button onClick={() => fileInputRef.current?.click()} className="w-full mb-6 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 transition-all">
                📥 Import JSON File
              </button>

              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Model Class Name</label>
                <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">JSON Editor</label>
                <button onClick={handleFormat} className="bg-indigo-600 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">Format JSON</button>
              </div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={`w-full h-96 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 font-mono text-[11px] outline-none transition focus:ring-2 ${isValid ? 'text-slate-600 dark:text-slate-300 focus:ring-indigo-500' : 'focus:ring-red-500'}`}
              />
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="sticky top-28">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Relational CRUD Mode Active
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 min-h-[400px]">
                <LaravelLivePreview
                  jsonData={userInput}
                  className={className}
                  onCellEdit={handleTableEdit}
                  onAddRow={handleAddRow}
                  onDeleteRow={handleDeleteRow}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- SEO CONTENT TARJETAS (RECUPERADO) --- */}
        <div className="mt-32 border-t border-slate-200 dark:border-slate-800 pt-20 max-w-4xl mx-auto pb-24">
          <section className="prose dark:prose-invert max-w-none text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-800 dark:text-white mb-10 italic">
              Level Up your Laravel 11 Workflow
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs mb-4 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                  Relation Resolver
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Automatically detects nested objects and displays their name or ID. No more [object Object] in your previews.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs mb-4 tracking-[0.2em] flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                  Blade & Tailwind UI
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Generates pixel-perfect tables using Tailwind CSS classes. Compatible with Laravel 11, Breeze and Jetstream.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-indigo-400">Advanced Laravel Scaffolding</h2>
              <p className="text-slate-400 text-sm mb-8 max-w-xl leading-relaxed">
                LaraQuick is the fastest bridge between raw JSON data and a functional Laravel application. Copy, paste, and deploy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest relative z-10 opacity-80">
                <span>✓ Instant Export</span>
                <span>✓ 100% Client-Side</span>
                <span>✓ Relation Support</span>
                <span>✓ Clean Eloquent</span>
              </div>
            </div>
          </section>
        </div>

        {/* --- FOOTER (RECUPERADO) --- */}
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