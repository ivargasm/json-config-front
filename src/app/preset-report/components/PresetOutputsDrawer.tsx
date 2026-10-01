"use client";
import { useState, useMemo } from "react";
import { usePresetReportStore } from "../../store/presetReportStore";
import { X, Copy, Check, Download, FileCode, Database } from "lucide-react";
import { DATASET_TYPES, AVAILABLE_VARIABLES } from "../../lib/presetConstants";
import { toast } from "sonner";

export default function PresetOutputsDrawer({ onClose }: { onClose: () => void }) {
  const store = usePresetReportStore();
  const [tab, setTab] = useState<'json' | 'sql'>('json');
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [copiedMinified, setCopiedMinified] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  const { finalJson, finalSql } = useMemo(() => {
    // 1. Generate JSON
    const finalVariables = Object.entries(store.selectedVariables).map(([varName, alias]) => {
        const template = AVAILABLE_VARIABLES.find(v => v.var === varName);
        if (!template) return null;
        return {
            var: template.var,
            dsc: template.dsc,
            filterType: template.filterType,
            sql_include: template.sql_include.replace('{alias}', alias),
            sql_exclude: template.sql_exclude.replace('{alias}', alias),
        };
    }).filter(Boolean);

    const json = {
        columns: store.columns.map(c => {
            if (store.jsonType === 'groupBy') {
                return { name: c.name, dataType: c.dataType, select: c.select, alias: c.alias, agg: c.agg };
            }
            return { name: c.name, dataType: c.dataType };
        }),
        variables: finalVariables,
        sql: store.mainSql.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        type: DATASET_TYPES.find(t => t.id === store.selectedDatasetType) || {},
        preQuery: store.preQueries ? store.preQueries.split(';').map(q => q.trim()).filter(Boolean) : [],
        postQuery: store.postQueries ? store.postQueries.split(';').map(q => q.trim()).filter(Boolean) : [],
    };

    // 2. Generate SQL
    const locales = ['es', 'en', 'pt'];
    let sqlInserts = `--- Script de Internacionalización (i18n) ---\n\n`;
    let sqlValues = '';

    sqlInserts += `INSERT INTO stoiii_config.i18n (id, version, date_created, last_updated, code, locale, message) VALUES\n`
    store.columns.forEach(column => {
        locales.forEach(locale => {
            const code = column.name;
            const message = column.customMessage || column.originalName;
            const escapedMessage = message.replace(/'/g, "''");
            sqlValues += `(nextval('stoiii_config.seq_i18n'), 0, now(), now(), '${code}', '${locale}', '${escapedMessage}'),\n`;
        });
    });

    const sqlStr = store.columns.length > 0 ? `${sqlInserts}${sqlValues.slice(0, -2)};` : '-- Extrae columnas primero para generar este script.';

    return { finalJson: json, finalSql: sqlStr };
  }, [store]);

  const jsonStr = JSON.stringify(finalJson, null, 2);

  const handleCopyFormatted = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopiedFormatted(true);
    toast.success("JSON formateado copiado");
    setTimeout(() => setCopiedFormatted(false), 2000);
  };

  const handleCopyMinified = () => {
    navigator.clipboard.writeText(JSON.stringify(finalJson));
    setCopiedMinified(true);
    toast.success("JSON minificado copiado");
    setTimeout(() => setCopiedMinified(false), 2000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(finalSql);
    setCopiedSQL(true);
    toast.success("SQL copiado");
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  const handleDownload = () => {
    const text = tab === 'json' ? jsonStr : finalSql;
    const type = tab === 'json' ? 'application/json' : 'text/sql';
    const ext = tab === 'json' ? '.json' : '.sql';
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preset_config${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Descarga iniciada");
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200] transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-[800px] bg-[#0f111a] shadow-2xl z-[210] flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#1a1d27] border-b border-slate-800">
          <div className="flex bg-[#0f111a] rounded-lg p-1 border border-slate-800">
            <button 
              onClick={() => setTab('json')} 
              className={`flex items-center gap-2 px-6 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'json' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <FileCode size={16} /> JSON (Config)
            </button>
            <button 
              onClick={() => setTab('sql')} 
              className={`flex items-center gap-2 px-6 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === 'sql' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Database size={16} /> SQL (i18n)
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"><X size={20} /></button>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
          <pre className={`font-mono text-sm leading-relaxed ${tab === 'json' ? 'text-indigo-300' : 'text-emerald-300'}`}>
            <code>{tab === 'json' ? jsonStr : finalSql}</code>
          </pre>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-[#1a1d27] border-t border-slate-800 flex justify-between items-center">
          <button onClick={handleDownload} className="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors flex items-center gap-2 border border-slate-700 rounded hover:bg-slate-800">
            <Download size={16} /> Descargar {tab === 'json' ? '.json' : '.sql'}
          </button>
          
          {tab === 'json' ? (
            <div className="flex gap-2">
              <button onClick={handleCopyMinified} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm border border-slate-700">
                {copiedMinified ? <><Check size={16} className="text-emerald-400"/> Copiado</> : <><FileCode size={16} /> Minificado</>}
              </button>
              <button onClick={handleCopyFormatted} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                {copiedFormatted ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Formateado</>}
              </button>
            </div>
          ) : (
            <button onClick={handleCopySQL} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
              {copiedSQL ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar Script SQL</>}
            </button>
          )}
        </div>

      </div>
    </>
  );
}