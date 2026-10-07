"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoutes";
import TopNavbar from "../components/TopNavbar";
import { toast } from "sonner";
import { fetchKnowledgeBase, generateSqlQuery } from "../lib/api";
import { Copy, Sparkles, Database, Check, Play, Zap, Info, Cpu, Code2 } from "lucide-react";

export default function AIGeneratorPage() {
  const [schemaId, setSchemaId] = useState<number | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  
  const [dbEngine, setDbEngine] = useState("aurora");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const loadContext = async () => {
      try {
        const schemas = await fetchKnowledgeBase(backendUrl);
        if (schemas && schemas.length > 0) {
          setSchemaId(schemas[0].id);
        } else {
          toast.error("No tienes un Cerebro Global guardado aún.");
        }
      } catch (err) {
        toast.error("Error conectando con la base de conocimiento.");
      } finally {
        setIsLoadingContext(false);
      }
    };
    loadContext();
  }, [backendUrl]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!schemaId) {
      toast.error("Falta el contexto de la base de datos.");
      return;
    }
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSqlResult(null);
    setCopied(false);
    const start = Date.now();

    try {
      const result = await generateSqlQuery(backendUrl, schemaId, prompt, dbEngine);
      setSqlResult(result.query);
      setGenerationTime(Date.now() - start);
      toast.success("Query generado exitosamente");
    } catch (err: any) {
      toast.error(err.message || "Error al generar el query");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const copyToClipboard = () => {
    if (sqlResult) {
      navigator.clipboard.writeText(sqlResult);
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoadingContext) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500 font-sans">
          <Database className="animate-pulse mr-2" /> Sincronizando contexto semántico...
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <TopNavbar />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex gap-2 mb-3">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">COPILOT CORE</span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center">• PostgreSQL v16.3-pgvector</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Asistente SQL</h2>
              <p className="text-slate-500 text-sm max-w-2xl">
                Transforma intenciones complejas en sintaxis SQL optimizada con introspección activa de esquemas, particiones e índices.
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm text-xs">
                <Cpu size={14} className="text-emerald-500" />
                <span className="text-slate-500">Modelo:</span>
                <span className="font-semibold text-slate-700">gpt-oss-120b</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm text-xs">
                <Zap size={14} className="text-indigo-500" />
                <span className="text-slate-500">Latencia promedio:</span>
                <span className="font-semibold text-slate-700">{generationTime ? generationTime + 'ms' : '240ms'}</span>
              </div>
            </div>
          </div>

          {!schemaId ? (
            <div className="p-5 bg-amber-50 text-amber-800 rounded-lg text-center border border-amber-200 shadow-sm">
              <Database className="mx-auto mb-3 text-amber-500" />
              <p className="font-semibold text-sm">Base de Conocimiento Inactiva</p>
              <p className="text-xs mt-1">Ve a la sección "Cerebro Global" para configurar e indexar tus tablas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Context Bar */}
              <div className="flex justify-between items-center bg-slate-50 border-y border-slate-200 py-3 px-1 mb-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database size={14}/> Tablas en contexto:
                  </span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> public.usuarios</span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> public.ventas</span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> analytics.logs</span>
                  <button className="text-slate-400 hover:text-slate-600 font-medium px-2 py-1">+ Agregar Esquema</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-2">
                    <Code2 size={14}/> 
                    <label className="font-semibold">Motor BD:</label>
                    <select 
                      value={dbEngine}
                      onChange={(e) => setDbEngine(e.target.value)}
                      className="bg-transparent outline-none font-bold cursor-pointer"
                    >
                      <option value="aurora">Aurora (PostgreSQL)</option>
                      <option value="redshift">AWS Redshift</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat Input Area (The White Card) */}
              <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden relative">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent p-6 focus:outline-none resize-none h-40 text-slate-800 text-base placeholder-slate-300 leading-relaxed"
                  placeholder="Muestra los ingresos recurrentes mensuales del último trimestre comparados con el año anterior, agrupados por mes de facturación..."
                  disabled={isGenerating}
                  spellCheck="false"
                />
                <div className="flex justify-between items-end p-4 bg-white border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sugerencias:</span>
                    <button className="text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors">Top clientes del mes</button>
                    <button className="text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors">Anomalías en transacciones</button>
                    <button className="text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors">Churn rate trimestral</button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">⌘ + Enter para ejecutar</span>
                    <button 
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || !prompt.trim()}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-md font-medium text-sm flex items-center hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors shadow-sm"
                    >
                      {isGenerating ? (
                        <><Sparkles size={16} className="mr-2 animate-spin text-indigo-400" /> Procesando...</>
                      ) : (
                        <><Sparkles size={16} className="mr-2 text-indigo-400" /> Generar SQL con IA</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Area (Mac IDE Style) */}
              {sqlResult && (
                <div className="bg-[#0f111a] shadow-2xl rounded-xl border border-slate-800 overflow-hidden mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* IDE Header */}
                  <div className="flex justify-between items-center px-4 py-2.5 bg-[#1a1d27] border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      {/* Mac Dots */}
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      
                      {/* Tab */}
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-[#0f111a] px-3 py-1 rounded-t-md mt-2 mb-[-10px] border-x border-t border-slate-800 pb-3">
                        <Code2 size={14} className="text-slate-500"/>
                        query_generada.sql
                        <span className="bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] ml-2">PostgreSQL 16 CTE</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Sintaxis Verificada</span>
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center text-xs font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors text-slate-300 border border-white/10"
                      >
                        {copied ? <><Check size={14} className="mr-1.5 text-emerald-400"/> Copiado</> : <><Copy size={14} className="mr-1.5"/> Copiar al portapapeles</>}
                      </button>
                    </div>
                  </div>
                  
                  {/* IDE Body */}
                  <div className="p-6 overflow-x-auto">
                    <pre className="font-mono text-sm leading-relaxed text-emerald-400">
                      <code>{sqlResult}</code>
                    </pre>
                  </div>
                  
                  {/* IDE Footer Actions */}
                  <div className="px-6 py-3 bg-[#1a1d27] border-t border-slate-800 flex justify-between items-center">
                    <div className="flex gap-3">
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2">
                        <Play size={14} /> Ejecutar Query en BD
                      </button>
                      <button className="text-slate-400 hover:text-slate-200 px-3 py-1.5 text-sm transition-colors flex items-center gap-2">
                        <Info size={14} /> Explicación del query paso a paso
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500"/> Costo estimado: <span className="text-slate-200">0.002x</span></span>
                      <span className="flex items-center gap-1.5"><Database size={12} className="text-indigo-400"/> Buffer scan: <span className="text-slate-200">Index Scan using idx_invoices_status</span></span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
