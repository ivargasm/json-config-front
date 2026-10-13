"use client";

import { useState } from "react";
import { useMobileReportStore } from "../../store/mobileReportStore";
import { 
  X, 
  Type, 
  Table, 
  PieChart, 
  Activity, 
  AlignLeft, 
  Layers, 
  GitMerge, 
  List, 
  Layout, 
  MessageSquare, 
  Copy, 
  Check, 
  Code2, 
  BookOpen, 
  Lightbulb 
} from "lucide-react";
import { toast } from "sonner";
import { ReportComponent, ComponentType } from "../../types/mobileReport";
import { getComponentDoc, ComponentDocumentation } from "../../lib/mobileComponentsCatalog";

interface AddComponentModalProps {
  onClose: () => void;
  onOpenDocs?: (type?: ComponentType) => void;
}

const COMPONENT_TYPES: { id: ComponentType; label: string; icon: any }[] = [
  { id: "resume", label: "Resumen (Indicadores)", icon: AlignLeft },
  { id: "table", label: "Tabla / Tarjetas", icon: Table },
  { id: "basic_card", label: "Tarjeta Básica", icon: Type },
  { id: "progress_bar", label: "Barra de Progreso", icon: Activity },
  { id: "progress_circle", label: "Círculo de Progreso", icon: Activity },
  { id: "metric_section", label: "Sección de Métricas", icon: Layers },
  { id: "graph_bar", label: "Gráfica de Barras", icon: PieChart },
  { id: "graph_line", label: "Gráfica de Línea", icon: PieChart },
  { id: "graph_pie", label: "Gráfica de Pastel", icon: PieChart },
  { id: "graph_doughnut", label: "Gráfica Doughnut", icon: PieChart },
  { id: "grouped_list", label: "Lista Agrupada", icon: List },
  { id: "card_carousel", label: "Carrusel", icon: Layout },
  { id: "history_list", label: "Historial", icon: List },
  { id: "notice", label: "Aviso (Notice)", icon: MessageSquare },
  { id: "report_title", label: "Título del Reporte", icon: Type },
  { id: "section_header", label: "Encabezado de Sección", icon: Type },
  { id: "grid_group", label: "Cuadrícula (Grid)", icon: Layout },
  { id: "tab_group", label: "Pestañas (Tabs)", icon: Layout },
];

export default function AddComponentModal({ onClose, onOpenDocs }: AddComponentModalProps) {
  const { addComponent } = useMobileReportStore();
  const [compId, setCompId] = useState("");
  const [compType, setCompType] = useState<ComponentType>("resume");
  const [compTitle, setCompTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedDoc: ComponentDocumentation | undefined = getComponentDoc(compType);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success("SQL copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compId.trim()) return;

    const newComponent: ReportComponent = {
      id: compId.trim(),
      type: compType,
      title: compTitle || undefined,
      schema: "project",
      datasource: selectedDoc ? selectedDoc.exampleSql : "SELECT 1 AS value",
    };

    // Si es un contenedor estructural sin título ni SQL
    if (!compTitle && (compType === "grid_group" || compType === "tab_group")) {
      delete newComponent.title;
      delete newComponent.datasource;
      delete newComponent.schema;
    }

    addComponent(newComponent);
    toast.success(`Componente "${compId.trim()}" agregado`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex justify-center items-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Añadir Componente al Reporte</h3>
            <p className="text-xs text-slate-500">Selecciona el tipo de componente visual e identifica los nombres de columnas requeridos.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleAdd} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto flex-1">
          
          {/* Columna Izquierda: Identificador + Título + Especificación en Vivo */}
          <div className="w-full md:w-1/2 space-y-4 flex flex-col">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Component ID <span className="text-rose-500">*</span>
              </label>
              <input
                required
                value={compId}
                onChange={(e) => setCompId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="Ej: ventas_mensuales"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Identificador único (sin espacios ni acentos).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Título Visual (Opcional)
              </label>
              <input
                value={compTitle}
                onChange={(e) => setCompTitle(e.target.value)}
                placeholder="Ej: Ventas del Mes"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-indigo-600 outline-none text-sm"
              />
            </div>

            {/* Tarjeta de Especificación en Vivo del Componente Seleccionado */}
            {selectedDoc && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{selectedDoc.label}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">
                        {selectedDoc.category}
                      </span>
                    </div>
                    {onOpenDocs && (
                      <button
                        type="button"
                        onClick={() => onOpenDocs(compType)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        <BookOpen size={12} /> Guía completa
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {selectedDoc.summary}
                  </p>

                  {/* Columnas esperadas */}
                  {selectedDoc.expectedColumns.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Columnas requeridas en el SELECT:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedDoc.expectedColumns.map((col, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono bg-white border border-slate-200 text-indigo-700 px-1.5 py-0.5 rounded shadow-2xs"
                            title={`${col.type}: ${col.description}`}
                          >
                            {col.name}
                            {col.optional ? " (opc)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SQL de Ejemplo */}
                <div className="space-y-1 pt-2 border-t border-slate-200/70">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Code2 size={11} className="text-indigo-600" /> Query SQL sugerido:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySql(selectedDoc.exampleSql)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs hover:bg-indigo-50 transition-colors"
                    >
                      {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      {copied ? "Copiado" : "Copiar SQL"}
                    </button>
                  </div>
                  <div className="bg-[#1e2230] rounded-lg p-2.5 max-h-28 overflow-y-auto border border-slate-800">
                    <pre className="font-mono text-[10px] text-emerald-400 whitespace-pre-wrap leading-relaxed">
                      <code>{selectedDoc.exampleSql}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Selector de Tipos de Componentes */}
          <div className="w-full md:w-1/2 flex flex-col">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Componente <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1" style={{ maxHeight: "390px" }}>
              {COMPONENT_TYPES.map((ct) => {
                const Icon = ct.icon;
                const isSelected = compType === ct.id;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setCompType(ct.id)}
                    className={
                      "flex flex-col items-start p-3 border rounded-xl text-left transition-all " +
                      (isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50")
                    }
                  >
                    <Icon size={18} className={"mb-1.5 " + (isSelected ? "text-indigo-600" : "text-slate-400")} />
                    <span className={"text-xs font-semibold leading-tight " + (isSelected ? "text-indigo-900" : "text-slate-800")}>
                      {ct.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{ct.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <p className="text-[11px] text-slate-500">
            El componente se creará con el SQL de ejemplo inyectado listo para personalizar.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Crear Componente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
