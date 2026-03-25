"use client";

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
    Background, Controls, applyEdgeChanges, applyNodeChanges,
    Node, Edge, Connection, addEdge, Handle, Position, MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Download, Zap, Settings2, Database, X, Upload, Trash2, Repeat } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ModelNode = ({ data, selected }: any) => {
    return (
        <div className={`bg-white dark:bg-slate-900 border-2 ${selected ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-2xl shadow-2xl w-64 overflow-hidden transition-all relative group`}>
            <button onClick={(e) => { e.stopPropagation(); data.onDelete(data.id); }} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg hover:bg-rose-600">
                <Trash2 size={12} />
            </button>

            <div className={`${selected ? 'bg-indigo-600' : 'bg-slate-800'} p-3 flex items-center justify-between text-white transition-colors`}>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <Database size={14} /> {data.label}
                </div>
            </div>

            <div className="p-3 space-y-1 bg-slate-50 dark:bg-slate-950/50 max-h-40 overflow-y-auto no-scrollbar">
                {data.fields.map((f: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-[9px] bg-white dark:bg-slate-800 p-1.5 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="font-bold text-slate-500">{f.name}</span>
                        <span className={`font-black uppercase text-[7px] px-1.5 py-0.5 rounded ${f.type === 'foreignId' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-400'}`}>{f.type}</span>
                    </div>
                ))}
            </div>

            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100 !bg-indigo-500" />
            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100 !bg-indigo-500" />
            <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100 !bg-indigo-500" />
            <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100 !bg-indigo-500" />
        </div>
    );
};

const nodeTypes = { modelNode: ModelNode };

