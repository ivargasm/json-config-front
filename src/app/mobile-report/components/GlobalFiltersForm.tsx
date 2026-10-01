"use client";

import { useState } from "react";
import { useMobileReportStore } from "../../store/mobileReportStore";
import { Trash2, Plus, Code2, Database, Settings } from "lucide-react";

const STANDARD_FILTERS = [
  { id: "roles", label: "Roles", desc: "Puestos dentro del alcance" },
  { id: "places", label: "Places", desc: "Tiendas (depende de roles)" },
  { id: "categories", label: "Categories", desc: "Categorías" },
  { id: "subcategories", label: "Subcategories", desc: "Subcategorías" },
  { id: "products", label: "Products", desc: "Productos" },
  { id: "week_periods", label: "Week Periods", desc: "Período semanal" },
  { id: "month_periods", label: "Month Periods", desc: "Mes y Año" },
  { id: "status", label: "Status", desc: "Estado: pendiente/válido/rechazado" },
  { id: "range_dates", label: "Range Dates", desc: "Rango de fechas" }
];

export default function GlobalFiltersForm() {
  const { 
    filters, 
    addFilter, 
    removeFilter, 
    generic_filters, 
    updateGenericFilter, 
    removeGenericFilter,
    filters_properties,
    updateDefaultValue
  } = useMobileReportStore();
  
  const [newGenericId, setNewGenericId] = useState("");

  const handleToggle = (id: string) => {
    if (filters.includes(id)) {
      removeFilter(id);
    } else {
      addFilter(id);
    }
  };

  const handleAddGeneric = () => {
    if (!newGenericId.trim()) return;
    updateGenericFilter({
      selectId: newGenericId.trim(),
      schema: "project",
      datasource: "SELECT 1 AS id, 'Texto' AS descripcion",
      count_datasource: "SELECT 1"
    });
    setNewGenericId("");
  };

  // Combine active standard filters and generic filters to show in the properties section
  const activeFilterIds = Array.from(new Set([
    ...filters,
    ...generic_filters.map(g => g.selectId)
  ]));

  return (
    <div className="space-y-10">
      {/* Standard Filters */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">1. Filtros Estándar</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD_FILTERS.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white shadow-sm hover:border-indigo-200 transition-colors">
              <div className="mt-0.5">
                <button
                  onClick={() => handleToggle(f.id)}
                  className={"relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 " + (filters.includes(f.id) ? "bg-indigo-600" : "bg-slate-200")}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={"pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (filters.includes(f.id) ? "translate-x-4" : "translate-x-0")}
                  />
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.label}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generic Filters */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">2. Filtros Genéricos (Personalizados)</h4>
        
        {/* Add Generic Filter */}
        <div className="flex gap-2 mb-6">
          <input 
            value={newGenericId}
            onChange={e => setNewGenericId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            placeholder="Ej: custom_products" 
            className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
          />
          <button 
            onClick={handleAddGeneric}
            className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Agregar Filtro
          </button>
        </div>

        {/* List of Generic Filters */}
        <div className="space-y-6">
          {generic_filters.map((gf) => (
            <div key={gf.selectId} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-mono text-sm font-semibold text-indigo-700">{gf.selectId}</span>
                <button 
                  onClick={() => removeGenericFilter(gf.selectId)}
                  className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Database size={12}/> Schema</label>
                  <select 
                    value={gf.schema}
                    onChange={e => updateGenericFilter({...gf, schema: e.target.value as any})}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="project">project</option>
                    <option value="stoiii">stoiii</option>
                    <option value="stoiii_config">stoiii_config</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Code2 size={12}/> Datasource (Opciones)</label>
                  <textarea 
                    value={gf.datasource}
                    onChange={e => updateGenericFilter({...gf, datasource: e.target.value})}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-sm p-3 rounded-md h-24 focus:outline-none resize-none"
                    spellCheck="false"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Code2 size={12}/> Count Datasource</label>
                  <textarea 
                    value={gf.count_datasource}
                    onChange={e => updateGenericFilter({...gf, count_datasource: e.target.value})}
                    className="w-full bg-slate-900 text-indigo-300 font-mono text-sm p-3 rounded-md h-16 focus:outline-none resize-none"
                    spellCheck="false"
                  />
                </div>
              </div>
            </div>
          ))}
          {generic_filters.length === 0 && (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              No has configurado ningún filtro genérico.
            </div>
          )}
        </div>
      </div>

      {/* Filter Properties / Default Values */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Settings size={16} className="text-indigo-600" /> 3. Valores por defecto (Filter Properties)</h4>
        
        {activeFilterIds.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
            Activa al menos un filtro para configurar sus valores por defecto.
          </div>
        ) : (
          <div className="space-y-4">
            {activeFilterIds.map(id => {
              const prop = filters_properties[id]?.default_value || { value: "", description: "" };
              
              return (
                <div key={id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                  <h5 className="font-mono text-sm font-semibold text-slate-800 mb-3">{id}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor por defecto</label>
                      <input 
                        value={prop.value}
                        onChange={e => updateDefaultValue(id, { ...prop, value: e.target.value })}
                        placeholder="Ej: -1"
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                      <input 
                        value={prop.description}
                        onChange={e => updateDefaultValue(id, { ...prop, description: e.target.value })}
                        placeholder="Ej: Todos los registros"
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
