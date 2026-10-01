"use client";

import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoutes";
import TopNavbar from "../components/TopNavbar";
import { useMobileReportStore } from "../store/mobileReportStore";
import { Code2, Settings2, Plus, LayoutList, Download, Copy, Play, Check, X, Upload, FileCode } from "lucide-react";
import { toast } from "sonner";
import GlobalFiltersForm from "./components/GlobalFiltersForm";
import ComponentConfigurator from "./components/ComponentConfigurator";
import AddComponentModal from "./components/AddComponentModal";

export default function MobileReportBuilder() {
  const { filters, components, removeComponent, exportJSON } = useMobileReportStore();
  const [selectedItem, setSelectedItem] = useState<string>("filters");
  const [jsonDrawerOpen, setJsonDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [copiedMinified, setCopiedMinified] = useState(false);

  const handleCopyFormatted = () => {
    const jsonStr = JSON.stringify(exportJSON(), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedFormatted(true);
    toast.success("JSON formateado copiado");
    setTimeout(() => setCopiedFormatted(false), 2000);
  };

  const handleCopyMinified = () => {
    const jsonStr = JSON.stringify(exportJSON());
    navigator.clipboard.writeText(jsonStr);
    setCopiedMinified(true);
    toast.success("JSON minificado copiado");
    setTimeout(() => setCopiedMinified(false), 2000);
  };

  const handleDownload = () => {
    const jsonStr = JSON.stringify(exportJSON(), null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mobile_report_config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Descarga iniciada");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            useMobileReportStore.getState().loadFromJSON(data);
            toast.success("Reporte importado correctamente");
        } catch (err) {
            toast.error("El archivo no es un JSON válido");
        }
        e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleRemoveComponent = (id: string) => {
    removeComponent(id);
    setSelectedItem("filters");
    toast.success("Componente eliminado");
  };

  const generatedJSON = JSON.stringify(exportJSON(), null, 2);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
        <TopNavbar />
        
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-md text-white shadow-sm">
              <LayoutList size={18} />
            </div>
            <h2 className="font-semibold text-lg text-slate-900">Mobile Report Builder</h2>
          </div>
          
          
          <div className="flex gap-3">
            <label className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-md font-medium text-sm shadow-sm transition-colors cursor-pointer">
              <Upload size={16} className="text-slate-500" /> Importar JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            </label>
            <button 
              onClick={() => setJsonDrawerOpen(true)}
              className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-md font-medium text-sm shadow-sm transition-colors"
            >
              <Code2 size={16} className="text-indigo-600" /> Ver JSON Compilado
            </button>
          </div>

        </div>

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar - Component Tree */}
          <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-0 shadow-sm relative">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estructura</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* Base / Filters */}
              <button 
                onClick={() => setSelectedItem("filters")}
                className={"w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors " + (selectedItem === "filters" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
              >
                <Settings2 size={16} className={selectedItem === "filters" ? "text-indigo-600" : "text-slate-400"} />
                Filtros Globales
              </button>

              <div className="pt-4 pb-1 px-3 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Componentes</span>
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{components.length}</span>
              </div>
              
              {components.map((c) => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedItem(c.id)}
                  className={"w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors " + (selectedItem === c.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}
                >
                  <LayoutList size={16} className={selectedItem === c.id ? "text-indigo-600" : "text-slate-400"} />
                  <span className="truncate">{c.title || c.id}</span>
                </button>
              ))}

            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setAddModalOpen(true)}
                className="w-full flex justify-center items-center gap-2 bg-white border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Añadir Componente
              </button>
            </div>
          </div>

          {/* Main Configuration Canvas */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-8 relative">
            
            <div className="max-w-4xl mx-auto">
              {selectedItem === "filters" ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 text-lg">Filtros Globales</h3>
                    <p className="text-sm text-slate-500">Configura los filtros estándar y personalizados que afectarán a toda la vista.</p>
                  </div>
                  <div className="p-6">
                    <GlobalFiltersForm />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">Configuración del Componente</h3>
                      <p className="text-sm text-slate-500">ID: <span className="font-mono text-indigo-600">{selectedItem}</span></p>
                    </div>
                    <button 
                      onClick={() => handleRemoveComponent(selectedItem)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded text-sm font-medium transition-colors border border-transparent hover:border-rose-200"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="p-6">
                    <ComponentConfigurator componentId={selectedItem} />
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Modals */}
      {addModalOpen && <AddComponentModal onClose={() => setAddModalOpen(false)} />}

      {/* JSON Drawer Overlay */}
      {jsonDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200] transition-opacity"
          onClick={() => setJsonDrawerOpen(false)}
        ></div>
      )}
      
      {/* Drawer Panel */}
      <div 
        className={"fixed top-0 right-0 h-full w-[600px] bg-[#0f111a] shadow-2xl z-[210] transform transition-transform duration-300 ease-in-out border-l border-slate-800 flex flex-col " + (jsonDrawerOpen ? "translate-x-0" : "translate-x-full")}
      >
        <div className="flex justify-between items-center px-6 py-4 bg-[#1a1d27] border-b border-slate-800">
          <div className="flex items-center gap-3 text-slate-200">
            <Code2 size={18} className="text-indigo-400" />
            <h3 className="font-semibold">JSON Generado</h3>
          </div>
          <button 
            onClick={() => setJsonDrawerOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="font-mono text-sm leading-relaxed text-emerald-400">
            <code>{generatedJSON}</code>
          </pre>
        </div>
        
        
        <div className="px-6 py-4 bg-[#1a1d27] border-t border-slate-800 flex justify-between items-center">
          <button onClick={handleDownload} className="text-slate-400 hover:text-white px-3 py-1.5 text-sm transition-colors flex items-center gap-2 border border-slate-700 rounded hover:bg-slate-800">
            <Download size={14} /> Descargar .json
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleCopyMinified}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm border border-slate-700"
            >
              {copiedMinified ? <><Check size={16} className="text-emerald-400"/> Copiado</> : <><FileCode size={16} /> Minificado</>}
            </button>
            <button 
              onClick={handleCopyFormatted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              {copiedFormatted ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Formateado</>}
            </button>
          </div>
        </div>

      </div>

    </ProtectedRoute>
  );
}
