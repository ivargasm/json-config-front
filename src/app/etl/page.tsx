"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoutes";
import TopNavbar from "../components/TopNavbar";
import { toast } from "sonner";
import { Copy, Sparkles, FileType, Code2, Bot, Play, Save, Check, UploadCloud, X, Plus, Trash2, Download } from "lucide-react";
import Editor from '@monaco-editor/react';
import { generateEtlScript, previewEtlFile, refineEtlScript } from "../lib/api";

type ColumnConfig = {
  original: string;
  rename: string;
  required: boolean;
};

type KpiConfig = {
  id: string;
  kpi: string;
  file_prefix: string;
  extension: string;
  skiprows: number;
  separator: string;
  encoding: string;
  sheet_name: string;
  date_format_example: string;
  has_headers: boolean;
  manual_headers: string;
  extract_date_from_filename: boolean;
  filename_date_regex: string;
  clean_fields: string[];
  selectedCols: ColumnConfig[];
  rawPreviewCols: string[];
  rawPreviewData: any[];
  previewCols: string[];
  previewData: any[];
};

const DATE_FORMAT_PATTERNS: Record<string, string> = {
  'yyyymmdd': '\\d{8}',
  'yyyy-mm-dd': '\\d{4}-\\d{2}-\\d{2}',
  'yyyy/mm/dd': '\\d{4}/\\d{2}/\\d{2}',
  'dd-mm-yyyy': '\\d{2}-\\d{2}-\\d{4}',
  'ddmmyyyy': '\\d{8}',
  'yymmdd': '\\d{6}',
};

const DATE_FORMAT_OPTIONS = [
  { value: "", label: "-- Selecciona el formato --" },
  { value: "dd-mm-yyyy", label: "dd-mm-yyyy (ej: 15-03-2023)" },
  { value: "mm-dd-yyyy", label: "mm-dd-yyyy (ej: 03-15-2023)" },
  { value: "yyyy-mm-dd", label: "yyyy-mm-dd (ej: 2023-03-15)" },
  { value: "yyyy-dd-mm", label: "yyyy-dd-mm (ej: 2023-15-03)" },
  { value: "dd/mm/yyyy", label: "dd/mm/yyyy (ej: 15/03/2023)" },
  { value: "mm/dd/yyyy", label: "mm/dd/yyyy (ej: 03/15/2023)" },
  { value: "yyyy/mm/dd", label: "yyyy/mm/dd (ej: 2023/03/15)" },
  { value: "yyyy/dd/mm", label: "yyyy/dd/mm (ej: 2023/15/03)" },
  { value: "dd.mm.yyyy", label: "dd.mm.yyyy (ej: 15.03.2023)" },
  { value: "mm.dd.yyyy", label: "mm.dd.yyyy (ej: 03.15.2023)" },
  { value: "yyyy.mm.dd", label: "yyyy.mm.dd (ej: 2023.03.15)" },
  { value: "dd mm yyyy", label: "dd mm yyyy (ej: 15 03 2023)" },
  { value: "mm dd yyyy", label: "mm dd yyyy (ej: 03 15 2023)" },
  { value: "yyyy mm dd", label: "yyyy mm dd (ej: 2023 03 15)" },
  { value: "dd_mm_yyyy", label: "dd_mm_yyyy (ej: 15_03_2023)" },
  { value: "mm_dd_yyyy", label: "mm_dd_yyyy (ej: 03_15_2023)" },
  { value: "yyyy_mm_dd", label: "yyyy_mm_dd (ej: 2023_03_15)" },
  { value: "dd-mm-yy", label: "dd-mm-yy (ej: 15-03-23)" },
  { value: "mm-dd-yy", label: "mm-dd-yy (ej: 03-15-23)" },
  { value: "yy-mm-dd", label: "yy-mm-dd (ej: 23-03-15)" },
  { value: "dd/mm/yy", label: "dd/mm/yy (ej: 15/03/23)" },
  { value: "mm/dd/yy", label: "mm/dd/yy (ej: 03/15/23)" },
  { value: "yy/mm/dd", label: "yy/mm/dd (ej: 23/03/15)" },
  { value: "yyyymmdd", label: "yyyymmdd (ej: 20230315)" },
  { value: "ddmmyyyy", label: "ddmmyyyy (ej: 15032023)" },
  { value: "mmddyyyy", label: "mmddyyyy (ej: 03152023)" },
  { value: "yymmdd", label: "yymmdd (ej: 230315)" },
  { value: "ddmmyy", label: "ddmmyy (ej: 150323)" },
  { value: "mmddyy", label: "mmddyy (ej: 031523)" },
];

