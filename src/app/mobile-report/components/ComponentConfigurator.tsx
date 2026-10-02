"use client";

import React, { useState } from "react";
import { useMobileReportStore } from "../../store/mobileReportStore";
import { Database, Code2, Settings, Plus, Trash2, Zap, Eye } from "lucide-react";
import { TableColumn, ResumeRow } from "../../types/mobileReport";
import { toast } from "sonner";
import { parseColumns } from "../../lib/api";

export default function ComponentConfigurator({ componentId }: { componentId: string }) {
  const { components, updateComponent } = useMobileReportStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const component = components.find(c => c.id === componentId);
  if (!component) return null;

  const handleAnalyzeSql = async () => {
    if (!component.datasource) {
      toast.error("El query está vacío");
      return;
    }
    setIsAnalyzing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const data = await parseColumns(API_URL, component.datasource, component.type as any);
      
      if (data && data.columns) {
        let extractedCols = data.columns;
        // El backend viejo devuelve `[{ description, columns: [{ column }] }]` para resume
        // Lo aplanamos para usar nuestra interfaz moderna de chips interactivos
        if (component.type === "resume" && data.columns.length > 0 && data.columns[0].columns) {
          extractedCols = data.columns.map((c: any) => ({
            column: c.columns[0].column,
            description: c.description
          }));
        }
        
        updateComponent(component.id, { parsedColumns: extractedCols });

        if (component.type === "table") {
          const oldCols = component.columns || [];
          const merged = extractedCols.map((newCol: any) => {
            const old = oldCols.find((c: any) => c.column === newCol.column);
            return old ? old : { ...newCol, description: newCol.description || newCol.column };
          });
          updateComponent(component.id, { columns: merged });
          toast.success("Columnas extraídas del Query exitosamente");
          
        } else if (component.type === "resume") {
          toast.success("Columnas extraídas. Puedes seleccionarlas en las filas de tu resumen.");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Error al analizar el SQL");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderSpecificConfig = () => {
    switch (component.type) {
      case "basic_card":
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 bg-indigo-50 text-indigo-700 p-3 rounded border border-indigo-100">
              <strong>Info:</strong> Muestra un valor interpolado. Si usas <code>dual</code>, mostrará dos valores lado a lado.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Variant</label>
                <select 
                  value={component.variant || "default"}
                  onChange={e => updateComponent(component.id, { variant: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="default">Default</option>
                  <option value="dual">Dual (Dos valores)</option>
                </select>
              </div>
              
              {component.variant !== "dual" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Descriptions (Líneas de texto)</label>
                  <textarea 
                    value={component.descriptions ? component.descriptions.join('\n') : ""}
                    onChange={e => updateComponent(component.id, { descriptions: e.target.value.split('\n').filter(l => l.trim()) })}
                    placeholder="Ej: Vendiste &c_unidades& esta semana"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 h-20"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Left Col / Right Col (Alias numéricos)</label>
                    <div className="flex gap-2">
                      <input 
                        value={component.left_col || ""} onChange={e => updateComponent(component.id, { left_col: e.target.value })}
                        placeholder="left_col" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
                      />
                      <input 
                        value={component.right_col || ""} onChange={e => updateComponent(component.id, { right_col: e.target.value })}
                        placeholder="right_col" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Left Label / Right Label</label>
                    <div className="flex gap-2">
                      <input 
                        value={component.left_label || ""} onChange={e => updateComponent(component.id, { left_label: e.target.value })}
                        placeholder="Ej: Actual" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                      />
                      <input 
                        value={component.right_label || ""} onChange={e => updateComponent(component.id, { right_label: e.target.value })}
                        placeholder="Ej: Objetivo" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "progress_bar":
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 bg-indigo-50 text-indigo-700 p-3 rounded border border-indigo-100">
              <strong>Info:</strong> Puede ser 'default' o 'hero'. Lee las columnas <code>percentage</code> y <code>target_percentage</code> de tu SQL.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Variant</label>
                <select 
                  value={component.variant || "default"}
                  onChange={e => updateComponent(component.id, { variant: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="default">Default</option>
                  <option value="hero">Hero (Destacado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Success / Warning Min</label>
                <div className="flex gap-2">
                  <input 
                    type="number" step="0.01" value={component.success_min ?? ""}
                    onChange={e => updateComponent(component.id, { success_min: parseFloat(e.target.value) || undefined })}
                    placeholder="Success (Ej: 0.7)" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                  />
                  <input 
                    type="number" step="0.01" value={component.warning_min ?? ""}
                    onChange={e => updateComponent(component.id, { warning_min: parseFloat(e.target.value) || undefined })}
                    placeholder="Warning (Ej: 0.3)" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {component.variant === "hero" && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Labels (Hero)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      value={component.status_label_success || ""} onChange={e => updateComponent(component.id, { status_label_success: e.target.value })}
                      placeholder="Éxito" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm border-emerald-300"
                    />
                    <input 
                      value={component.status_label_warning || ""} onChange={e => updateComponent(component.id, { status_label_warning: e.target.value })}
                      placeholder="Medio" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm border-amber-300"
                    />
                    <input 
                      value={component.status_label_danger || ""} onChange={e => updateComponent(component.id, { status_label_danger: e.target.value })}
                      placeholder="Peligro" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm border-rose-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "progress_circle":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Value Column</label>
              <input 
                value={component.value_col || ""} onChange={e => updateComponent(component.id, { value_col: e.target.value })}
                placeholder="Ej: realizadas" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Column</label>
              <input 
                value={component.target_col || ""} onChange={e => updateComponent(component.id, { target_col: e.target.value })}
                placeholder="Ej: objetivo" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Format</label>
              <select 
                value={component.format || "percent"} onChange={e => updateComponent(component.id, { format: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="percent">Percent (%)</option>
                <option value="ratio">Ratio (X / Y)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Show Status</label>
              <select 
                value={component.show_status !== undefined ? String(component.show_status) : "false"}
                onChange={e => updateComponent(component.id, { show_status: e.target.value === "true" })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
        );

      case "graph_bar":
      case "graph_pie":
      case "graph_doughnut":
      case "graph_line":
      case "graph_mixed":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Random Colors</label>
              <select 
                value={component.random_colors || "false"} onChange={e => updateComponent(component.id, { random_colors: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="false">Falso (Default)</option>
                <option value="true">Verdadero</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Datasource Alerta (Opcional)</label>
              <input 
                value={component.datasource_alert || ""} onChange={e => updateComponent(component.id, { datasource_alert: e.target.value })}
                placeholder="SELECT show_alert, mensaje..." className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        );

      case "notice":
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Message (Texto del aviso)</label>
              <input 
                value={component.message || ""} onChange={e => updateComponent(component.id, { message: e.target.value })}
                placeholder="Ej: Este es un aviso importante" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Variant</label>
                <select 
                  value={component.variant || "info"} onChange={e => updateComponent(component.id, { variant: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Icon (Clase CSS)</label>
                <input 
                  value={component.icon || ""} onChange={e => updateComponent(component.id, { icon: e.target.value })}
                  placeholder="Ej: fas fa-info-circle" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        );

      case "report_title":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subtitle</label>
              <input 
                value={component.subtitle || ""} onChange={e => updateComponent(component.id, { subtitle: e.target.value })}
                placeholder="Ej: Resumen general" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Show Last Updated</label>
              <select 
                value={component.show_last_updated !== undefined ? String(component.show_last_updated) : "false"}
                onChange={e => updateComponent(component.id, { show_last_updated: e.target.value === "true" })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="false">No</option>
                <option value="true">Sí (Si existe last_updated en SQL)</option>
              </select>
            </div>
          </div>
        );

      case "grouped_list":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Group By (Alias)</label>
              <input 
                value={component.group_by || ""} onChange={e => updateComponent(component.id, { group_by: e.target.value })}
                placeholder="Ej: estado" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">List Label (Alias)</label>
              <input 
                value={component.list_label || ""} onChange={e => updateComponent(component.id, { list_label: e.target.value })}
                placeholder="Ej: producto" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Value is Percent</label>
              <select 
                value={component.value_is_percent !== undefined ? String(component.value_is_percent) : "false"}
                onChange={e => updateComponent(component.id, { value_is_percent: e.target.value === "true" })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
        );

      case "card_carousel":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Value Col (Alias)</label>
              <input 
                value={component.value_col || ""} onChange={e => updateComponent(component.id, { value_col: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Label Col (Alias)</label>
              <input 
                value={component.label_col || ""} onChange={e => updateComponent(component.id, { label_col: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Color Col (Opcional)</label>
              <input 
                value={component.color_col || ""} onChange={e => updateComponent(component.id, { color_col: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        );

      case "history_list":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Period Col (Grupo)</label>
              <input 
                value={component.period_col || ""} onChange={e => updateComponent(component.id, { period_col: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date Col (Etiqueta)</label>
              <input 
                value={component.date_col || ""} onChange={e => updateComponent(component.id, { date_col: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Value Col</label>
              <input 
                value={component.value_col || ""} onChange={e => updateComponent(component.id, { value_col: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        );

      case "metric_section":
        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md text-emerald-800 text-xs leading-relaxed">
              <strong>Reglas de Color (Semforo)</strong><br/>
              Define a partir de qu porcentaje cambia de color el nmero. Ej: Si configuras <b>Success Min</b> en <code>0.9</code> y <b>Warning Min</b> en <code>0.6</code>, la mrica ser Verde arriba de 90%, Amarilla arriba de 60%, y Roja por debajo.
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Layout</label>
                <select 
                  value={component.layout || "row"} onChange={e => updateComponent(component.id, { layout: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="row">Row (Fila)</option>
                  <option value="grid">Grid (Cuadrícula)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Success Min</label>
                <input 
                  type="number" step="0.01" value={component.success_min ?? ""}
                  onChange={e => updateComponent(component.id, { success_min: parseFloat(e.target.value) || undefined })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Warning Min</label>
                <input 
                  type="number" step="0.01" value={component.warning_min ?? ""}
                  onChange={e => updateComponent(component.id, { warning_min: parseFloat(e.target.value) || undefined })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-800 text-xs">
              <strong>Métricas internas:</strong> Para configurar el array de <code>metrics[]</code> por ahora edita el JSON directamente, ya que requiere múltiples campos anidados por métrica.
            </div>
          </div>
        );

      case "table":
        const cols = (component.columns || []) as TableColumn[];
        return (
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Layout de Tabla</label>
                <select 
                  value={component.layout || "table"} onChange={e => updateComponent(component.id, { layout: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="table">Normal (Filas y Columnas)</option>
                  <option value="cards">Cards (Tarjetas)</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Columnas Mapeadas</span>
                <button 
                  onClick={() => updateComponent(component.id, { columns: [...cols, { column: "nueva_col", description: "Nueva" }] })}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-700"
                >
                  <Plus size={12}/> Agregar
                </button>
              </div>
              <div className="p-3 space-y-3">
                {cols.map((col, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white border border-slate-100 p-2 rounded shadow-sm">
                    <input 
                      value={col.column || ""} onChange={e => { const nc = [...cols]; nc[idx] = { ...nc[idx], column: e.target.value }; updateComponent(component.id, { columns: nc }); }}
                      placeholder="alias_sql" className="w-1/3 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                    />
                    <input 
                      value={col.description || ""} onChange={e => { const nc = [...cols]; nc[idx] = { ...nc[idx], description: e.target.value }; updateComponent(component.id, { columns: nc }); }}
                      placeholder="Etiqueta" className="w-1/3 border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <label><input type="checkbox" checked={col.is_number || false} onChange={e => { const nc = [...cols]; nc[idx] = { ...nc[idx], is_number: e.target.checked }; updateComponent(component.id, { columns: nc }); }} /> Num</label>
                      <label><input type="checkbox" checked={col.is_percent || false} onChange={e => { const nc = [...cols]; nc[idx] = { ...nc[idx], is_percent: e.target.checked }; updateComponent(component.id, { columns: nc }); }} /> %</label>
                      <label><input type="checkbox" checked={col.is_amount || false} onChange={e => { const nc = [...cols]; nc[idx] = { ...nc[idx], is_amount: e.target.checked }; updateComponent(component.id, { columns: nc }); }} /> $</label>
                    </div>
                    <button onClick={() => { const nc = cols.filter((_, i) => i !== idx); updateComponent(component.id, { columns: nc }); }} className="text-rose-500 p-1 hover:bg-rose-50 rounded ml-auto">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
                {cols.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No hay columnas configuradas.</p>}
              </div>
            </div>
          </div>
        );

      case "resume":
        const rows = (component.rows || []) as ResumeRow[];
        const parsedCols = component.parsedColumns || [];
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Títulos de Columnas (Separados por coma)</label>
                <input 
                  value={(component.column_titles || []).join(', ')} 
                  onChange={e => updateComponent(component.id, { column_titles: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                  placeholder="Ej: Avance, Monto, Total" 
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Filas del Resumen</span>
                <button 
                  onClick={() => updateComponent(component.id, { rows: [...rows, { description: "Nueva fila", columns: [] }] })}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-700"
                >
                  <Plus size={12}/> Agregar Fila
                </button>
              </div>
              <div className="p-3 space-y-4">
                {rows.map((row, rIdx) => (
                  <div key={rIdx} className="border border-slate-200 rounded bg-white shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex gap-2 items-center">
                      <input 
                        value={row.description || ""}
                        onChange={e => { const nr = [...rows]; nr[rIdx] = { ...nr[rIdx], description: e.target.value }; updateComponent(component.id, { rows: nr }); }}
                        placeholder="Descripción de la Fila (Ej: Completadas)"
                        className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                      />
                      <button onClick={() => { const nr = rows.filter((_, i) => i !== rIdx); updateComponent(component.id, { rows: nr }); }} className="text-rose-500 hover:text-rose-700">
                        <Trash2 size={14}/>
                      </button>
                    </div>

                    <div className="p-3 border-b border-slate-100 bg-indigo-50/50">
                      <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Columnas Disponibles (Clic para vincular a esta fila):</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedCols.length === 0 && <span className="text-xs text-slate-400 italic">Haz clic en "Extraer Columnas" arriba para detectarlas.</span>}
                        {parsedCols.map((pCol, pIdx) => {
                          const isActive = row.columns?.some(c => c.column === pCol.column);
                          return (
                            <button
                              key={pIdx}
                              onClick={() => {
                                const nr = [...rows];
                                const rCols = nr[rIdx].columns || [];
                                if (isActive) {
                                  nr[rIdx] = { ...nr[rIdx], columns: rCols.filter(c => c.column !== pCol.column) };
                                } else {
                                  nr[rIdx] = { ...nr[rIdx], columns: [...rCols, { column: pCol.column, is_number: true }] };
                                }
                                updateComponent(component.id, { rows: nr });
                              }}
                              className={`px-2 py-1 text-[11px] rounded font-mono font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                            >
                              {pCol.column}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-2 space-y-2">
                      {row.columns && row.columns.length > 0 ? row.columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex gap-4 items-center bg-slate-50 border border-slate-100 p-2 rounded mx-2">
                          <span className="font-mono text-xs font-bold text-slate-700 w-1/4 truncate">{col.column}</span>
                          <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
                            <label className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"><input type="checkbox" checked={col.is_number || false} onChange={e => { const nr = [...rows]; const nc = [...nr[rIdx].columns]; nc[cIdx] = { ...nc[cIdx], is_number: e.target.checked }; nr[rIdx] = { ...nr[rIdx], columns: nc }; updateComponent(component.id, { rows: nr }); }} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /> Número</label>
                            <label className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"><input type="checkbox" checked={col.is_percent || false} onChange={e => { const nr = [...rows]; const nc = [...nr[rIdx].columns]; nc[cIdx] = { ...nc[cIdx], is_percent: e.target.checked }; nr[rIdx] = { ...nr[rIdx], columns: nc }; updateComponent(component.id, { rows: nr }); }} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /> % Porcentaje</label>
                            <label className="flex items-center gap-1 cursor-pointer hover:text-indigo-600"><input type="checkbox" checked={col.is_amount || false} onChange={e => { const nr = [...rows]; const nc = [...nr[rIdx].columns]; nc[cIdx] = { ...nc[cIdx], is_amount: e.target.checked }; nr[rIdx] = { ...nr[rIdx], columns: nc }; updateComponent(component.id, { rows: nr }); }} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /> $ Moneda</label>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 text-center py-2 italic">Ninguna columna seleccionada para esta fila.</p>
                      )}
                    </div>
                  </div>
                ))}
                {rows.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Crea una fila para empezar a armar el resumen.</p>}
              </div>
            </div>
          </div>
        );

      case "grid_group":
      case "tab_group":
        return (
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded text-indigo-800 text-xs">
            <strong>Contenedor:</strong> Este componente agrupa a otros. Debes inyectar el arreglo <code>children</code> en el JSON para agregar sus componentes internos.
          </div>
        );

      default:
        return (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm italic text-center">
            Este componente no requiere configuraciones visuales adicionales.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Component ID</label>
          <input disabled value={component.id} className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-md px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
          <input disabled value={component.type} className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-md px-3 py-2 text-sm uppercase tracking-wider" />
        </div>
        {component.type !== "grid_group" && component.type !== "tab_group" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Título Visual</label>
            <input value={component.title || ""} onChange={(e) => updateComponent(component.id, { title: e.target.value })} placeholder="Ej: Ventas del Mes" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-600 outline-none" />
          </div>
        )}
      </div>

      {component.type !== "section_header" && component.type !== "grid_group" && component.type !== "tab_group" && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Database size={16} className="text-indigo-600"/> Origen de Datos</h4>
          <div className="space-y-4">
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Schema de Conexión</label>
              <select value={component.schema || "project"} onChange={(e) => updateComponent(component.id, { schema: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-600 outline-none">
                <option value="project">project</option>
                <option value="stoiii">stoiii</option>
                <option value="stoiii_config">stoiii_config</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1"><Code2 size={12}/> Query Principal (Datasource)</label>
                {(component.type === 'table' || component.type === 'resume') && (
                  <button onClick={handleAnalyzeSql} disabled={isAnalyzing} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50 transition-colors">
                    <Zap size={10} /> {isAnalyzing ? 'Analizando...' : 'Extraer Columnas'}
                  </button>
                )}
              </div>
              <div className="rounded-md border border-slate-200 overflow-hidden bg-slate-900 shadow-inner">
                <textarea value={component.datasource || ""} onChange={(e) => updateComponent(component.id, { datasource: e.target.value })} className="w-full bg-transparent text-emerald-400 p-4 text-sm font-mono h-32 focus:outline-none resize-y" spellCheck="false" />
              </div>
            </div>

            {(component.type === "resume") && (
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1"><Code2 size={12}/> Subquery: Last Update (Opcional)</label>
                </div>
                <div className="rounded-md border border-slate-200 overflow-hidden bg-slate-900 shadow-inner">
                  <textarea value={component.last_date_datasource || ""} onChange={(e) => updateComponent(component.id, { last_date_datasource: e.target.value })} className="w-full bg-transparent text-indigo-300 p-3 text-sm font-mono h-12 focus:outline-none resize-y" spellCheck="false" placeholder="SELECT to_char(MAX(date)...)" />
                </div>
              </div>
            )}

            {(component.type === "table" || component.type === "grouped_list" || component.type === "basic_tree") && (
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1"><Code2 size={12}/> Subquery: Count Datasource</label>
                </div>
                <div className="rounded-md border border-slate-200 overflow-hidden bg-slate-900 shadow-inner">
                  <textarea value={component.count_datasource || ""} onChange={(e) => updateComponent(component.id, { count_datasource: e.target.value })} className="w-full bg-transparent text-indigo-300 p-3 text-sm font-mono h-20 focus:outline-none resize-y" spellCheck="false" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Eye size={16} className="text-indigo-600" /> Reglas de Visualizacion (Interacciones)
        </h4>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-800 text-xs leading-relaxed">
            <strong>Como funcionan las interacciones?</strong><br/>
            Esta sección te permite crear navegaciones y vistas anidadas sin programar. Cuando el usuario final interactúa con ciertos componentes (como darle clic a una fila del Resumen o a un Carrusel), el sistema guarda "Parmetros" temporales en memoria (ej. <code>pilar = av</code> o <code>placeId = 123</code>).<br/>
            Aquí puedes configurar tu componente para que reaccione a esos clics, dicindole: <em>"Aparece solo si el pilar es igual a av"</em> o <em>"Ocultate si ya hay una tienda seleccionada"</em>.
          </div>
          
          {/* Mostrar Cuando */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3 border border-slate-100 rounded shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mostrar Componente...</label>
              <select 
                value={!component.show_when ? "always" : (component.show_when.present === false ? "not_present" : (component.show_when.present === true ? "present" : "value"))}
                onChange={(e) => {
                  const val = e.target.value;
                  const p = component.show_when?.param || "";
                  if (val === "always") updateComponent(component.id, { show_when: undefined });
                  else if (val === "present") updateComponent(component.id, { show_when: { param: p, present: true } });
                  else if (val === "not_present") updateComponent(component.id, { show_when: { param: p, present: false } });
                  else if (val === "value") updateComponent(component.id, { show_when: { param: p, value: "" } });
                }}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm"
              >
                <option value="always">Siempre (Por defecto)</option>
                <option value="present">Si existe un parametro</option>
                <option value="not_present">Si NO existe un parametro</option>
                <option value="value">Si tiene valor exacto</option>
              </select>
            </div>
            
            {component.show_when && (
               <>
                 <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Parametro (nav_param)</label>
                   <input 
                     value={component.show_when.param || ""} 
                     onChange={(e) => updateComponent(component.id, { show_when: { value: component.show_when?.value, present: component.show_when?.present, param: e.target.value } })}
                     placeholder="Ej: pilar" 
                     className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono" 
                   />
                 </div>
                 {component.show_when.value !== undefined && (
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Exacto Esperado</label>
                     <input 
                       value={component.show_when.value as string || ""} 
                       onChange={(e) => updateComponent(component.id, { show_when: { param: component.show_when?.param || "", ...component.show_when, value: e.target.value } })}
                       placeholder="Ej: av" 
                       className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono" 
                     />
                   </div>
                 )}
               </>
            )}
          </div>

          {/* Ocultar Cuando */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3 border border-slate-100 rounded shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ocultar Componente...</label>
              <select 
                value={!component.hide_when ? "never" : (component.hide_when.present === false ? "not_present" : (component.hide_when.present === true ? "present" : "value"))}
                onChange={(e) => {
                  const val = e.target.value;
                  const p = component.hide_when?.param || "";
                  if (val === "never") updateComponent(component.id, { hide_when: undefined });
                  else if (val === "present") updateComponent(component.id, { hide_when: { param: p, present: true } });
                  else if (val === "not_present") updateComponent(component.id, { hide_when: { param: p, present: false } });
                  else if (val === "value") updateComponent(component.id, { hide_when: { param: p, value: "" } });
                }}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm"
              >
                <option value="never">Nunca (Por defecto)</option>
                <option value="present">Si existe un parametro</option>
                <option value="not_present">Si NO existe un parametro</option>
                <option value="value">Si tiene valor exacto</option>
              </select>
            </div>
            
            {component.hide_when && (
               <>
                 <div>
                   <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Parametro</label>
                   <input 
                     value={component.hide_when.param || ""} 
                     onChange={(e) => updateComponent(component.id, { hide_when: { value: component.hide_when?.value, present: component.hide_when?.present, param: e.target.value } })}
                     placeholder="Ej: placeId" 
                     className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono" 
                   />
                 </div>
                 {component.hide_when.value !== undefined && (
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Exacto Esperado</label>
                     <input 
                       value={component.hide_when.value as string || ""} 
                       onChange={(e) => updateComponent(component.id, { hide_when: { param: component.hide_when?.param || "", ...component.hide_when, value: e.target.value } })}
                       placeholder="Ej: av" 
                       className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono" 
                     />
                   </div>
                 )}
               </>
            )}
          </div>

        </div>
      </div>

<div className="pt-4 border-t border-slate-100">
        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-indigo-600" /> Configuración Específica
        </h4>
        {renderSpecificConfig()}
      </div>
    </div>
  );
}