export default function LaraQuickArchitect() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'migration' | 'model' | 'controller' | 'factory'>('migration');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        setSelectedNodeId(null);
    }, []);

    // --- GENERADORES DE CÓDIGO ---
    const generateMigration = (node: Node) => `<?php
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('${node.data.label.toLowerCase()}s', function (Blueprint $table) {
            ${node.data.fields.map((f: any) => `$table->${f.type === 'id' ? 'id()' : `${f.type}('${f.name}')`}${f.type === 'foreignId' ? '->constrained()' : ''};`).join('\n            ')}
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('${node.data.label.toLowerCase()}s');
    }
};`;

    const generateModel = (node: Node) => `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;

class ${node.data.label} extends Model {
    use HasFactory;

    protected $fillable = [
        ${node.data.fields.filter((f: any) => f.type !== 'id').map((f: any) => `'${f.name}'`).join(',\n        ')}
    ];
}`;

    const generateController = (node: Node) => `<?php
namespace App\\Http\\Controllers;

use App\\Models\\${node.data.label};
use Illuminate\\Http\\Request;

class ${node.data.label}Controller extends Controller {
    public function index() {
        return ${node.data.label}::all();
    }

    public function store(Request $request) {
        return ${node.data.label}::create($request->all());
    }

    public function show(${node.data.label} $model) {
        return $model;
    }
}`;

    const generateFactory = (node: Node) => `<?php
namespace Database\\Factories;

use Illuminate\\Database\\Eloquent\\Factories\\Factory;

class ${node.data.label}Factory extends Factory {
    public function definition(): array {
        return [
            ${node.data.fields.filter((f: any) => f.type !== 'id').map((f: any) => `'${f.name}' => fake()->word(),`).join('\n            ')}
        ];
    }
}`;

    const exportProject = async () => {
        const zip = new JSZip();
        
        // Estructura de carpetas Laravel
        const modelFolder = zip.folder("app/Models");
        const controllerFolder = zip.folder("app/Http/Controllers");
        const migrationFolder = zip.folder("database/migrations");
        const factoryFolder = zip.folder("database/factories");

        nodes.forEach((node, index) => {
            const name = node.data.label;
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').split('.')[0];
            
            modelFolder?.file(`${name}.php`, generateModel(node));
            controllerFolder?.file(`${name}Controller.php`, generateController(node));
            factoryFolder?.file(`${name}Factory.php`, generateFactory(node));
            migrationFolder?.file(`2024_01_01_${index.toString().padStart(6, '0')}_create_${name.toLowerCase()}s_table.php`, generateMigration(node));
        });

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "laravel_architecture_exported.zip");
    };

    const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
        }

        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode) {
            const fkToRemove = `${sourceNode.data.label.toLowerCase()}_id`;
            setNodes(nds => nds.map(node => {
                if (node.id === edge.target) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            fields: node.data.fields.filter((f: any) => f.name !== fkToRemove)
                        }
                    };
                }
                return node;
            }));
        }
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }, [nodes]);

    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        if (clickTimeout.current) return;

        clickTimeout.current = setTimeout(() => {
            const isManyToMany = edge.label === 'N:N';
            const newLabel = isManyToMany ? '1:N' : 'N:N';

            setEdges((eds) => eds.map((e) => {
                if (e.id === edge.id) {
                    return {
                        ...e,
                        label: newLabel,
                        animated: !isManyToMany,
                        style: { ...e.style, stroke: isManyToMany ? '#6366f1' : '#f59e0b' }
                    };
                }
                return e;
            }));

            if (newLabel === 'N:N') {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (source && target) {
                    const pivotName = [source.data.label, target.data.label].sort().join('_').toLowerCase();
                    const pivotId = `pivot_${Date.now()}`;
                    setNodes((nds) => [...nds, {
                        id: pivotId,
                        type: 'modelNode',
                        position: { x: (source.position.x + target.position.x) / 2, y: (source.position.y + target.position.y) / 2 + 150 },
                        data: {
                            label: pivotName,
                            fields: [
                                { name: 'id', type: 'id' },
                                { name: `${source.data.label.toLowerCase()}_id`, type: 'foreignId' },
                                { name: `${target.data.label.toLowerCase()}_id`, type: 'foreignId' }
                            ],
                            id: pivotId,
                            onDelete: deleteNode
                        }
                    }]);
                }
            }
            clickTimeout.current = null;
        }, 250);
    }, [nodes, deleteNode]);

    const onConnect = useCallback((params: Connection) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        if (sourceNode) {
            setNodes(nds => nds.map(node => {
                if (node.id === params.target) {
                    const fkName = `${sourceNode.data.label.toLowerCase()}_id`;
                    if (!node.data.fields.some((f: any) => f.name === fkName)) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                fields: [...node.data.fields, { name: fkName, type: 'foreignId' }]
                            }
                        };
                    }
                }
                return node;
            }));
        }

        setEdges((eds) => addEdge({
            ...params,
            type: 'step',
            animated: true,
            label: '1:N',
            labelStyle: { fontSize: '8px', fontWeight: 'bold', fill: '#6366f1' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            style: { stroke: '#6366f1', strokeWidth: 2 }
        }, eds));
    }, [nodes]);

    const handleSqlImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const tableRegex = /CREATE\s+TABLE\s+[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\);/gi;
            let match;
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            while ((match = tableRegex.exec(content)) !== null) {
                const tableName = match[1];
                const lines = match[2].split('\n');
                const fields: any[] = [];
                lines.forEach(line => {
                    const clean = line.trim().replace(/,$/, '');
                    if (!clean || clean.startsWith('PRIMARY') || clean.startsWith('KEY') || clean.startsWith('CONSTRAINT') || clean.startsWith('--')) return;

                    const parts = clean.split(/\s+/);
                    const colName = parts[0].replace(/[`"']/g, '').toLowerCase();
                    const colTypeRaw = parts[1]?.toLowerCase() || '';

                    let lType = 'string';
                    if (colName.includes('id') && (clean.toLowerCase().includes('primary key') || colName === 'id')) {
                        lType = 'id';
                    } else if (colName.includes('id_') || colName.endsWith('_id')) {
                        lType = 'foreignId';
                    } else if (colTypeRaw.includes('int')) lType = 'integer';
                    else if (colTypeRaw.includes('decimal') || colTypeRaw.includes('float')) lType = 'decimal';
                    else if (colTypeRaw.includes('text')) lType = 'text';
                    else if (colTypeRaw.includes('bool')) lType = 'boolean';
                    else if (colTypeRaw.includes('date')) lType = 'date';

                    fields.push({ name: colName, type: lType });
                });

                newNodes.push({
                    id: tableName,
                    type: 'modelNode',
                    position: { x: Math.random() * 500, y: Math.random() * 400 },
                    data: {
                        label: tableName,
                        fields,
                        id: tableName,
                        onDelete: deleteNode
                    }
                });
            }

            newNodes.forEach(targetNode => {
                targetNode.data.fields.forEach((field: any) => {
                    if (field.type === 'foreignId') {
                        const searchName = field.name.replace('id_', '').replace('_id', '');
                        const sourceNode = newNodes.find(n =>
                            n.id.toLowerCase() === searchName ||
                            n.id.toLowerCase() === searchName + 's' ||
                            n.id.toLowerCase() === searchName + 'es'
                        );

                        if (sourceNode && sourceNode.id !== targetNode.id) {
                            newEdges.push({
                                id: `e-${sourceNode.id}-${targetNode.id}`,
                                source: sourceNode.id,
                                target: targetNode.id,
                                type: 'step',
                                animated: true,
                                label: '1:N',
                                labelStyle: { fontSize: '8px', fontWeight: 'bold', fill: '#6366f1' },
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
                                style: { stroke: '#6366f1', strokeWidth: 2 }
                            });
                        }
                    }
                });
            });

            setNodes(newNodes);
            setEdges(newEdges);
        };
        reader.readAsText(file);
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    return (
        <main className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 z-30 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Zap className="text-indigo-600" fill="currentColor" size={20} />
                    <h1 className="text-xs font-black uppercase tracking-[0.2em]">LaraQuick <span className="text-indigo-600">Architect</span></h1>
                </div>
                <div className="flex gap-2">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleSqlImport} accept=".sql" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-all"><Upload size={14} /> Import SQL</button>
                    <button onClick={() => setNodes(nds => nds.concat({ id: `table_${Date.now()}`, type: 'modelNode', position: { x: 50, y: 50 }, data: { label: 'NewTable', fields: [{ name: 'id', type: 'id' }], id: `table_${Date.now()}`, onDelete: deleteNode } }))} className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"><Plus size={14} /> Add Model</button>
                    <button onClick={exportProject} className="px-3 py-2 bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg"><Download size={14} /> Export ZIP</button>
                    <button onClick={() => { setEdges([]); setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, fields: n.data.fields.filter((f: any) => f.type !== 'foreignId') } }))); }} className="px-3 py-2 text-rose-500 text-[10px] font-black uppercase hover:bg-rose-50 rounded-lg">Clear All Relations</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative">
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={(chs) => setNodes(nds => applyNodeChanges(chs, nds))}
                        onEdgesChange={(chs) => setEdges(eds => applyEdgeChanges(chs, eds))}
                        onConnect={onConnect}
                        onEdgeClick={onEdgeClick}
                        onEdgeDoubleClick={onEdgeDoubleClick}
                        onNodeClick={(_, n) => setSelectedNodeId(n.id)}
                        nodeTypes={nodeTypes} fitView
                    >
                        <Background color="#cbd5e1" gap={25} />
                        <Controls />
                    </ReactFlow>
                </div>

                <aside className="w-[450px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl shrink-0 overflow-hidden">
                    {selectedNode ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b dark:border-slate-800 space-y-4 shrink-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><Settings2 size={14} /> Editor</span>
                                    <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
                                </div>
                                <input
                                    value={selectedNode.data.label}
                                    onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 no-scrollbar">
                                    {selectedNode.data.fields.map((f: any, i: number) => (
                                        <div key={i} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700 group">
                                            <input
                                                value={f.name}
                                                onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, fields: n.data.fields.map((field: any, idx: number) => idx === i ? { ...field, name: e.target.value } : field) } } : n))}
                                                className="flex-1 bg-transparent text-[10px] font-bold outline-none"
                                            />
                                            <select
                                                value={f.type}
                                                onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, fields: n.data.fields.map((field: any, idx: number) => idx === i ? { ...field, type: e.target.value } : field) } } : n))}
                                                className="bg-white dark:bg-slate-700 text-[9px] font-black uppercase px-1 py-0.5 rounded outline-none"
                                            >
                                                <option value="id">ID</option>
                                                <option value="foreignId">FK</option>
                                                <option value="string">String</option>
                                                <option value="integer">Integer</option>
                                                <option value="decimal">Decimal</option>
                                                <option value="float">Float</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="text">Text</option>
                                                <option value="longText">LongText</option>
                                                <option value="date">Date</option>
                                                <option value="dateTime">DateTime</option>
                                                <option value="time">Time</option>
                                                <option value="json">JSON</option>
                                                <option value="enum">Enum</option>
                                            </select>
                                            <button onClick={() => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, fields: n.data.fields.filter((_: any, idx: number) => idx !== i) } } : n))} className="text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, fields: [...n.data.fields, { name: 'new_col', type: 'string' }] } } : n))} className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-all">+ Add Column</button>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
                                <div className="flex p-1 bg-slate-900 border-b border-slate-800 shrink-0">
                                    {['migration', 'model', 'controller', 'factory'].map((t) => (
                                        <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-md transition-all ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{t}</button>
                                    ))}
                                </div>
                                <div className="flex-1 p-6 overflow-auto font-mono text-[10px] leading-relaxed">
                                    <pre className="text-indigo-300 whitespace-pre-wrap">
                                        {activeTab === 'migration' && generateMigration(selectedNode)}
                                        {activeTab === 'model' && generateModel(selectedNode)}
                                        {activeTab === 'controller' && generateController(selectedNode)}
                                        {activeTab === 'factory' && generateFactory(selectedNode)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30 text-slate-500">
                            <Repeat size={48} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                Click simple: Change 1:N / N:N<br />
                                Double Click: Delete Relation & FK<br />
                                Select table to edit
                            </p>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}