const KPI_LIST = ['sellout', 'stock_oh', 'stock_tuberia', 'fillrate', 'forecast', 'sellin'];

export default function EtlGeneratorPage() {
  const [mode, setMode] = useState<"config" | "copilot">("config");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  
  // Global Database Config
  const [dataTypeId, setDataTypeId] = useState("16");
  const [dbEnabled, setDbEnabled] = useState(false);
  const [dbAurora, setDbAurora] = useState(false);
  const [dbRedshift, setDbRedshift] = useState(false);
  
  const [kpis, setKpis] = useState<KpiConfig[]>([
    {
      id: Date.now().toString(),
      kpi: "sellout",
      file_prefix: "",
      extension: ".xlsx",
      skiprows: 0,
      separator: ",",
      encoding: "utf-8",
      sheet_name: "",
      date_format_example: "yyyymmdd",
      has_headers: true,
      manual_headers: "",
      extract_date_from_filename: false,
      filename_date_regex: "(\\\\d{8}).+?",
      clean_fields: [],
      selectedCols: [],
      rawPreviewCols: [],
      rawPreviewData: [],
      previewCols: [],
      previewData: []
    }
  ]);
  const [activeKpiId, setActiveKpiId] = useState<string>(kpis[0].id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: "user" | "assistant", text: string}[]>([
    {role: "assistant", text: "¡Hola! He generado el script. ¿Necesitas que agregue lógica extra de Pandas?"}
  ]);
  const [isRefining, setIsRefining] = useState(false);

  // Regex Builder States (per active KPI)
  const [rxFormat, setRxFormat] = useState('yyyymmdd');
  const [rxPos, setRxPos] = useState<'inicio'|'medio'|'fin'>('medio');
  const [rxBefore, setRxBefore] = useState<'fijo'|'var'>('fijo');
  const [rxBeforeText, setRxBeforeText] = useState('');
  const [rxAfter, setRxAfter] = useState<'nada'|'fijo'|'var'>('var');
  const [rxAfterText, setRxAfterText] = useState('');
  const [sampleFilename, setSampleFilename] = useState('');

  const updateKpi = (id: string, field: keyof KpiConfig, value: any) => {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const addKpi = () => {
    const newKpi: KpiConfig = {
      id: Date.now().toString(),
      kpi: "stock_oh",
      file_prefix: "",
      extension: ".csv",
      skiprows: 0,
      separator: ",",
      encoding: "utf-8",
      sheet_name: "",
      date_format_example: "yyyymmdd",
      has_headers: true,
      manual_headers: "",
      extract_date_from_filename: false,
      filename_date_regex: "(\\\\d{8}).+?",
      clean_fields: [],
      selectedCols: [],
      rawPreviewCols: [],
      rawPreviewData: [],
      previewCols: [],
      previewData: []
    };
    setKpis([...kpis, newKpi]);
    setActiveKpiId(newKpi.id);
  };

  const removeKpi = (id: string) => {
    if (kpis.length === 1) return toast.error("Debe haber al menos 1 KPI");
    const filtered = kpis.filter(k => k.id !== id);
    setKpis(filtered);
    if (activeKpiId === id) setActiveKpiId(filtered[0].id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, kpiId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    updateKpi(kpiId, 'rawPreviewCols', []);
    updateKpi(kpiId, 'rawPreviewData', []);
    updateKpi(kpiId, 'previewCols', []);
    updateKpi(kpiId, 'previewData', []);
    
    try {
      const activeKpi = kpis.find(k => k.id === kpiId);
      const sep = activeKpi?.separator || ",";
      const data = await previewEtlFile(backendUrl, file, sep);
      setKpis(prev => prev.map(k => {
        if (k.id !== kpiId) return k;
        return {
          ...k,
          rawPreviewCols: data.columns,
          rawPreviewData: data.sample,
          previewCols: data.columns,
          previewData: data.sample,
          selectedCols: [],
          has_headers: true
        };
      }));
      toast.success(`Archivo para ${kpis.find(k => k.id === kpiId)?.kpi} cargado correctamente.`);
    } catch (err: any) {
      toast.error(err.message || "Error al leer el archivo");
    }
  };

  const toggleHasHeaders = (kpiId: string, checked: boolean) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id !== kpiId) return kpi;
      if (checked) {
        // Restore raw backend data if headers are enabled again
        return {
          ...kpi,
          has_headers: true,
          previewCols: kpi.rawPreviewCols,
          previewData: kpi.rawPreviewData,
          selectedCols: []
        };
      }
      return { ...kpi, has_headers: false };
    }));
  };

  const applyManualHeaders = (kpiId: string) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id !== kpiId) return kpi;
      const newCols = kpi.manual_headers.split(',').map(c => c.trim()).filter(c => c);
      if (newCols.length === 0) {
        toast.error("Ingresa al menos un encabezado");
        return kpi;
      }

      // Map existing raw data rows to the new column names
      const newData = kpi.rawPreviewData.map(row => {
        const newRow: any = {};
        kpi.rawPreviewCols.forEach((oldCol, i) => {
          const newColName = newCols[i] || oldCol; // fallback if not enough headers provided
          newRow[newColName] = row[oldCol];
        });
        return newRow;
      });

      // Also add the original backend headers as the very first data row
      const headerRowAsData: any = {};
      kpi.rawPreviewCols.forEach((oldCol, i) => {
        const newColName = newCols[i] || oldCol;
        headerRowAsData[newColName] = oldCol;
      });

      toast.success("Encabezados manuales aplicados. Por favor, selecciona las columnas a utilizar.");
      
      return {
        ...kpi,
        previewCols: newCols,
        previewData: [headerRowAsData, ...newData],
        selectedCols: []
      };
    }));
  };

  const toggleColumnSelection = (kpiId: string, col: string) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id !== kpiId) return kpi;
      const exists = kpi.selectedCols.find(c => c.original === col);
      if (exists) {
        return { ...kpi, selectedCols: kpi.selectedCols.filter(c => c.original !== col) };
      } else {
        return { ...kpi, selectedCols: [...kpi.selectedCols, { original: col, rename: col, required: true }] };
      }
    }));
  };

  const updateColumnConfig = (kpiId: string, original: string, field: keyof ColumnConfig, value: any) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id !== kpiId) return kpi;
      return {
        ...kpi,
        selectedCols: kpi.selectedCols.map(c => c.original === original ? { ...c, [field]: value } : c)
      };
    }));
  };

  const addCleanField = (kpiId: string, fieldName: string) => {
    if(!fieldName) return;
    setKpis(prev => prev.map(kpi => {
      if (kpi.id !== kpiId) return kpi;
      if (kpi.clean_fields.includes(fieldName)) return kpi;
      return { ...kpi, clean_fields: [...kpi.clean_fields, fieldName] };
    }));
  };

  const removeCleanField = (kpiId: string, fieldName: string) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id !== kpiId) return kpi;
      return { ...kpi, clean_fields: kpi.clean_fields.filter(f => f !== fieldName) };
    }));
  };

  useEffect(() => {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const p = DATE_FORMAT_PATTERNS[rxFormat] || '\\d{8}';
    let before = '';
    
    if (rxPos === 'inicio') {
        before = '^';
    } else {
        if (rxBefore === 'fijo' && rxBeforeText) before = escape(rxBeforeText);
        else before = '.*?';
    }

    let after = '';
    if (rxPos === 'fin') {
        after = '\\.(csv|xlsx|xls|txt)$';
    } else {
        if (rxAfter === 'nada') {
            after = '\\.(csv|xlsx|xls|txt)$';
        } else if (rxAfter === 'fijo' && rxAfterText) {
            after = escape(rxAfterText) + '.*?\\.(csv|xlsx|xls|txt)$';
        } else {
            after = '.+?\\.(csv|xlsx|xls|txt)$';
        }
    }

    const regex = `${before}(${p})${after}`;
    updateKpi(activeKpiId, 'filename_date_regex', regex);
  }, [rxFormat, rxPos, rxBefore, rxBeforeText, rxAfter, rxAfterText, activeKpiId]);


  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pythonCompatibleKpis = kpis.map(kpi => {
        const renameMap: Record<string, string> = {};
        const requiredCols: string[] = [];
        
        kpi.selectedCols.forEach((col) => {
          if (col.rename !== col.original) {
            renameMap[col.original] = col.rename;
          }
          if (col.required) {
            requiredCols.push(col.original);
          }
        });

        const customHeaders = !kpi.has_headers ? kpi.manual_headers.split(',').map(s=>s.trim()).filter(s=>s) : [];

        return {
          kpi: kpi.kpi,
          file_prefix: kpi.file_prefix,
          extension: kpi.extension,
          skiprows: kpi.skiprows,
          separator: kpi.separator,
          sheet_name: kpi.sheet_name || "Hoja1",
          encoding: kpi.encoding,
          has_headers: kpi.has_headers,
          manual_headers: customHeaders.length > 0 ? customHeaders : null,
          original_required_columns: requiredCols,
          rename_map: renameMap,
          date_format_example: kpi.date_format_example,
          clean_fields: kpi.clean_fields,
          extract_date_from_filename: kpi.extract_date_from_filename,
          filename_date_regex: kpi.filename_date_regex
        };
      });

      const configPayload = {
        data_type_id: dataTypeId,
        database_config: { enabled: dbEnabled, aurora: dbAurora, redshift: dbRedshift },
        kpis: pythonCompatibleKpis
      };

      const data = await generateEtlScript(backendUrl, configPayload);
      setGeneratedScript(data.code);
      setMode("copilot");
      toast.success("Script base generado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error en el servidor");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!chatMessage.trim() || !generatedScript || isRefining) return;
    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setIsRefining(true);
    try {
      const result = await refineEtlScript(backendUrl, generatedScript, userMsg);
      setGeneratedScript(result.code);
      setChatHistory(prev => [...prev, { role: "assistant", text: result.explanation }]);
      toast.success("Script actualizado");
    } catch (error: any) {
      toast.error(error.message);
      setChatHistory(prev => [...prev, { role: "assistant", text: "❌ Error: " + error.message }]);
    } finally {
      setIsRefining(false);
    }
  };
  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadScript = () => {
    if (!generatedScript) return;
    const blob = new Blob([generatedScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'etl_script.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Script descargado");
  };

  const activeKpi = kpis.find(k => k.id === activeKpiId) || kpis[0];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <TopNavbar />
        
        <main className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col gap-6 mt-4">
          
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Asistente ETL
            </h2>
            <div className="flex bg-slate-200/60 p-1 rounded-lg w-max mt-4 mb-2">
              <button onClick={() => setMode("config")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === "config" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><FileType size={16}/> Configuración Base</button>
              <button onClick={() => { if(generatedScript) setMode("copilot"); else toast.error("Primero genera el script base") }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === "copilot" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Bot size={16}/> Copiloto de Código</button>
            </div>
          </div>

          {mode === "config" ? (
            <div className="flex flex-col gap-4">
              
              <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 flex flex-col gap-6">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">1. Configuración General (Database)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Data Type ID</label>
                    <input type="text" value={dataTypeId} onChange={e => setDataTypeId(e.target.value)} className="w-full max-w-xs border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4">Configuraciones Adicionales</h4>
                    <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={dbEnabled} onChange={(e) => setDbEnabled(e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${dbEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${dbEnabled ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-sm font-bold text-slate-700">Agregar conexión a base de datos</span>
                    </label>

                    {dbEnabled && (
                      <div className="ml-10 border-l-2 border-indigo-200 pl-4 flex flex-col gap-3">
                        <p className="text-xs text-slate-500 font-medium mb-1">Selecciona las bases de datos requeridas:</p>
                        
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={dbAurora} onChange={(e) => setDbAurora(e.target.checked)} />
                            <div className={`block w-8 h-5 rounded-full transition-colors ${dbAurora ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${dbAurora ? 'translate-x-3' : ''}`}></div>
                          </div>
                          <span className="text-sm font-medium text-slate-700">Aurora</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={dbRedshift} onChange={(e) => setDbRedshift(e.target.checked)} />
                            <div className={`block w-8 h-5 rounded-full transition-colors ${dbRedshift ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${dbRedshift ? 'translate-x-3' : ''}`}></div>
                          </div>
                          <span className="text-sm font-medium text-slate-700">Redshift</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TABS DE KPIs */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto">
                {kpis.map((kpi, idx) => (
                  <button key={kpi.id} onClick={() => setActiveKpiId(kpi.id)} className={`px-4 py-2 rounded-t-lg font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeKpiId === kpi.id ? "bg-indigo-50 text-indigo-700 border-indigo-600" : "bg-white text-slate-500 hover:bg-slate-50 border-transparent"}`}>
                    KPI {idx+1}: {kpi.kpi}
                  </button>
                ))}
                <button onClick={addKpi} className="px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-t-lg font-medium flex items-center gap-1 whitespace-nowrap"><Plus size={16}/> Agregar KPI</button>
              </div>

              {/* CONFIGURACION DEL KPI ACTIVO */}
              <div className="bg-white shadow-sm rounded-b-xl rounded-tr-xl border border-slate-200 p-8 flex flex-col gap-8 -mt-4 z-10 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-semibold text-slate-800">Parámetros del Origen ({activeKpi.kpi})</h3>
                  <button onClick={() => removeKpi(activeKpi.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium"><Trash2 size={16}/> Eliminar KPI</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">KPI Destino</label>
                    <select value={activeKpi.kpi} onChange={e => updateKpi(activeKpi.id, 'kpi', e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white">
                      {KPI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prefijo del Archivo</label>
                    <input type="text" value={activeKpi.file_prefix} onChange={e => updateKpi(activeKpi.id, 'file_prefix', e.target.value)} placeholder="Ej: sellout_mensual" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Extensión</label>
                    <select value={activeKpi.extension} onChange={e => updateKpi(activeKpi.id, 'extension', e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white">
                      <option value=".xlsx">Excel (.xlsx)</option>
                      <option value=".csv">CSV (.csv)</option>
                      <option value=".txt">Texto (.txt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filas a saltar (solo excel)</label>
                    <input type="number" value={activeKpi.skiprows} onChange={e => updateKpi(activeKpi.id, 'skiprows', parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Separador</label>
                    <input type="text" value={activeKpi.separator} onChange={e => updateKpi(activeKpi.id, 'separator', e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Codificación</label>
                    <input type="text" value={activeKpi.encoding} onChange={e => updateKpi(activeKpi.id, 'encoding', e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de la pestaña (Excel)</label>
                    <input type="text" value={activeKpi.sheet_name} onChange={e => updateKpi(activeKpi.id, 'sheet_name', e.target.value)} placeholder="Ej: Hoja1" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Formato de Fecha</label>
                    <select value={activeKpi.date_format_example} onChange={e => updateKpi(activeKpi.id, 'date_format_example', e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white">
                      {DATE_FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Regex Builder para Extraer fecha del nombre del archivo */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={activeKpi.extract_date_from_filename} onChange={(e) => updateKpi(activeKpi.id, 'extract_date_from_filename', e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${activeKpi.extract_date_from_filename ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${activeKpi.extract_date_from_filename ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700">Extraer fecha del nombre del archivo</span>
                  </label>

                  {activeKpi.extract_date_from_filename && (
                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 mb-3">1️⃣ ¿En qué formato aparece la fecha en el nombre?</p>
                        <div className="flex flex-wrap gap-2">
                          {[{val:'yyyymmdd',l:'YYYYMMDD'},{val:'yyyy-mm-dd',l:'YYYY-MM-DD'},{val:'yyyy/mm/dd',l:'YYYY/MM/DD'},{val:'dd-mm-yyyy',l:'DD-MM-YYYY'},{val:'ddmmyyyy',l:'DDMMYYYY'},{val:'yymmdd',l:'YYMMDD'}].map(o => (
                            <button key={o.val} onClick={()=>setRxFormat(o.val)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${rxFormat===o.val ? 'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-300'}`}>{o.l}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 mb-3">2️⃣ ¿Dónde aparece la fecha dentro del nombre?</p>
                        <div className="flex flex-wrap gap-2">
                          {[{val:'inicio',l:'Al inicio'},{val:'medio',l:'En medio'},{val:'fin',l:'Al final'}].map(o => (
                            <button key={o.val} onClick={()=>setRxPos(o.val as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${rxPos===o.val ? 'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-300'}`}>{o.l}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <p className="text-sm font-semibold text-slate-800 mb-3">3️⃣ ¿Qué hay antes de la fecha?</p>
                           <select value={rxBefore} onChange={e=>setRxBefore(e.target.value as any)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-white mb-2" disabled={rxPos === 'inicio'}><option value="fijo">Texto fijo</option><option value="var">Texto variable</option></select>
                           {rxBefore === 'fijo' && rxPos !== 'inicio' && (
                             <input type="text" value={rxBeforeText} onChange={e => setRxBeforeText(e.target.value)} placeholder="Texto fijo antes de la fecha" className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-white"/>
                           )}
                         </div>
                         <div>
                           <p className="text-sm font-semibold text-slate-800 mb-3">4️⃣ ¿Qué hay después de la fecha?</p>
                           <select value={rxAfter} onChange={e=>setRxAfter(e.target.value as any)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-white mb-2" disabled={rxPos === 'fin'}><option value="nada">Nada</option><option value="fijo">Texto fijo</option><option value="var">Texto variable</option></select>
                           {rxAfter === 'fijo' && rxPos !== 'fin' && (
                             <input type="text" value={rxAfterText} onChange={e => setRxAfterText(e.target.value)} placeholder="Texto fijo después de la fecha" className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-white"/>
                           )}
                         </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200">
                         <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">🧪 Prueba con un nombre de archivo real</p>
                         <input type="text" value={sampleFilename} onChange={e => setSampleFilename(e.target.value)} placeholder="ej. ventas_20260604.csv" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white mb-3" />
                         
                         {sampleFilename && (
                           <div className={`p-3 rounded-md border text-sm font-medium ${(() => {
                              try {
                                const match = sampleFilename.match(new RegExp(activeKpi.filename_date_regex));
                                return match && match[1] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700';
                              } catch {
                                return 'bg-red-50 border-red-200 text-red-700';
                              }
                           })()}`}>
                              Resultado: {(() => {
                                try {
                                  const match = sampleFilename.match(new RegExp(activeKpi.filename_date_regex));
                                  return match && match[1] ? `✅ Fecha extraída: ${match[1]}` : '❌ Sin coincidencia';
                                } catch {
                                  return '❌ Regex inválida';
                                }
                              })()}
                           </div>
                         )}
                      </div>

                      <div className="bg-slate-100 p-3 rounded-md border border-slate-200 text-xs font-mono text-slate-600">
                        Patrón generado: {activeKpi.filename_date_regex}
                      </div>
                    </div>
                  )}
                </div>

                {/* Seccion 2: Carga de archivo y Mapeo */}
                <div className="bg-slate-800 text-white rounded-xl p-6 shadow-inner">
                  <h3 className="text-lg font-semibold mb-4 text-slate-100 flex items-center gap-2">
                    <UploadCloud size={20} className="text-indigo-400"/>
                    Columnas del Archivo y Mapeo
                  </h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sube un archivo de ejemplo para autodetectar columnas</label>
                    <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={(e) => handleFileUpload(e, activeKpi.id)} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer bg-slate-900 rounded-lg border border-slate-700" />
                  </div>

                  {activeKpi.rawPreviewCols && activeKpi.rawPreviewCols.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      
                      {/* Control de Encabezados Manuales */}
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={activeKpi.has_headers} onChange={(e) => toggleHasHeaders(activeKpi.id, e.target.checked)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${activeKpi.has_headers ? 'bg-indigo-600' : 'bg-slate-500'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${activeKpi.has_headers ? 'translate-x-4' : ''}`}></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-200">Este archivo tiene encabezados</span>
                        </label>

                        {!activeKpi.has_headers && (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <label className="block text-sm font-medium text-orange-400 mb-2">
                              Define los encabezados manualmente (separados por coma)
                            </label>
                            <textarea
                               value={activeKpi.manual_headers}
                               onChange={e => updateKpi(activeKpi.id, 'manual_headers', e.target.value)}
                               className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-indigo-500 resize-none"
                               rows={2}
                               placeholder="Columna1, Columna2, Columna3..."
                            />
                            <button
                               onClick={() => applyManualHeaders(activeKpi.id)}
                               className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                               Aplicar encabezados
                            </button>
                          </div>
                        )}
                      </div>


                      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-800 border-b border-slate-700">
                            <tr>{activeKpi.previewCols.map((col, idx) => <th key={idx} className="p-2 font-medium text-slate-300 border-r border-slate-700">{col}</th>)}</tr>
                          </thead>
                          <tbody>
                            {activeKpi.previewData.slice(0, 5).map((row, rowIdx) => (
                              <tr key={rowIdx} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                                {activeKpi.previewCols.map((col, colIdx) => <td key={colIdx} className="p-2 text-slate-400 border-r border-slate-800/50">{String(row[col] ?? '')}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-300 mb-3">Selecciona las columnas que deseas incluir:</p>
                        <div className="flex flex-wrap gap-2">
                          {activeKpi.previewCols.map(col => {
                            const isSelected = activeKpi.selectedCols.some(c => c.original === col);
                            return (
                              <button key={col} onClick={() => toggleColumnSelection(activeKpi.id, col)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'}`}>
                                {col}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {activeKpi.selectedCols.length > 0 && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pt-4 border-t border-slate-700">
                          
                          <div className="xl:col-span-5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3">Configuración de columnas seleccionadas</h4>
                            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-800 border-b border-slate-700 text-slate-400 text-xs">
                                  <tr><th className="p-3 text-left">COLUMNA</th><th className="p-3 text-center">TIPO</th><th className="p-3 text-right">ACCIÓN</th></tr>
                                </thead>
                                <tbody>
                                  {activeKpi.selectedCols.map(col => (
                                    <tr key={col.original} className="border-b border-slate-800/50">
                                      <td className="p-3 text-slate-300 font-mono text-[11px] truncate max-w-[120px]" title={col.original}>{col.original}</td>
                                      <td className="p-3 text-center text-[11px] text-indigo-300 font-medium">{col.required ? 'Requerida' : 'Opcional'}</td>
                                      <td className="p-3 text-right flex justify-end gap-3 text-[11px]">
                                        <button onClick={() => updateColumnConfig(activeKpi.id, col.original, 'required', !col.required)} className="text-amber-400 hover:text-amber-300">
                                          Hacer {col.required ? 'Opcional' : 'Requerida'}
                                        </button>
                                        <button onClick={() => toggleColumnSelection(activeKpi.id, col.original)} className="text-rose-400 hover:text-rose-300">Quitar</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="xl:col-span-4">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3">Renombrar columnas</h4>
                            <div className="space-y-3">
                              {activeKpi.selectedCols.map(col => (
                                <div key={col.original} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                                  <span className="text-slate-400 font-mono text-[10px] w-24 truncate block" title={col.original}>{col.original}</span>
                                  <input type="text" value={col.rename} onChange={e => updateColumnConfig(activeKpi.id, col.original, 'rename', e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 w-full" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="xl:col-span-3">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3">Campos a limpiar</h4>
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
                              <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const input = (e.target as HTMLFormElement).elements.namedItem('cleanInput') as HTMLInputElement;
                                  addCleanField(activeKpi.id, input.value.trim());
                                  input.value = '';
                                }} className="flex gap-2">
                                <input name="cleanInput" type="text" placeholder="Nombre (renombrado)" className="flex-1 w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-white outline-none" />
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded text-xs font-semibold">Agregar</button>
                              </form>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {activeKpi.clean_fields.map(field => (
                                  <span key={field} className="bg-indigo-900/50 text-indigo-200 px-2 py-1 rounded text-[10px] flex items-center gap-1 border border-indigo-700">
                                    {field}
                                    <button onClick={() => removeCleanField(activeKpi.id, field)} className="text-indigo-400 hover:text-white"><X size={10}/></button>
                                  </span>
                                ))}
                                {activeKpi.clean_fields.length === 0 && <p className="text-slate-500 text-xs italic">No hay campos agregados</p>}
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  <button onClick={addKpi} className="bg-emerald-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                    <Plus size={16} /> Agregar KPI
                  </button>
                  <button onClick={handleGenerate} disabled={isGenerating} className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {isGenerating ? "Generando..." : <><Play size={16} /> Generar Script Final</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 h-[600px]">
              <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-xl relative">
                  <div className="bg-[#1a1d27] border-b border-slate-800 px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3"><Code2 size={16} className="text-indigo-400" /><span className="text-slate-300 text-sm font-mono">etl_script.py</span></div>
                    <div className="flex items-center gap-4">
                      <button onClick={downloadScript} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs">
                        <Download size={14} /> Descargar
                      </button>
                      <button onClick={copyToClipboard} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs">
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <Editor
                      height="100%"
                      defaultLanguage="python"
                      theme="vs-dark"
                      value={generatedScript}
                      onChange={(value) => setGeneratedScript(value || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                      }}
                    />
                  </div>
                </div>

                <div className="w-full md:w-96 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="bg-emerald-50 px-4 py-4 border-b border-emerald-100 flex items-center gap-3">
                  <Bot className="text-emerald-600" size={20} />
                  <div><h3 className="text-emerald-900 font-semibold text-sm">Copiloto AI</h3><p className="text-emerald-600 text-xs">Pide ajustes al código base</p></div>
                </div>
                
                <div className="flex-1 p-4 overflow-auto bg-slate-50 flex flex-col gap-4">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border text-sm shadow-sm ${msg.role === "assistant" ? "bg-white border-slate-200 text-slate-700" : "bg-emerald-100 border-emerald-200 text-emerald-800 self-end"}`}>
                        {msg.text}
                      </div>
                    ))}
                    {isRefining && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-500 shadow-sm animate-pulse flex gap-2 items-center">
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                      </div>
                    )}
                  </div>

                <div className="p-4 bg-white border-t border-slate-200">
                  <textarea value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ej: Suma la columna 'ventas'..." className="w-full h-24 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-3" />
                  <button onClick={handleRefine} disabled={isRefining || !chatMessage.trim()} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    <Sparkles size={16} /> {isRefining ? "Refinando..." : "Refinar Código"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}





