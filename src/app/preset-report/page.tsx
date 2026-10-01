"use client";

import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoutes";
import TopNavbar from "../components/TopNavbar";
import { usePresetReportStore } from "../store/presetReportStore";
import { Database, Code2, Play, LayoutList, Zap, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { parsePredefinedColumns } from "../lib/api";
import PresetMetadataForm from "./components/PresetMetadataForm";
import PresetColumnsMapper from "./components/PresetColumnsMapper";
import PresetOutputsDrawer from "./components/PresetOutputsDrawer";

export default function PresetReportBuilder() {
  const store = usePresetReportStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAnalyzeSql = async () => {
    if (!store.mainSql) {
      toast.error("El query está vacío");
      return;
    }
    setIsAnalyzing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      // We pass 'preset' as type so it doesn't nest like 'resume'
      const data = await parsePredefinedColumns(API_URL, store.mainSql, store.jsonType); 
      
      if (data && data.columns) {
        // Map backend output to PresetColumn interface
        const parsed = data.columns.map((c: any) => ({
          originalName: c.originalName,
          name: `predefined.dataset.column.${store.reportName || 'report'}.${store.configType}.${store.projectName || 'project'}.${c.originalName}`,
          dataType: 'varchar',
          customMessage: c.originalName,
          select: c.select,
          alias: c.alias,
          agg: c.agg ? "SUM" : undefined
        }));
        store.setColumns(parsed);
        toast.success("Columnas extraídas exitosamente");
      }
    } catch (e: any) {
      toast.error(e.message || "Error al analizar el SQL");
    } finally {
      setIsAnalyzing(false);
    }
  };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            store.loadFromJSON(data);
            toast.success("Preset Report importado correctamente");
        } catch (err) {
            toast.error("El archivo no es un JSON válido");
        }
        e.target.value = '';
    };
    reader.readAsText(file);
  };

  const hasColumns = store.columns.length > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
        <TopNavbar />
        
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-md text-white shadow-sm">
              <Database size={18} />
            </div>
            <h2 className="font-semibold text-lg text-slate-900">Preset Report Builder</h2>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-semibold border border-slate-200 ml-2">Data Engine</span>
          </div>
          
          <div className="flex gap-3">
            <label className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-md font-medium text-sm shadow-sm transition-colors cursor-pointer">
              <Upload size={16} className="text-slate-500" /> Importar JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            </label>
            <button 
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-md font-medium text-sm shadow-sm transition-colors"
            >
              <Code2 size={16} /> Ver Config & i18n
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar - Metadata & Variables */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-0 shadow-sm relative overflow-y-auto">
            <PresetMetadataForm />
          </div>

          {/* Main Configuration Canvas */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 relative">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* SQL Input Area */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2"><Code2 size={18} className="text-indigo-600"/> Consulta Principal (SQL)</h3>
                    <p className="text-sm text-slate-500">Usa comodines como &amp;user_id&amp; que definiste a la izquierda.</p>
                  </div>
                  <button 
                    onClick={handleAnalyzeSql} disabled={isAnalyzing}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Zap size={16}/> {isAnalyzing ? "Analizando..." : "Extraer Columnas"}
                  </button>
                </div>
                <div className="p-0">
                  <textarea 
                    value={store.mainSql} onChange={e => store.setField('mainSql', e.target.value)}
                    className="w-full bg-slate-900 text-emerald-400 p-6 text-sm font-mono h-48 focus:outline-none resize-y" 
                    spellCheck="false" placeholder="SELECT v.place_id, v.total..."
                  />
                </div>
              </div>

              {/* Pre/Post Queries */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 text-base">Consultas Adicionales</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Pre-Queries (separadas por ';')</label>
                    <textarea value={store.preQueries} onChange={e => store.setField('preQueries', e.target.value)} className="w-full border border-slate-200 rounded-md p-3 text-sm font-mono h-20 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Post-Queries (separadas por ';')</label>
                    <textarea value={store.postQueries} onChange={e => store.setField('postQueries', e.target.value)} className="w-full border border-slate-200 rounded-md p-3 text-sm font-mono h-20 focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              {/* Columns Mapper */}
              {hasColumns && (
                <PresetColumnsMapper />
              )}

              {!hasColumns && (
                <div className="mt-6 p-6 bg-indigo-50/50 border border-dashed border-indigo-200 text-indigo-800 rounded-xl text-center">
                    <p className="font-semibold mb-1">Esperando extracción de columnas</p>
                    <p className="text-sm text-indigo-600/80">Introduce tu consulta SQL y haz clic en "Extraer Columnas" arriba para configurar los tipos de datos y los mensajes de i18n.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && <PresetOutputsDrawer onClose={() => setDrawerOpen(false)} />}
    </ProtectedRoute>
  );
}