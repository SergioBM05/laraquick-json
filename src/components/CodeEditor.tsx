"use client";
import dynamic from 'next/dynamic';
import type { EditorProps } from '@monaco-editor/react'; // Importamos solo el tipo

// Aquí le decimos explícitamente a Next.js que este componente tiene las props de Monaco
const Editor = dynamic<EditorProps>(
  () => import('@monaco-editor/react').then((mod) => mod.Editor), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full bg-slate-900 flex items-center justify-center text-slate-400">
        Cargando editor...
      </div>
    )
  }
);

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, language = "json", readOnly = false }: CodeEditorProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-300 shadow-inner min-h-[300px]">
      <Editor
        height="300px"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          formatOnPaste: true,
          readOnly: readOnly,
          domReadOnly: readOnly,
        }}
      />
    </div>
  );
}