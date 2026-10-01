"use client";
import { usePresetReportStore } from "../../store/presetReportStore";
import { Trash2 } from "lucide-react";

export default function PresetColumnsMapper() {
  const store = usePresetReportStore();

  const dataTypes = ['varchar', 'numeric', 'int', 'date', 'timestamp', 'boolean'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900 text-base">Mapeo de Columnas ({store.columns.length})</h3>
        <button onClick={() => store.setColumns([])} className="text-rose-500 hover:text-rose-700 text-sm font-medium">Limpiar Todo</button>
      </div>
      <div className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Columna (SQL)</th>
              <th className="px-6 py-3 font-semibold">Tipo de Dato</th>
              <th className="px-6 py-3 font-semibold w-1/3">Nombre Mostrar (i18n)</th>
              {store.jsonType === 'groupBy' && (
                <>
                  <th className="px-6 py-3 font-semibold">Agrupación</th>
                  <th className="px-6 py-3 font-semibold">Alias</th>
                </>
              )}
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {store.columns.map((col, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-indigo-700 font-semibold">{col.originalName}</td>
                <td className="px-6 py-3">
                  <select 
                    value={col.dataType} 
                    onChange={e => store.updateColumn(idx, { dataType: e.target.value })}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {dataTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-6 py-3">
                  <input 
                    value={col.customMessage} 
                    onChange={e => store.updateColumn(idx, { customMessage: e.target.value })}
                    placeholder={col.originalName}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </td>
                {store.jsonType === 'groupBy' && (
                  <>
                    <td className="px-6 py-3">
                      <select 
                        value={col.agg || ""} 
                        onChange={e => store.updateColumn(idx, { agg: e.target.value })}
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="">Ninguno</option>
                        <option value="SUM">SUM</option>
                        <option value="COUNT">COUNT</option>
                        <option value="MAX">MAX</option>
                        <option value="MIN">MIN</option>
                        <option value="AVG">AVG</option>
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        value={col.alias || ""} 
                        onChange={e => store.updateColumn(idx, { alias: e.target.value })}
                        placeholder="Alias"
                        className="w-20 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none"
                      />
                    </td>
                  </>
                )}
                <td className="px-6 py-3 text-right">
                  <button onClick={() => store.setColumns(store.columns.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50">
                    <Trash2 size={16} />
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