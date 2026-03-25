"use client";

import { useState, useMemo, Fragment } from 'react';
import CodeEditor from '@/components/CodeEditor';
import {
    ShieldCheck, Plus, Copy, Lock, ChevronDown, ChevronUp,
    ShieldAlert, Zap, Trash2, Code2, ListTree, Download, FileJson, CheckCircle2, Terminal, X
} from 'lucide-react';
import JSZip from 'jszip';
import Link from 'next/link';


type Permission = string;

interface Role { id: string; name: string; }
interface Resource { id: string; name: string; }
interface AccessMap { [key: string]: boolean; }

export default function PermissionsVisualizer() {
    const [roles, setRoles] = useState<Role[]>([
        { id: 'r1', name: 'Admin' },
        { id: 'r2', name: 'Editor' }
    ]);

    const [resources, setResources] = useState<Resource[]>([
        { id: 'res1', name: 'Post' },
        { id: 'res2', name: 'User' }
    ]);

    const [permissions, setPermissions] = useState<Permission[]>([
        'viewAny', 'view', 'create', 'update', 'delete'
    ]);

    const [access, setAccess] = useState<AccessMap>({});
    const [activeTab, setActiveTab] = useState<'policy' | 'seeder'>('policy');
    const [selectedResource, setSelectedResource] = useState<string>('Post');
    const [seederFilter, setSeederFilter] = useState<string>('all');
    const [collapsedResources, setCollapsedResources] = useState<Record<string, boolean>>({});

    // --- LOGIC ---
    const toggleCollapse = (id: string) => setCollapsedResources(prev => ({ ...prev, [id]: !prev[id] }));

    const addRole = () => {
        const name = prompt("Role Name (e.g. Moderator)");
        if (name) setRoles([...roles, { id: `r-${Date.now()}`, name: name.trim() }]);
    };

    const removeRole = (id: string) => {
        if (confirm("Delete this role and all its permission mappings?")) {
            setRoles(roles.filter(r => r.id !== id));
        }
    };

    const addResource = () => {
        const name = prompt("Model Name (e.g. Category)");
        if (name) {
            const formatted = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
            setResources([...resources, { id: `res-${Date.now()}`, name: formatted }]);
            setSelectedResource(formatted);
        }
    };

    const removeResource = (id: string) => {
        if (confirm("Delete this model and all its policy settings?")) {
            setResources(resources.filter(r => r.id !== id));
        }
    };

    const addPermission = () => {
        const name = prompt("Action Name (e.g. publish, restore)");
        if (name && !permissions.includes(name)) {
            setPermissions([...permissions, name.trim()]);
        }
    };

    const removePermission = (perm: string) => {
        if (confirm(`Remove '${perm}' from all models?`)) {
            setPermissions(permissions.filter(p => p !== perm));
        }
    };

    const toggleAccess = (roleId: string, resId: string, perm: Permission) => {
        const key = `${roleId}-${resId}-${perm}`;
        setAccess(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- CODE GENERATION ---
    const generatePolicy = (resName: string, resId: string) => {
        let methods = "";
        permissions.forEach(perm => {
            const allowed = roles.filter(role => access[`${role.id}-${resId}-${perm}`]).map(r => `'${r.name.toLowerCase()}'`);
            methods += `    /**\n     * Determine if the user can ${perm} the model.\n     */\n    public function ${perm}(User $user): bool\n    {\n        return $user->hasAnyRole([${allowed.join(', ')}]);\n    }\n\n`;
        });
        return `<?php\n\nnamespace App\\Policies;\n\nuse App\\Models\\User;\nuse App\\Models\\${resName};\n\nclass ${resName}Policy\n{\n${methods}}`;
    };

    const generated = useMemo(() => {
        const res = resources.find(r => r.name === selectedResource);
        const policy = res ? generatePolicy(res.name, res.id) : "";

        let seederBody = "";
        const resList = seederFilter === 'all' ? resources : resources.filter(r => r.id === seederFilter);
        resList.forEach(r => {
            seederBody += `        // ${r.name} Permissions\n`;
            roles.forEach(role => {
                permissions.forEach(p => {
                    if (access[`${role.id}-${r.id}-${p}`])
                        seederBody += `        $${role.name.toLowerCase()}->givePermissionTo('${r.name.toLowerCase()}.${p}');\n`;
                });
            });
            seederBody += `\n`;
        });

        const seeder = `<?php\n\nnamespace Database\\Seeders;\n\nuse Illuminate\\Database\\Seeder;\nuse Spatie\\Permission\\Models\\Role;\n\nclass PermissionSeeder extends Seeder\n{\n    public function run(): void\n    {\n        app()[\\Spatie\\Permission\\PermissionRegistrar::class]->forgetCachedPermissions();\n\n${roles.map(r => `        $${r.name.toLowerCase()} = Role::firstOrCreate(['name' => '${r.name.toLowerCase()}']);`).join('\n')}\n\n${seederBody}    }\n}`;

        return { policy, seeder };
    }, [roles, resources, permissions, access, selectedResource, seederFilter]);

    const downloadZip = async () => {
        const zip = new JSZip();
        const folder = zip.folder("Policies");
        resources.forEach(r => folder?.file(`${r.name}Policy.php`, generatePolicy(r.name, r.id)));
        zip.file("PermissionSeeder.php", generated.seeder);
        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "laraquick-security-package.zip";
        link.click();
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto">

                {/* ENHANCED SEO HEADER */}
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">
                            <Zap size={12} fill="currentColor" /> Laravel 11 Security & RBAC Generator
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-4">
                            Policy <span className="text-indigo-600">& Permissions</span> Hub
                        </h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose">
                            Map Spatie Roles to Eloquent Policies visually. PSR-12 Compliant Boilerplate for <span className="text-slate-700 dark:text-slate-200 underline decoration-indigo-500">Professional Laravel Developers</span>.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <button onClick={addRole} className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-500 transition-all"><Plus size={14} className="inline mr-2" /> Role</button>
                        <button onClick={addResource} className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-500 transition-all"><Code2 size={14} className="inline mr-2" /> Model</button>
                        <button onClick={addPermission} className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-500 transition-all"><ShieldCheck size={14} className="inline mr-2" /> Permission</button>
                        <button onClick={downloadZip} className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"><Download size={16} /> ZIP</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* MATRIX SECTION */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b dark:border-slate-800">Action Matrix</th>
                                            {roles.map(role => (
                                                <th key={role.id} className="p-8 border-b dark:border-slate-800 text-center group min-w-[120px]">
                                                    <div className="text-[10px] font-black uppercase text-indigo-600 mb-2">{role.name}</div>
                                                    <button onClick={() => removeRole(role.id)} className="opacity-0 group-hover:opacity-100 transition-all text-rose-500 hover:scale-110 block mx-auto"><Trash2 size={14} /></button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resources.map(res => (
                                            <Fragment key={res.id}>
                                                <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 group/row">
                                                    <td colSpan={roles.length + 1} className="px-8 py-5 flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse(res.id)}>
                                                        <span className="text-[11px] font-black uppercase text-indigo-500 flex items-center gap-3 tracking-widest">
                                                            <Code2 size={16} /> MODEL: {res.name}
                                                        </span>
                                                        <div className="flex items-center gap-4">
                                                            <button onClick={(e) => { e.stopPropagation(); removeResource(res.id); }} className="opacity-0 group-hover/row:opacity-100 text-rose-500 p-1"><X size={16} /></button>
                                                            {collapsedResources[res.id] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {!collapsedResources[res.id] && permissions.map(perm => (
                                                    <tr key={`${res.id}-${perm}`} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group/perm">
                                                        <td className="px-10 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                                            {perm}
                                                            <button onClick={() => removePermission(perm)} className="opacity-0 group-hover/perm:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={12} /></button>
                                                        </td>
                                                        {roles.map(role => (
                                                            <td key={`${role.id}-${res.id}-${perm}`} className="p-2 text-center">
                                                                <button onClick={() => toggleAccess(role.id, res.id, perm)} className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center mx-auto ${access[`${role.id}-${res.id}-${perm}`] ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200'}`}>
                                                                    <Lock size={18} />
                                                                </button>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* CODE EDITOR SECTION */}
                    <div className="lg:col-span-5">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[850px]">
                            <div className="flex bg-slate-50 dark:bg-slate-800/50 p-3 gap-2">
                                <button onClick={() => setActiveTab('policy')} className={`flex-1 py-5 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === 'policy' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Policy.php</button>
                                <button onClick={() => setActiveTab('seeder')} className={`flex-1 py-5 text-[10px] font-black uppercase rounded-2xl transition-all ${activeTab === 'seeder' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Seeder.php</button>
                            </div>
                            <div className="p-8 border-b dark:border-slate-800">
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-[0.2em] flex items-center gap-2"><ListTree size={14} /> Live Export Configuration:</label>
                                <select value={activeTab === 'policy' ? selectedResource : seederFilter} onChange={(e) => activeTab === 'policy' ? setSelectedResource(e.target.value) : setSeederFilter(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-sm font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                                    {activeTab === 'policy' ? resources.map(r => <option key={r.id} value={r.name}>{r.name}Policy.php</option>) : <><option value="all">FULL PROJECT SEEDER</option>{resources.map(r => <option key={r.id} value={r.id}>MODEL: {r.name}</option>)}</>}
                                </select>
                            </div>
                            <div className="relative flex-1 bg-slate-900">
                                <CodeEditor value={activeTab === 'policy' ? generated.policy : generated.seeder} onChange={() => { }} language="php" readOnly />
                                <button onClick={() => { navigator.clipboard.writeText(activeTab === 'policy' ? generated.policy : generated.seeder); alert("Code Copied!"); }} className="absolute bottom-10 right-10 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3">
                                    <Copy size={18} /> Copy Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DEEP SEO SECTION --- */}
                <section className="mt-32 border-t border-slate-200 dark:border-slate-800 pt-20 pb-40">
                    <div className="grid md:grid-cols-12 gap-16">
                        <div className="md:col-span-8 space-y-12">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                    <Terminal className="text-indigo-600" /> Enterprise-Grade Laravel Authorization
                                </h3>
                                <p className="text-slate-500 leading-relaxed mb-6">
                                    Managing complex <strong>RBAC (Role-Based Access Control)</strong> should not be a manual task. LaraQuick's <strong>Laravel Policy Builder</strong> provides a visual hub for security auditing. Whether you are using <strong>Spatie Permission</strong> or Laravel's native Gates, this tool generates <strong>PSR-12 compliant code</strong> to protect your Eloquent models.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest flex items-center gap-2"><ShieldCheck size={16} /> Scalable Policies</h4>
                                        <ul className="text-xs space-y-3 text-slate-500">
                                            <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> One-click ZIP export for <strong>multiple Policies</strong>.</li>
                                            <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Custom permissions like <code>publish</code> or <code>archive</code>.</li>
                                            <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Clean dependency injection for <code>App\Models\User</code>.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest flex items-center gap-2"><FileJson size={16} /> Data Seeding</h4>
                                        <ul className="text-xs space-y-3 text-slate-500">
                                            <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Automated <strong>PermissionSeeder</strong> generation.</li>
                                            <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <code>firstOrCreate</code> logic to prevent DB duplicates.</li>
                                            <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Spatie-ready <code>givePermissionTo()</code> syntax.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                                    <ShieldAlert className="text-amber-500" /> Advanced Security Auditing
                                </h3>
                                <p className="text-xs text-slate-400 leading-loose mb-6">
                                    Security leaks often happen when developers forget to register a policy or a gate. By visualizing your <strong>Security Matrix</strong>, you ensure that every resource (Post, User, Invoice) has the correct <code>viewAny</code>, <code>create</code>, and <code>delete</code> guards.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {['Laravel Authorization', 'Spatie Permission Tool', 'RBAC Visualizer', 'PHP Code Generator', 'Security Boilerplate', 'Laravel 11 Security'].map(tag => (
                                        <span key={tag} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <aside className="md:col-span-4 space-y-8">
                            <div className="p-10 bg-indigo-600 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/30">
                                <h4 className="font-black uppercase text-xs tracking-widest mb-6 border-b border-white/20 pb-4">Implementation Guide</h4>
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-black uppercase opacity-60 mb-2">Step 1: Download</div>
                                        <p className="text-xs font-bold leading-relaxed">Download the ZIP and paste the Policies into your <code>app/Policies</code> directory.</p>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase opacity-60 mb-2">Step 2: Run Seeder</div>
                                        <p className="text-xs font-bold leading-relaxed">Execute <code>php artisan db:seed</code> to sync roles and permissions.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-amber-50 dark:bg-amber-900/10 rounded-[3rem] border-2 border-dashed border-amber-200 dark:border-amber-900/20">
                                <h4 className="font-black uppercase text-[10px] tracking-[0.2em] mb-4 text-amber-700 dark:text-amber-500">Security Note</h4>
                                <p className="text-[11px] text-amber-800/70 dark:text-amber-300/60 leading-relaxed font-medium">
                                    This generator uses <code>hasAnyRole</code>. Ensure your <code>User</code> model uses the Spatie <code>HasRoles</code> trait for these policies to work out of the box.
                                </p>
                            </div>
                        </aside>
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