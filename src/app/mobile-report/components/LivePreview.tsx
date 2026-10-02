"use client";

import { useState } from "react";
import { useMobileReportStore } from "../../store/mobileReportStore";
import { ReportComponent } from "../../types/mobileReport";
import { Filter, RotateCcw } from "lucide-react";

export default function LivePreview() {
  const { components, filters } = useMobileReportStore();
  const [navState, setNavState] = useState<Record<string, string>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Funcin para evaluar si un componente debe mostrarse segn el estado actual
  const isVisible = (comp: ReportComponent) => {
    const show = comp as any;
    
    if (show.hide_when) {
      const val = navState[show.hide_when.param];
      if (show.hide_when.present === true && val !== undefined) return false;
      if (show.hide_when.present === false && val === undefined) return false;
      if (show.hide_when.value !== undefined && val === String(show.hide_when.value)) return false;
    }

    if (show.show_when) {
      const val = navState[show.show_when.param];
      if (show.show_when.present === true && val === undefined) return false;
      if (show.show_when.present === false && val !== undefined) return false;
      if (show.show_when.value !== undefined && val !== String(show.show_when.value)) return false;
    }

    return true;
  };

  const handleNavClick = (params: Record<string, string> | undefined) => {
    if (!params) return;
    // Hacemos merge del estado actual con los nuevos parmetros (simulando navegacin/filtros)
    setNavState(prev => ({ ...prev, ...params }));
  };

  const clearNav = () => { setNavState({}); setExpandedDetails({}); };

  const renderComponent = (comp: ReportComponent) => {
    if (!isVisible(comp)) return null;

    const anyComp = comp as any;

    switch (comp.type?.toLowerCase()) {
      case "report_title":
        return (
          <div key={comp.id} className="mb-4">
            <h1 className="text-xl font-bold text-white bg-slate-800 p-4 rounded-t-lg -mx-4 -mt-4 uppercase shadow-sm">
              {comp.title || "Ttulo Principal"}
            </h1>
          </div>
        );
      case "section_header":
        return (
          <div key={comp.id} className="mt-6 mb-3 border-l-4 border-cyan-500 pl-2">
            <h2 className="text-sm font-bold text-cyan-600 uppercase tracking-wide">
              {comp.title || "Seccin"}
            </h2>
          </div>
        );
      case "resume":
        return (
          <div key={comp.id} className="mb-6 bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">{comp.title || "Resumen"}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Ultima actualizacin: -</p>
            </div>
            
            <div className="flex bg-cyan-700 text-white text-[10px] font-bold p-2 px-3">
              <div className="flex-1"></div>
              {comp.column_titles?.map((ct, idx) => (
                <div key={idx} className="w-20 text-center uppercase">{ct}</div>
              ))}
              {!comp.column_titles?.length && (
                <>
                  <div className="w-20 text-center uppercase">Objetivo</div>
                  <div className="w-20 text-center uppercase">Cumplimiento</div>
                </>
              )}
            </div>
            
            <div className="divide-y divide-slate-100">
              {(comp.rows && comp.rows.length > 0) ? comp.rows.map((row, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleNavClick(row.nav_params)}
                  className={`flex p-3 items-center text-xs text-slate-700 font-medium transition-colors ${row.nav_params ? 'cursor-pointer hover:bg-slate-50 active:bg-slate-100' : ''}`}
                >
                  <div className="flex-1">{row.description}</div>
                  <div className="w-20 text-center text-emerald-600">30%</div>
                  {comp.column_titles && comp.column_titles.length > 1 ? (
                    <div className="w-20 text-center text-emerald-600">29.2%</div>
                  ) : (
                    <div className="w-20 text-center text-emerald-600">29.2%</div>
                  )}
                  {row.nav_params && (
                     <div className="pl-2 text-slate-300">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                     </div>
                  )}
                </div>
              )) : (
                <div className="flex p-3 items-center text-xs text-slate-700 font-medium cursor-pointer hover:bg-slate-50" onClick={() => handleNavClick({ "pilar": "av" })}>
                  <div className="flex-1">Disponibilidad (Mock)</div>
                  <div className="w-20 text-center text-emerald-600">30%</div>
                  <div className="w-20 text-center text-emerald-600">29.2%</div>
                  <div className="pl-2 text-slate-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                </div>
              )}
            </div>
          </div>
        );
      case "progress_bar":
        // Mock conditionals based on success_min / warning_min
        const isWarning = anyComp.warning_min && anyComp.success_min ? true : false; 
        
        return (
          <div key={comp.id} className="mb-6 bg-white rounded-lg shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-4">{comp.title || "Progreso"}</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold text-slate-800">97.2%</span>
              <div className="flex-1"></div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-slate-800">97.2 <span className="text-slate-400 text-sm font-normal">/ 100</span></span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: "97%" }}></div>
            </div>
            
            {anyComp.detail && (
               <>
                 <button 
                   onClick={() => setExpandedDetails(prev => ({ ...prev, [comp.id]: !prev[comp.id] }))}
                   className="mt-4 w-full py-2 bg-slate-50 border border-slate-200 rounded text-slate-500 text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-slate-100 uppercase tracking-wider transition-colors"
                 >
                    {expandedDetails[comp.id] ? (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg> Ocultar Detalle</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg> Ver Detalle</>
                    )}
                 </button>
                 
                 {/* Tabla Colapsable */}
                 {expandedDetails[comp.id] && anyComp.detail.type === "table" && (
                   <div className="mt-3 border border-slate-100 rounded overflow-hidden">
                     <div className="flex bg-cyan-700 text-white text-[10px] font-bold p-2 px-3 uppercase">
                       {anyComp.detail.columns ? (
                         anyComp.detail.columns.map((col: any, i: number) => <div key={i} className="flex-1">{col.label}</div>)
                       ) : (
                         <div className="flex-1">ID | Nombre | Valor</div>
                       )}
                     </div>
                     <div className="divide-y divide-slate-50">
                       <div className="flex p-2 text-xs text-slate-600 bg-white"><div className="flex-1 truncate">Ejemplo Dato 1</div><div className="flex-1 text-right">98%</div></div>
                       <div className="flex p-2 text-xs text-slate-600 bg-white"><div className="flex-1 truncate">Ejemplo Dato 2</div><div className="flex-1 text-right">95%</div></div>
                       <div className="flex p-2 text-xs text-slate-600 bg-white"><div className="flex-1 truncate">Ejemplo Dato 3</div><div className="flex-1 text-right">100%</div></div>
                     </div>
                   </div>
                 )}
               </>
            )}
          </div>
        );
      case "graph_bar":
      case "graph_line":
      case "graph_mixed":
        return (
          <div key={comp.id} className="mb-6 bg-white rounded-lg shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-1">{comp.title || "Grfica"}</h3>
            <p className="text-[10px] text-slate-400 mb-4">Ultima actualizacin: -</p>
            <div className="h-40 w-full bg-slate-50 border border-slate-100 rounded flex items-end justify-around p-4 gap-2">
              <div className="w-full bg-cyan-400 rounded-t-sm h-[80%]"></div>
              <div className="w-full bg-cyan-400 rounded-t-sm h-[60%]"></div>
              <div className="w-full bg-cyan-400 rounded-t-sm h-[90%]"></div>
              <div className="w-full bg-cyan-400 rounded-t-sm h-[40%]"></div>
            </div>
          </div>
        );
      case "progress_circle":
        return (
          <div key={comp.id} className="mb-6 bg-white rounded-lg shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-4">{comp.title || "Avance"}</h3>
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-[6px] border-slate-100 border-t-emerald-400 border-r-emerald-400 flex items-center justify-center">
                 <span className="text-lg font-bold text-slate-700">75%</span>
              </div>
            </div>
          </div>
        );
      case "card_carousel":
        return (
          <div key={comp.id} className="mb-6 border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-800 text-sm mb-4 px-1">{comp.title || "Carrusel"}</h3>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  onClick={() => handleNavClick({ placeId: `store_${i}` })}
                  className="min-w-[130px] bg-white border border-slate-200 hover:border-orange-300 rounded-lg p-3 shadow-sm flex flex-col shrink-0 cursor-pointer transition-colors"
                >
                  <span className="text-[10px] text-slate-500 truncate mb-1">4987-TIENDA {i}</span>
                  <span className="text-2xl font-bold text-orange-400">46.67</span>
                  <div className="w-1/2 h-1 bg-orange-400 mt-2 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        );
      case "basic_tree":
        return (
          <div key={comp.id} className="mb-6 bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-slate-100 cursor-pointer bg-slate-50 hover:bg-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">{comp.title || "Detalle Lugares"}</h3>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </div>
            <div className="text-xs text-slate-700 bg-white">
               <div className="flex justify-between p-3 border-b border-slate-50 font-bold hover:bg-slate-50 cursor-pointer">
                  <span>▼ RETAIL</span><span>97.2</span>
               </div>
               <div className="flex justify-between p-3 border-b border-slate-50 pl-6 font-bold hover:bg-slate-50 cursor-pointer">
                  <span>▼ CHEDRAUI</span><span>99</span>
               </div>
               <div className="flex justify-between p-3 border-b border-slate-50 pl-10 text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <span>▶ TDA CHE AB</span><span>98.1</span>
               </div>
               <div className="flex justify-between p-3 border-b border-slate-50 pl-10 text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <span>▶ SUPER CHE SELECTO</span><span>100</span>
               </div>
               <div className="flex justify-between p-3 border-b border-slate-50 pl-6 font-bold hover:bg-slate-50 cursor-pointer">
                  <span>▶ SORIANA</span><span>95</span>
               </div>
            </div>
          </div>
        );
      case "table":
        const anyTableComp = comp as any;
        return (
          <div key={comp.id} className="mb-6 bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <h3 className="font-bold text-slate-800 text-sm p-3">{comp.title || "Tabla"}</h3>
            <div className="flex bg-cyan-700 text-white text-[10px] font-bold p-2 px-3 uppercase">
              {anyTableComp.columns?.length ? (
                anyTableComp.columns.map((col: any, idx: number) => <div key={idx} className="flex-1 truncate pr-1">{col.label || col.key || 'Columna'}</div>)
              ) : anyTableComp.column_titles?.length ? (
                anyTableComp.column_titles.map((ct: string, idx: number) => <div key={idx} className="flex-1 truncate pr-1">{ct}</div>)
              ) : (
                <>
                  <div className="flex-1">Lugar</div>
                  <div className="flex-1">Ventas</div>
                  <div className="flex-1 text-right">Estatus</div>
                </>
              )}
            </div>
            
            <div className="divide-y divide-slate-100 bg-white">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex p-3 text-xs text-slate-700 hover:bg-slate-50">
                  {anyTableComp.columns?.length ? (
                    anyTableComp.columns.map((col: any, idx: number) => (
                      <div key={idx} className={`flex-1 truncate pr-2 ${idx === anyTableComp.columns.length - 1 ? 'text-right font-medium' : ''}`}>
                        {idx === 0 ? `Tienda ${row + 100}` : idx === 1 ? `$${(row * 4321).toLocaleString()}` : `Dato ${row}`}
                      </div>
                    ))
                  ) : anyTableComp.column_titles?.length ? (
                    anyTableComp.column_titles.map((ct: string, idx: number) => (
                      <div key={idx} className="flex-1 truncate pr-2">{`Dato ${row}.${idx}`}</div>
                    ))
                  ) : (
                    <>
                      <div className="flex-1 truncate font-medium">Sucursal {row}</div>
                      <div className="flex-1 truncate text-slate-500">$ {(row * 850).toFixed(2)}</div>
                      <div className="flex-1 text-right text-emerald-600 font-bold">Activo</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div key={comp.id} className="mb-4 bg-white rounded shadow-sm border border-slate-100 p-4 opacity-75">
            <h3 className="font-bold text-slate-800 text-sm">{comp.title || comp.type}</h3>
            <p className="text-xs text-slate-400 mt-2">[{comp.type}] Previsualizacin simplificada</p>
          </div>
        );
    }
  };

  return (
    <div className="w-[400px] border-l border-slate-200 bg-slate-100 p-6 flex flex-col h-full shadow-inner overflow-hidden">
      
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Preview
        </h3>
        <div className="flex gap-2 items-center">
          {Object.keys(navState).length > 0 && (
            <button 
              onClick={clearNav}
              className="flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-50 hover:text-rose-500 transition-colors"
              title="Limpiar navegacin / filtros"
            >
              <RotateCcw size={12} /> Reset Nav
            </button>
          )}
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mobile View</span>
        </div>
      </div>

      {/* Nav State Debugger (Optional) */}
      {Object.keys(navState).length > 0 && (
         <div className="mb-4 text-[10px] bg-indigo-50 border border-indigo-100 p-2 rounded text-indigo-700 font-mono flex gap-2 overflow-x-auto hide-scrollbar">
           <Filter size={12} className="shrink-0" />
           {Object.entries(navState).map(([k, v]) => (
              <span key={k} className="bg-white px-1.5 rounded border border-indigo-100 shrink-0">{k}: {v}</span>
           ))}
         </div>
      )}

      {/* Mobile Frame Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-[2rem] shadow-xl border-4 border-slate-800 relative mx-auto w-full max-w-[340px] flex flex-col hide-scrollbar">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>

        <div className="flex-1 overflow-y-auto pt-8 pb-10 px-4 bg-slate-50 relative">
           
           {/* Fake App Header */}
           <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3 sticky top-0 bg-slate-50 z-10 pt-2">
              <span className="text-sm font-bold text-slate-800">Filtros</span>
              <span className="text-slate-400 text-xs">▼</span>
           </div>

           {/* Components */}
           {components.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                <p className="text-xs text-slate-500">Agrega componentes al reporte para verlos aqu</p>
             </div>
           ) : (
             components.map(renderComponent)
           )}

        </div>

        {/* Home bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-300 rounded-full z-20"></div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}