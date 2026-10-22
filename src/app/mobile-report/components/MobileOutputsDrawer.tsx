"use client";

import React, { useState, useMemo } from "react";
import { useMobileReportStore } from "../../store/mobileReportStore";
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Database, 
  Sparkles, 
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

interface MobileOutputsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_ICONS = ["fa-analytics", "fa-chart-line", "fa-store", "fa-tasks", "fa-file-invoice-dollar"];

export default function MobileOutputsDrawer({ isOpen, onClose }: MobileOutputsDrawerProps) {
  const { exportJSON, components } = useMobileReportStore();
  const [tab, setTab] = useState<'json' | 'sql'>('json');
  
  // SQL Configuration Fields
  const [reportKey, setReportKey] = useState("coamesa.place.ticket");
  const [sameDescription, setSameDescription] = useState(true);
  const [customDescription, setCustomDescription] = useState("");
  const [iconClass, setIconClass] = useState("fa-analytics");
  const [linkUrl, setLinkUrl] = useState(
    "https://webapp.storecheck.com/mobileReport/genericReport?roleId=$roleId&token=$token&placeId=$placeId&lang=$lang"
  );
  const [isActive, setIsActive] = useState(false);
  const [reportOrder, setReportOrder] = useState<string>("");
  const [includeI18nInserts, setIncludeI18nInserts] = useState(false);
  const [reportTitleLiteral, setReportTitleLiteral] = useState("Reporte Mobile");
  const [showSqlConfig, setShowSqlConfig] = useState(true);

  // Copy status
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [copiedMinified, setCopiedMinified] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Generate clean i18n codes
  const cleanKey = reportKey.replace(/^mobile\.report\./i, "").trim() || "nuevo_reporte";
  const nameI18n = `mobile.report.${cleanKey}`;
  const descriptionI18n = sameDescription 
    ? nameI18n 
    : (customDescription.startsWith("mobile.report.") 
        ? customDescription 
        : `mobile.report.${customDescription.trim() || cleanKey}`);

  // Raw JSON
  const rawJson = useMemo(() => exportJSON(), [exportJSON, components]);
  const formattedJsonStr = useMemo(() => JSON.stringify(rawJson, null, 2), [rawJson]);
  const minifiedJsonStr = useMemo(() => JSON.stringify(rawJson), [rawJson]);

  // Generate SQL Script
  const finalSql = useMemo(() => {
    // Escape single quotes for PostgreSQL
    const escapedJson = minifiedJsonStr.replace(/'/g, "''");
    const orderValue = reportOrder.trim() ? Number(reportOrder.trim()) : "null";

    let sql = `-- ====================================================================\n`;
    sql += `-- SCRIPT DE REGISTRO DE REPORTE MOBILE (stoiii_config.mobile_reports)\n`;
    sql += `-- Generado automáticamente por Mobile Report Builder\n`;
    sql += `-- ====================================================================\n\n`;

    sql += `INSERT INTO stoiii_config.mobile_reports (\n`;
    sql += `    id,\n`;
    sql += `    "version",\n`;
    sql += `    date_created,\n`;
    sql += `    last_updated,\n`;
    sql += `    name_i18n,\n`;
    sql += `    description_i18n,\n`;
    sql += `    icon_class,\n`;
    sql += `    link,\n`;
    sql += `    active,\n`;
    sql += `    report_order,\n`;
    sql += `    definition\n`;
    sql += `) VALUES (\n`;
    sql += `    nextval('stoiii_config.seq_mobile_reports'),\n`;
    sql += `    0,\n`;
    sql += `    now(),\n`;
    sql += `    now(),\n`;
    sql += `    '${nameI18n}',\n`;
    sql += `    '${descriptionI18n}',\n`;
    sql += `    '${iconClass.trim() || "fa-analytics"}',\n`;
    sql += `    '${linkUrl.trim()}',\n`;
    sql += `    ${isActive ? "true" : "false"},\n`;
    sql += `    ${orderValue},\n`;
    sql += `    '${escapedJson}'::json\n`;
    sql += `);\n`;

    if (includeI18nInserts) {
      const escapedTitle = reportTitleLiteral.replace(/'/g, "''");
      sql += `\n-- ====================================================================\n`;
      sql += `-- TEXTOS DE INTERNACIONALIZACIÓN (stoiii_config.i18n)\n`;
      sql += `-- ====================================================================\n\n`;
      sql += `INSERT INTO stoiii_config.i18n (id, version, date_created, last_updated, code, locale, message) VALUES\n`;
      sql += `    (nextval('stoiii_config.seq_i18n'), 0, now(), now(), '${nameI18n}', 'es', '${escapedTitle}'),\n`;
      sql += `    (nextval('stoiii_config.seq_i18n'), 0, now(), now(), '${nameI18n}', 'en', '${escapedTitle}'),\n`;
      sql += `    (nextval('stoiii_config.seq_i18n'), 0, now(), now(), '${nameI18n}', 'pt', '${escapedTitle}');\n`;
    }

    return sql;
  }, [
    minifiedJsonStr, 
    nameI18n, 
    descriptionI18n, 
    iconClass, 
    linkUrl, 
    isActive, 
    reportOrder, 
    includeI18nInserts, 
    reportTitleLiteral
  ]);

  if (!isOpen) return null;

  const handleCopyFormatted = () => {
    navigator.clipboard.writeText(formattedJsonStr);
    setCopiedFormatted(true);
    toast.success("JSON formateado copiado al portapapeles");
    setTimeout(() => setCopiedFormatted(false), 2000);
  };

  const handleCopyMinified = () => {
    navigator.clipboard.writeText(minifiedJsonStr);
    setCopiedMinified(true);
    toast.success("JSON minificado copiado al portapapeles");
    setTimeout(() => setCopiedMinified(false), 2000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(finalSql);
    setCopiedSQL(true);
    toast.success("Script SQL INSERT copiado con JSON escapado");
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  const handleDownload = () => {
    const isJson = tab === 'json';
    const text = isJson ? formattedJsonStr : finalSql;
    const type = isJson ? 'application/json' : 'text/sql';
    const ext = isJson ? '.json' : '.sql';
    const filename = isJson ? `mobile_report_${cleanKey}${ext}` : `insert_mobile_report_${cleanKey}${ext}`;

    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Descarga de ${filename} iniciada`);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[200] transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[880px] bg-[#0f111a] shadow-2xl z-[210] flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Header con Pestañas */}
        <div className="flex justify-between items-center px-6 py-3.5 bg-[#1a1d27] border-b border-slate-800">
          <div className="flex bg-[#0f111a] rounded-lg p-1 border border-slate-800">
            <button 
              type="button"
              onClick={() => setTab('json')} 
              className={`flex items-center gap-2 px-5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                tab === 'json' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode size={15} /> JSON Compilado
            </button>
            <button 
              type="button"
              onClick={() => setTab('sql')} 
              className={`flex items-center gap-2 px-5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                tab === 'sql' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Database size={15} /> INSERT SQL (mobile_reports)
            </button>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Panel de Configuración de Parámetros del INSERT (Solo visible en pestaña SQL) */}
        {tab === 'sql' && (
          <div className="bg-[#141724] border-b border-slate-800 text-slate-200 px-6 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Sparkles size={14} />
                <span>Parámetros del INSERT SQL</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowSqlConfig(!showSqlConfig)} 
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
              >
                <span>{showSqlConfig ? "Ocultar opciones" : "Editar parámetros"}</span>
                {showSqlConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showSqlConfig && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-in fade-in duration-150">
                {/* i18n Name */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Clave del Reporte (<code className="text-emerald-400 font-mono">name_i18n</code>)
                  </label>
                  <div className="flex items-center bg-[#0a0a0f] border border-slate-700 rounded-md overflow-hidden focus-within:border-emerald-500">
                    <span className="bg-slate-800/80 text-slate-400 px-2.5 py-1.5 text-xs font-mono shrink-0 select-none border-r border-slate-700">
                      mobile.report.
                    </span>
                    <input 
                      type="text"
                      value={cleanKey}
                      onChange={(e) => setReportKey(e.target.value)}
                      placeholder="ej: coamesa.place.ticket"
                      className="w-full bg-transparent text-emerald-300 px-2.5 py-1.5 text-xs font-mono outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                    Código final: <span className="font-mono text-slate-400">{nameI18n}</span>
                  </span>
                </div>

                {/* i18n Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">
                      Descripción (<code className="text-emerald-400 font-mono">description_i18n</code>)
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={sameDescription} 
                        onChange={(e) => setSameDescription(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-0" 
                      />
                      <span>Mismo que nombre</span>
                    </label>
                  </div>
                  {!sameDescription ? (
                    <input 
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="ej: coamesa.place.ticket"
                      className="w-full bg-[#0a0a0f] border border-slate-700 rounded-md text-emerald-300 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <div className="bg-[#0a0a0f]/60 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-500 truncate">
                      {descriptionI18n}
                    </div>
                  )}
                </div>

                {/* Icon Class */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Clase de Ícono (<code className="text-emerald-400 font-mono">icon_class</code>)
                  </label>
                  <input 
                    type="text"
                    value={iconClass}
                    onChange={(e) => setIconClass(e.target.value)}
                    placeholder="fa-analytics"
                    className="w-full bg-[#0a0a0f] border border-slate-700 rounded-md text-emerald-300 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-500">Comunes:</span>
                    {COMMON_ICONS.map((ic) => (
                      <button 
                        key={ic}
                        type="button" 
                        onClick={() => setIconClass(ic)}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                          iconClass === ic 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estado y Orden */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Estado (<code className="text-emerald-400 font-mono">active</code>)</label>
                    <select 
                      value={isActive ? "true" : "false"}
                      onChange={(e) => setIsActive(e.target.value === "true")}
                      className="w-full bg-[#0a0a0f] border border-slate-700 rounded-md text-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="false">false (Inactivo)</option>
                      <option value="true">true (Activo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Orden (<code className="text-emerald-400 font-mono">report_order</code>)</label>
                    <input 
                      type="number"
                      value={reportOrder}
                      onChange={(e) => setReportOrder(e.target.value)}
                      placeholder="null"
                      className="w-full bg-[#0a0a0f] border border-slate-700 rounded-md text-slate-200 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Link URL */}
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">
                    Enlace Móvil (<code className="text-emerald-400 font-mono">link</code>)
                  </label>
                  <input 
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-slate-700 rounded-md text-slate-300 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Toggle i18n records */}
                <div className="md:col-span-2 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={includeI18nInserts} 
                      onChange={(e) => setIncludeI18nInserts(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-0" 
                    />
                    <span>Incluir INSERT en catálogo de traducciones (<code className="text-indigo-400">stoiii_config.i18n</code>)</span>
                  </label>

                  {includeI18nInserts && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">Título visible:</span>
                      <input 
                        type="text" 
                        value={reportTitleLiteral} 
                        onChange={(e) => setReportTitleLiteral(e.target.value)}
                        placeholder="Título en catálogo..."
                        className="bg-[#0a0a0f] border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 outline-none w-48"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Banner sobre el escape del JSON */}
        {tab === 'sql' && (
          <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-900/50 flex items-center gap-2 text-[11px] text-emerald-300">
            <Info size={13} className="text-emerald-400 shrink-0" />
            <span>
              <strong>JSON escapado automáticamente:</strong> Las comillas simples de las consultas y textos del JSON se han reemplazado por <code className="bg-emerald-900/50 px-1 py-0.5 rounded text-white font-mono">''</code> para que PostgreSQL lo inserte sin error de sintaxis en <code className="font-mono text-emerald-200">definition</code>.
            </span>
          </div>
        )}

        {/* Editor / Previsualización */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
          <pre className={`font-mono text-xs leading-relaxed whitespace-pre-wrap select-all ${
            tab === 'json' ? 'text-indigo-300' : 'text-emerald-300'
          }`}>
            <code>{tab === 'json' ? formattedJsonStr : finalSql}</code>
          </pre>
        </div>

        {/* Footer con Acciones */}
        <div className="px-6 py-4 bg-[#1a1d27] border-t border-slate-800 flex justify-between items-center">
          <button 
            type="button"
            onClick={handleDownload} 
            className="text-slate-400 hover:text-white px-3.5 py-1.5 text-xs transition-colors flex items-center gap-2 border border-slate-700 rounded-md hover:bg-slate-800"
          >
            <Download size={14} /> Descargar {tab === 'json' ? '.json' : '.sql'}
          </button>
          
          {tab === 'json' ? (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleCopyMinified} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm border border-slate-700"
              >
                {copiedMinified ? <><Check size={14} className="text-emerald-400"/> Copiado</> : <><FileCode size={14} /> Minificado</>}
              </button>
              <button 
                type="button"
                onClick={handleCopyFormatted} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {copiedFormatted ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Formateado</>}
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={handleCopySQL} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {copiedSQL ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar INSERT SQL</>}
            </button>
          )}
        </div>

      </div>
    </>
  );
}
