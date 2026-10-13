"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  Code2, 
  BookOpen, 
  Info, 
  Lightbulb, 
  Layers,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { MOBILE_COMPONENTS_CATALOG, ComponentDocumentation } from "../../lib/mobileComponentsCatalog";
import { ComponentType } from "../../types/mobileReport";

interface MobileComponentsDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialComponentType?: ComponentType;
}

export default function MobileComponentsDocsModal({
  isOpen,
  onClose,
  initialComponentType,
}: MobileComponentsDocsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [activeCompId, setActiveCompId] = useState<ComponentType>(
    initialComponentType || MOBILE_COMPONENTS_CATALOG[0].id
  );
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (initialComponentType) {
      setActiveCompId(initialComponentType);
    }
  }, [initialComponentType, isOpen]);

  if (!isOpen) return null;

  const categories = ["Todas", "Indicador / Métrica", "Tablas y Listas", "Gráficas", "Estructura y Texto"];

  const filteredCatalog = MOBILE_COMPONENTS_CATALOG.filter((comp) => {
    const matchesSearch =
      comp.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.expectedColumns.some((col) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "Todas" || comp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeDoc =
    MOBILE_COMPONENTS_CATALOG.find((c) => c.id === activeCompId) ||
    filteredCatalog[0] ||
    MOBILE_COMPONENTS_CATALOG[0];

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    toast.success("SQL copiado al portapapeles");
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera Superior */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Guía de Componentes y Contratos SQL</h2>
              <p className="text-xs text-slate-400">
                Especificación técnica oficial y nombres de columnas esperados para Mobile Reports (Storecheck Web v1.50)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o columna..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo Principal Dividido (Sidebar + Detalle) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Lista Lateral de Componentes */}
          <div className="w-64 border-r border-slate-200 bg-slate-50/50 overflow-y-auto p-2 space-y-1 shrink-0">
            {filteredCatalog.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 italic">No hay componentes que coincidan.</p>
            ) : (
              filteredCatalog.map((comp) => {
                const isSelected = activeDoc?.id === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => setActiveCompId(comp.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                      isSelected
                        ? "bg-white text-indigo-900 font-semibold shadow-xs border border-indigo-100"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{comp.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{comp.id}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{comp.category}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Área de Detalle del Componente Seleccionado */}
          {activeDoc && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              
              {/* Título y Badges */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
                      {activeDoc.label}
                    </h3>
                    <p className="text-xs font-mono text-indigo-600 mt-0.5">type: "{activeDoc.id}"</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {activeDoc.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {activeDoc.sqlExpectation}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {activeDoc.summary}
                </p>
              </div>

              {/* Columnas Esperadas */}
              {activeDoc.expectedColumns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" />
                    Columnas requeridas en la consulta SQL (Aliases)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="px-4 py-2.5 w-1/4">Alias en SELECT</th>
                          <th className="px-4 py-2.5 w-1/4">Tipo Dato</th>
                          <th className="px-4 py-2.5">Propósito en el Componente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeDoc.expectedColumns.map((col, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-mono text-indigo-700 font-semibold">
                              {col.name}
                              {col.optional && (
                                <span className="ml-1.5 text-[10px] font-sans font-normal text-slate-400">(opcional)</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 font-mono">{col.type}</td>
                            <td className="px-4 py-2.5 text-slate-700">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Query SQL de Ejemplo */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Code2 size={14} className="text-indigo-600" />
                    Ejemplo de Consulta SQL Funcional
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopySql(activeDoc.exampleSql)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 px-3 py-1 rounded-md transition-colors shadow-xs"
                  >
                    {copiedSql ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedSql ? "Copiado" : "Copiar SQL"}
                  </button>
                </div>
                <div className="bg-[#1e2230] rounded-xl p-4 overflow-x-auto border border-slate-800 shadow-sm">
                  <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                    <code>{activeDoc.exampleSql}</code>
                  </pre>
                </div>
              </div>

              {/* Tips & Consideraciones */}
              {activeDoc.tips && activeDoc.tips.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2">
                  <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-amber-600" />
                    Consideraciones y Reglas de la App Móvil
                  </h5>
                  <ul className="space-y-1.5 text-xs text-amber-900/90 pl-1">
                    {activeDoc.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-500">
            Tip: Al usar comodines de proyecto escribe <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">project&amp;projectId&amp;.tabla</code> (sin guion bajo).
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
}
