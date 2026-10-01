"use client";

import { useState } from "react";
import { useMobileReportStore } from "../../store/mobileReportStore";
import { X, Type, Table, PieChart, Activity, AlignLeft, Layers, GitMerge, List, Layout, MessageSquare, Maximize } from "lucide-react";
import { ReportComponent, ComponentType } from "../../types/mobileReport";

interface AddComponentModalProps {
  onClose: () => void;
}

const COMPONENT_TYPES: {id: ComponentType, label: string, icon: any}[] = [
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
  { id: "tab_group", label: "Pestañas (Tabs)", icon: Layout }
];

export default function AddComponentModal({ onClose }: AddComponentModalProps) {
  const { addComponent } = useMobileReportStore();
  const [compId, setCompId] = useState("");
  const [compType, setCompType] = useState<ComponentType>("resume");
  const [compTitle, setCompTitle] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compId.trim()) return;

    const newComponent: ReportComponent = {
      id: compId.trim(),
      type: compType,
      title: compTitle || undefined,
      schema: "project",
      datasource: "SELECT 1 AS value",
    };
    
    // Clean up empty titles for containers
    if (!compTitle && (compType === "grid_group" || compType === "tab_group")) {
        delete newComponent.title;
        delete newComponent.datasource;
        delete newComponent.schema;
    }

    addComponent(newComponent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-900 text-lg">Añadir Componente</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleAdd} className="p-6 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Component ID <span className="text-rose-500">*</span></label>
              <input 
                required
                value={compId}
                onChange={e => setCompId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="Ej: ventas_mensuales"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-indigo-600 outline-none font-mono text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1">Identificador único (sin espacios).</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Título Visual (Opcional)</label>
              <input 
                value={compTitle}
                onChange={e => setCompTitle(e.target.value)}
                placeholder="Ej: Ventas del Mes"
                className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-indigo-600 outline-none text-sm"
              />
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col">
            <label className="block text-sm font-semibold text-slate-900 mb-3">Tipo de Componente <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-2" style={{maxHeight: "300px"}}>
              {COMPONENT_TYPES.map(ct => {
                const Icon = ct.icon;
                const isSelected = compType === ct.id;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setCompType(ct.id)}
                    className={"flex flex-col items-start p-3 border rounded-lg text-left transition-colors " + (isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300")}
                  >
                    <Icon size={18} className={"mb-2 " + (isSelected ? "text-indigo-600" : "text-slate-500")} />
                    <span className={"text-xs font-semibold leading-tight " + (isSelected ? "text-indigo-900" : "text-slate-700")}>{ct.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </form>
        
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200">
            Cancelar
          </button>
          <button onClick={handleAdd} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">
            Crear Componente
          </button>
        </div>

      </div>
    </div>
  );
}
