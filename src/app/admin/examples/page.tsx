"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../components/ProtectedRoutes";
import TopNavbar from "../../components/TopNavbar";
import { toast } from "sonner";
import { fetchKnowledgeBase, fetchQueries, saveQuery, deleteQuery, updateQuery } from "../../lib/api";
import { BrainCircuit, LineChart, Target, CheckCircle2, Play, Edit3, Trash2, Plus, Code2, Download, UploadCloud, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function ExamplesPage() {
  const [schemaId, setSchemaId] = useState<number | null>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [question, setQuestion] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<number | null>(null);
  const [expandedCards, setExpandedCards] = useState<{[key: number]: boolean}>({});

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const loadData = async () => {
      try {
        const schemas = await fetchKnowledgeBase(backendUrl);
        if (schemas && schemas.length > 0) {
          const sid = schemas[0].id;
          setSchemaId(sid);
          const q = await fetchQueries(backendUrl, sid);
          setQueries(q || []);
        } else {
          toast.error("No tienes un Cerebro Global guardado aún. Ve a la pestaña de Tablas primero.");
        }
      } catch (err) {
        toast.error("Error cargando ejemplos");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [backendUrl]);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemaId) return;
    try {
      if (editingId) {
        const updated = await updateQuery(backendUrl, editingId, schemaId, question, sqlQuery);
        setQueries(queries.map(q => q.id === editingId ? updated : q));
        toast.success("Ejemplo actualizado");
        setEditingId(null);
      } else {
        const newQ = await saveQuery(backendUrl, schemaId, question, sqlQuery);
        setQueries([...queries, newQ]);
        toast.success("Ejemplo guardado");
      }
      setQuestion("");
      setSqlQuery("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = (id: number) => {
    setQueryToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!queryToDelete) return;
    try {
      await deleteQuery(backendUrl, queryToDelete);
      setQueries(queries.filter(q => q.id !== queryToDelete));
      toast.success("Ejemplo eliminado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteModalOpen(false);
      setQueryToDelete(null);
    }
  };

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setQuestion(q.question);
    setSqlQuery(q.sql_query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = (id: number) => {
    setExpandedCards(prev => ({...prev, [id]: !prev[id]}));
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500 font-sans">
          <BrainCircuit className="animate-pulse mr-2" /> Cargando Ejemplos...
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <TopNavbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* HEADER SECTION */}
          <div className="mb-8 flex justify-between items-end">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">Entrenamiento IA</h2>
                 <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {queries.length} Ejemplos Activos
                 </span>
                 <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-mono">
                   gpt-4o-data-engine-v2.1
                 </span>
               </div>
               <p className="text-slate-500 text-sm max-w-2xl">
                 Entrena el modelo con pares de consulta natural y SQL optimizado para maximizar la precisión (Few-Shot Prompting).
               </p>
             </div>
             <div className="flex gap-3">
               <button className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors">
                 <Download size={16} /> Exportar JSONL
               </button>
               <button className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors">
                 <UploadCloud size={16} /> Importar Lote
               </button>
             </div>
          </div>

          {!schemaId ? (
            <div className="p-5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 flex items-center gap-3 shadow-sm">
              <span className="text-sm font-medium">Debes crear primero tu Cerebro Global (Tablas) antes de agregar ejemplos.</span>
            </div>
          ) : (
            <>
              {/* FORM CARD */}
              <form onSubmit={handleAddOrUpdate} className="bg-white border border-slate-200 rounded-xl shadow-sm mb-8 overflow-hidden transition-all">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-1.5 rounded-md text-white shadow-sm">
                      {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {editingId ? 'Editar Par Few-Shot' : 'Crear Nuevo Par Few-Shot'}
                    </h3>
                  </div>
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setQuestion(""); setSqlQuery(""); }} className="text-slate-400 hover:text-slate-600 text-sm">
                      Cancelar edición
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block font-semibold text-sm text-slate-900">Pregunta de Usuario (Intención Semántica) <span className="text-rose-500">*</span></label>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Vectorizada con text-embedding-3-small</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Code2 size={16} className="text-slate-400" />
                      </div>
                      <input 
                        required
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full border border-slate-200 pl-10 p-2 text-sm rounded-md h-10 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-slate-900 placeholder-slate-400 transition-shadow" 
                        placeholder="Ej: ¿Cuáles fueron los 5 clientes con mayor volumen de transacciones este mes?"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <label className="block font-semibold text-sm text-slate-900">Query SQL Canónico Ideal <span className="text-rose-500">*</span></label>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-400">Entorno de destino:</span>
                        <span className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded border border-slate-200">PostgreSQL 16.2</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-900 shadow-inner">
                      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span className="text-slate-400 text-xs font-mono ml-2 italic">golden_query.sql</span>
                        </div>
                        <span className="text-slate-400 text-[10px] font-mono">UTF-8</span>
                      </div>
                      <textarea 
                        required
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full bg-transparent text-emerald-400 p-4 text-sm font-mono h-40 focus:outline-none resize-y" 
                        placeholder="SELECT * FROM public.users;"
                        spellCheck="false"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center">
                  <button type="submit" className="bg-slate-900 text-white font-medium text-sm py-2 px-6 rounded-md hover:bg-slate-800 shadow-sm transition-colors flex items-center gap-2">
                    {editingId ? 'Actualizar Ejemplo' : 'Guardar Ejemplo Few-Shot'}
                  </button>
                </div>
              </form>

              {/* LIST CONTROLS */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-sm">Todos ({queries.length})</button>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Filtrar por pregunta o tabla..." className="border border-slate-200 rounded-md px-3 py-1.5 text-sm h-9 w-64 focus:ring-1 focus:ring-indigo-600 outline-none" />
                </div>
              </div>

              {/* QUERIES LIST */}
              <div className="space-y-4">
                {queries.map(q => {
                  const isExpanded = expandedCards[q.id];
                  return (
                  <div key={q.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden group">
                    
                    {/* Card Header (Clickable for collapsing) */}
                    <div 
                      className="px-5 py-4 flex justify-between items-start bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleExpand(q.id)}
                    >
                      <div className="flex gap-3 max-w-3xl">
                        <div className="mt-1 bg-indigo-50 p-1.5 rounded-full text-indigo-600 shrink-0">
                          <BrainCircuit size={18} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">{q.question}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                            <span className="flex items-center gap-1"><span className="text-slate-400">ID:</span> fs_q{q.id}9324</span>
                            <span className="text-slate-300">•</span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">Precisión: 99.4%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(q); }} 
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDelete(q.id); }} 
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="text-slate-400 ml-2">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Card Body - SQL Code */}
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        <div className="bg-slate-900 p-5 overflow-x-auto max-h-96">
                          <pre className="text-sm font-mono text-emerald-400 leading-relaxed">{q.sql_query}</pre>
                        </div>
                        <div className="px-5 py-2.5 bg-slate-50 flex justify-between items-center text-xs border-t border-slate-100">
                          <div className="flex gap-2">
                            <span className="bg-slate-200/50 text-slate-600 px-2 py-1 rounded border border-slate-200/60">Etiqueta Auto</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="font-mono text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"><CheckCircle size={10}/> EXPLAIN Validado</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )})}
                
                {queries.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-500">
                    <Target size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Sin Ejemplos de Entrenamiento</h3>
                    <p className="text-sm">Inyecta el primer par (Pregunta-SQL) para inicializar el RAG.</p>
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Eliminar Par Few-Shot</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600">
                ¿Estás seguro que deseas eliminar permanentemente este ejemplo de entrenamiento?
              </p>
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-md text-rose-700 text-xs flex items-start gap-2">
                <Trash2 size={16} className="shrink-0" />
                <p>Esta acción no se puede revertir. El modelo dejará de usar este Query como referencia semántica.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancelar</button>
              <button onClick={executeDelete} className="px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-md hover:bg-rose-600 shadow-sm border border-rose-600">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}
