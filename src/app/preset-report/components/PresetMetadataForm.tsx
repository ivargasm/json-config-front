"use client";
import { usePresetReportStore } from "../../store/presetReportStore";
import { DATASET_TYPES, AVAILABLE_VARIABLES } from "../../lib/presetConstants";

export default function PresetMetadataForm() {
  const store = usePresetReportStore();

  return (
    <div className="p-5 space-y-8">
      {/* Naming Section */}
      <section>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">1. Identificadores</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Reporte</label>
            <input 
              value={store.reportName} onChange={e => store.setField("reportName", e.target.value)}
              placeholder="Ej: exhibition" className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Proyecto</label>
            <input 
              value={store.projectName} onChange={e => store.setField("projectName", e.target.value)}
              placeholder="Ej: soriana" className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">JSON Type</label>
              <select value={store.jsonType} onChange={e => store.setField("jsonType", e.target.value as any)} className="w-full border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none">
                <option value="normal">normal</option>
                <option value="groupBy">groupBy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Config Type</label>
              <select value={store.configType} onChange={e => store.setField("configType", e.target.value as any)} className="w-full border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none">
                <option value="preset">preset</option>
                <option value="adhoc">adhoc</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Section */}
      <section>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">2. Tipo de Dataset</h4>
        <select 
          value={store.selectedDatasetType} 
          onChange={e => store.setField("selectedDatasetType", Number(e.target.value))}
          className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
        >
          {DATASET_TYPES.map(type => (
            <option key={type.id} value={type.id}>{type.dsci18n.split('.').pop()?.replace(/^\w/, c => c.toUpperCase())} ({type.id})</option>
          ))}
        </select>
      </section>

      {/* Variables Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">3. Variables Inyectadas</h4>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">{Object.keys(store.selectedVariables).length} activas</span>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
          {AVAILABLE_VARIABLES.map(variable => {
            const isActive = store.selectedVariables[variable.var] !== undefined;
            const alias = store.selectedVariables[variable.var] || '';

            return (
              <div key={variable.var} className={`border rounded-lg p-3 transition-colors ${isActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={isActive} onChange={() => store.toggleVariable(variable.var)} className="mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700 font-mono">&{variable.var}&</p>
                    {isActive && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500">Alias SQL:</span>
                        <input 
                          value={alias}
                          onChange={e => store.setVariableAlias(variable.var, e.target.value)}
                          placeholder="Ej: v"
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}