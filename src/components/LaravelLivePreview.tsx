"use client";

interface Props {
  jsonData: string;
  className: string;
  onCellEdit: (index: number, key: string, newValue: string) => void;
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
}

export default function LaravelLivePreview({ jsonData, className, onCellEdit, onAddRow, onDeleteRow }: Props) {
  let displayData: any[] = [];
  
  try {
    const parsed = JSON.parse(jsonData);
    displayData = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return <div className="p-10 text-center text-red-400 text-xs font-bold uppercase tracking-widest italic">⚠️ Invalid JSON Structure</div>;
  }

  const columns = displayData.length > 0 ? Object.keys(displayData[0]).slice(0, 10) : [];

  const renderCellValue = (value: any, col: string, idx: number) => {
    if (Array.isArray(value)) return <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-black italic">📦 {value.length} items</span>;
    if (typeof value === 'object' && value !== null) return <span className="text-slate-700 font-bold text-sm">{value.nom || value.title || "Object"}</span>;
    
    return (
      <input
        type="text"
        defaultValue={value}
        onBlur={(e) => onCellEdit(idx, col, e.target.value)}
        className="w-full bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 focus:text-indigo-600 font-medium"
      />
    );
  };

  return (
    <div className="w-full font-sans">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Preview: <span className="text-indigo-600">{className}</span>
        </h2>
        <button 
          onClick={onAddRow}
          className="bg-indigo-600 text-white text-[9px] font-black px-4 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <span>+</span> ADD RECORD
        </button>
      </div>

      <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-50">
          <thead className="bg-slate-50/50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{col}</th>
              ))}
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4">{renderCellValue(row[col], col, idx)}</td>
                ))}
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onDeleteRow(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete row"
                  >
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}