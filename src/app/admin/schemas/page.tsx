"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import ProtectedRoute from "../../components/ProtectedRoutes";
import { fetchKnowledgeBase, saveKnowledgeBase } from "../../lib/api";
import { useAuthStore } from "../../store/Store";
import TopNavbar from "../../components/TopNavbar";
import {
  Database,
  Trash2,
  Plus,
  Upload,
  Save,
  ChevronDown,
  ChevronUp,
  FileCode,
  Zap,
  LayoutTemplate,
  Key,
  GitBranch,
  Filter,
  Layers,
  Download,
} from "lucide-react";

// Esquema Zod Enriquecido y Retrocompatible
const columnSchema = z.object({
  name: z.string().min(1, "Requerido"),
  type: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  sample_values_str: z.string().optional(),
}).passthrough();

const foreignKeySchema = z.object({
  columns_str: z.string().min(1, "Columna requerida"),
  references: z.string().min(1, "Referencia requerida"),
  note: z.string().optional(),
}).passthrough();

const indexSchema = z.object({
  columns_str: z.string().min(1, "Columnas requeridas"),
  unique: z.boolean().optional(),
}).passthrough();

const redshiftDistSchema = z.object({
  diststyle: z.string().optional(),
  distkey: z.string().optional(),
  sortkeys_str: z.string().optional(),
}).passthrough();

const tableSchema = z.object({
  schema: z.string().min(1, "Requerido"),
  table_name: z.string().min(1, "Requerido"),
  db_engine: z.string(),
  table_type: z.string().optional(),
  description: z.string().optional(),
  grain: z.string().optional(),
  primary_key_str: z.string().optional(),
  default_filters: z.string().optional(),
  foreign_keys: z.array(foreignKeySchema).optional(),
  indexes: z.array(indexSchema).optional(),
  redshift_distribution: redshiftDistSchema.optional(),
  columns: z.array(columnSchema),
}).passthrough();

const globalSchema = z.object({
  schema_data: z.array(tableSchema),
});

type GlobalSchemaForm = z.infer<typeof globalSchema>;

const DATA_TYPES = [
  "integer", "int8", "int4", "bigint", "smallint", "serial", "bigserial",
  "varchar", "text", "char", "character varying", "uuid",
  "boolean", "bool",
  "timestamp", "date", "time", "timestamptz",
  "float", "float4", "float8", "real", "double precision", "numeric", "decimal",
  "json", "jsonb", "bytea"
];

/**
 * Infiere el tipo de tabla por convención de prefijo (d_*, f_*, b_*) cuando no viene explícito.
 */
function inferTableType(tableName?: string, explicitType?: string): string {
  if (explicitType && explicitType.trim()) {
    return explicitType.trim().toLowerCase();
  }
  const lower = (tableName || "").trim().toLowerCase();
  if (lower.startsWith("d_") || lower.startsWith("dim_")) return "dimension";
  if (lower.startsWith("f_") || lower.startsWith("fact_")) return "fact";
  if (
    lower.startsWith("b_") ||
    lower.startsWith("br_") ||
    lower.startsWith("rel_") ||
    lower.startsWith("bridge_")
  ) {
    return "bridge";
  }
  return "";
}

/**
 * Normaliza las tablas desde el JSON de la BD (o archivo importado) hacia el estado del formulario.
 */
function normalizeTablesForForm(rawTables: any[]): any[] {
  if (!Array.isArray(rawTables)) return [];
  return rawTables.map((t) => {
    const pkRaw = t.primary_key;
    const pkStr = Array.isArray(pkRaw)
      ? pkRaw.join(", ")
      : typeof pkRaw === "string"
      ? pkRaw
      : t.primary_key_str || "";

    const fksRaw = Array.isArray(t.foreign_keys) ? t.foreign_keys : [];
    const fksNormalized = fksRaw.map((fk: any) => ({
      ...fk,
      columns_str: Array.isArray(fk.columns)
        ? fk.columns.join(", ")
        : fk.columns_str || fk.columns || "",
      references: fk.references || "",
      note: fk.note || "",
    }));

    const idxRaw = Array.isArray(t.indexes) ? t.indexes : [];
    const idxNormalized = idxRaw.map((idx: any) => ({
      ...idx,
      columns_str: Array.isArray(idx.columns)
        ? idx.columns.join(", ")
        : idx.columns_str || idx.columns || "",
      unique: Boolean(idx.unique),
    }));

    const rsRaw = t.redshift_distribution || {};
    const rsNormalized = {
      diststyle: rsRaw.diststyle || "KEY",
      distkey: rsRaw.distkey || "",
      sortkeys_str: Array.isArray(rsRaw.sortkeys)
        ? rsRaw.sortkeys.join(", ")
        : rsRaw.sortkeys_str || rsRaw.sortkeys || "",
    };

    const colsRaw = Array.isArray(t.columns) ? t.columns : [];
    const colsNormalized = colsRaw.map((c: any) => ({
      ...c,
      name: c.name || "",
      type:
        c.type && String(c.type).trim()
          ? String(c.type).trim().toLowerCase()
          : "varchar",
      description: c.description || "",
      sample_values_str: Array.isArray(c.sample_values)
        ? c.sample_values.join(", ")
        : typeof c.sample_values === "string"
        ? c.sample_values
        : c.sample_values_str || "",
    }));

    const tableName = t.table_name || "";
    const inferredType = inferTableType(tableName, t.table_type);

    return {
      ...t,
      schema: (t.schema || "public")
        .replace("project_{id}", "project{id}")
        .replace("subdistributor_{id}", "subdistributor{id}"),
      table_name: tableName,
      db_engine: t.db_engine || "aurora",
      table_type: inferredType,
      description: t.description || "",
      grain: t.grain || "",
      primary_key_str: pkStr,
      default_filters:
        typeof t.default_filters === "string"
          ? t.default_filters
          : Array.isArray(t.default_filters)
          ? t.default_filters.join(" AND ")
          : "",
      foreign_keys: fksNormalized,
      indexes: idxNormalized,
      redshift_distribution: rsNormalized,
      columns: colsNormalized,
    };
  });
}

/**
 * Convierte los datos del formulario de vuelta al formato JSON enriquecido canónico para guardar en BD.
 */
function serializeTablesForSave(formTables: any[]): any[] {
  return formTables.map((t) => {
    const pkList = (t.primary_key_str || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const fksClean = (t.foreign_keys || [])
      .map((fk: any) => {
        const cols = (fk.columns_str || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        const out: any = {
          columns: cols,
          references: (fk.references || "").trim(),
        };
        if (fk.note && fk.note.trim()) {
          out.note = fk.note.trim();
        }
        return out;
      })
      .filter((fk: any) => fk.columns.length > 0 && fk.references);

    const indexesClean = (t.indexes || [])
      .map((idx: any) => {
        const cols = (idx.columns_str || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        return {
          columns: cols,
          unique: Boolean(idx.unique),
        };
      })
      .filter((idx: any) => idx.columns.length > 0);

    const rsRaw = t.redshift_distribution || {};
    const sortkeysList = (rsRaw.sortkeys_str || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const hasRedshiftDist =
      t.db_engine === "redshift" &&
      (rsRaw.distkey?.trim() || sortkeysList.length > 0 || rsRaw.diststyle);

    const colsClean = (t.columns || []).map((c: any) => {
      const samples = (c.sample_values_str || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const colObj: any = {
        name: c.name,
        type: c.type || "varchar",
      };
      if (typeof c.nullable === "boolean") {
        colObj.nullable = c.nullable;
      }
      colObj.description = c.description || "";
      if (samples.length > 0) {
        colObj.sample_values = samples;
      }
      return colObj;
    });

    const tableObj: any = {
      schema: t.schema,
      table_name: t.table_name,
      db_engine: t.db_engine || "aurora",
      description: t.description || "",
      columns: colsClean,
    };

    const resolvedTableType = inferTableType(t.table_name, t.table_type);
    if (resolvedTableType) {
      tableObj.table_type = resolvedTableType;
    }
    if (t.grain && t.grain.trim()) {
      tableObj.grain = t.grain.trim();
    }
    if (pkList.length > 0) {
      tableObj.primary_key = pkList;
    }
    if (fksClean.length > 0) {
      tableObj.foreign_keys = fksClean;
    }
    if (t.default_filters && t.default_filters.trim()) {
      tableObj.default_filters = t.default_filters.trim();
    }
    if (t.db_engine === "aurora" && indexesClean.length > 0) {
      tableObj.indexes = indexesClean;
    }
    if (hasRedshiftDist) {
      tableObj.redshift_distribution = {
        diststyle: rsRaw.diststyle || "KEY",
        distkey: (rsRaw.distkey || "").trim(),
        sortkeys: sortkeysList,
      };
    }

    return tableObj;
  });
}

function TableCard({ control, register, index, remove, watch, onDirty }: any) {
  const { fields: colFields, append: appendCol, remove: removeCol } = useFieldArray({
    control,
    name: `schema_data.${index}.columns`,
  });

  const { fields: fkFields, append: appendFk, remove: removeFk } = useFieldArray({
    control,
    name: `schema_data.${index}.foreign_keys`,
  });

  const { fields: idxFields, append: appendIdx, remove: removeIdx } = useFieldArray({
    control,
    name: `schema_data.${index}.indexes`,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const schemaName = watch(`schema_data.${index}.schema`) || "public";
  const tableName = watch(`schema_data.${index}.table_name`) || "nueva_tabla";
  const dbEngine = watch(`schema_data.${index}.db_engine`) || "aurora";
  const tableType = inferTableType(tableName, watch(`schema_data.${index}.table_type`));
  const defaultFilters = watch(`schema_data.${index}.default_filters`) || "";
  const numColumns = colFields.length;
  const numFks = fkFields.length;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl mb-6 overflow-hidden">
      <div
        className="flex justify-between items-center p-5 bg-white cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
            <LayoutTemplate size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 font-sans tracking-tight">{tableName}</h3>
              {tableType && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    tableType === "fact"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : tableType === "dimension"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {tableType}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                  dbEngine === "redshift"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-sky-50 text-sky-700 border-sky-200"
                }`}
              >
                {dbEngine === "redshift" ? "Redshift" : "Aurora PG"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {watch(`schema_data.${index}.description`) || "Entidad de base de datos"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {defaultFilters && (
            <span className="hidden md:inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-xs font-mono border border-rose-200">
              <Filter size={12} /> {defaultFilters}
            </span>
          )}
          {numFks > 0 && (
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-mono border border-emerald-100">
              {numFks} FKs
            </span>
          )}
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-mono border border-slate-200">
            {schemaName}
          </span>
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-mono border border-indigo-100">
            {numColumns} cols
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              remove(index);
            }}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors ml-1"
            title="Eliminar tabla"
          >
            <Trash2 size={18} />
          </button>
          <div className="text-slate-400 ml-1">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-0 bg-white">
          {/* Fila 1 y 2: Datos principales y Metadatos clave (Grain, PK, Filtro) siempre visibles */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Motor BD</label>
                <select
                  {...register(`schema_data.${index}.db_engine`)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                >
                  <option value="aurora">Aurora (PG)</option>
                  <option value="redshift">AWS Redshift</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo Tabla</label>
                <select
                  {...register(`schema_data.${index}.table_type`)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                >
                  <option value="">Estándar</option>
                  <option value="fact">Fact (Hechos)</option>
                  <option value="dimension">Dimension</option>
                  <option value="bridge">Bridge (Puente)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Esquema</label>
                <select
                  {...register(`schema_data.${index}.schema`)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                >
                  <option value="stoiii">stoiii</option>
                  <option value="stoiii_config">stoiii_config</option>
                  <option value="project{id}">project&#123;id&#125;</option>
                  <option value="subdistributor{id}">subdistributor&#123;id&#125;</option>
                  <option value="public">public</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Tabla</label>
                <input
                  {...register(`schema_data.${index}.table_name`)}
                  className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="ej. f_visit"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descripción (Semántica)</label>
                <input
                  {...register(`schema_data.${index}.description`)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="Propósito de la tabla..."
                />
              </div>
            </div>

            {/* Segunda fila siempre visible: Grain, Primary Key y Default Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-slate-200/60">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Granularidad (Grain)
                </label>
                <input
                  {...register(`schema_data.${index}.grain`)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-md h-8 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="ej. 1 fila por producto / visita"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Key size={12} className="text-amber-500" /> Primary Key (separadas por coma)
                </label>
                <input
                  {...register(`schema_data.${index}.primary_key_str`)}
                  className="w-full bg-white border border-slate-200 text-slate-800 font-mono text-xs rounded-md h-8 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="ej. id"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Filter size={12} className="text-rose-500" /> Filtro por Defecto Obligatorio
                </label>
                <input
                  {...register(`schema_data.${index}.default_filters`)}
                  className="w-full bg-white border border-slate-200 text-slate-800 font-mono text-xs rounded-md h-8 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="ej. is_deleted = false"
                />
              </div>
            </div>
          </div>

          {/* Toggle de Relaciones (Foreign Keys) e Índices / Distribución */}
          <div className="px-5 py-2.5 bg-indigo-50/40 border-b border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-2"
            >
              <Layers size={14} />
              {showAdvanced
                ? "Ocultar Relaciones (Foreign Keys) e Índices / Distribución"
                : "Configurar Relaciones (Foreign Keys) e Índices / Distribución Física"}
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="text-[11px] text-slate-500 font-mono">
              {numFks} relaciones • {dbEngine === "aurora" ? `${idxFields.length} índices` : "Distribución Redshift"}
            </div>
          </div>

          {showAdvanced && (
            <div className="p-5 bg-slate-50/60 border-b border-slate-200 space-y-5">
              {/* Foreign Keys */}
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch size={14} className="text-indigo-600" /> Llaves Foráneas (Foreign Keys) — Expansión Automática de Joins
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      appendFk({ columns_str: "", references: "", note: "" });
                      onDirty?.();
                    }}
                    className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded flex items-center gap-1 border border-indigo-100"
                  >
                    <Plus size={13} /> Añadir Relación FK
                  </button>
                </div>
                {fkFields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sin llaves foráneas registradas para esta tabla.</p>
                ) : (
                  <div className="space-y-2">
                    {fkFields.map((fk, fkIdx) => (
                      <div key={fk.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-3">
                          <input
                            {...register(`schema_data.${index}.foreign_keys.${fkIdx}.columns_str`)}
                            className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800"
                            placeholder="Columna local (ej. d_place_id)"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <input
                            {...register(`schema_data.${index}.foreign_keys.${fkIdx}.references`)}
                            className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-indigo-700"
                            placeholder="Tabla destino (ej. subdistributor{id}.d_place(id))"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <input
                            {...register(`schema_data.${index}.foreign_keys.${fkIdx}.note`)}
                            className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600"
                            placeholder="Nota (ej. id es YYYYMMDD)"
                          />
                        </div>
                        <div className="md:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              removeFk(fkIdx);
                              onDirty?.();
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Configuración física según motor: Índices (Aurora) vs Distribución (Redshift) */}
              {dbEngine === "aurora" ? (
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Índices B-Tree Existentes (Aurora PostgreSQL)
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        appendIdx({ columns_str: "", unique: false });
                        onDirty?.();
                      }}
                      className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded flex items-center gap-1 border border-indigo-100"
                    >
                      <Plus size={13} /> Añadir Índice
                    </button>
                  </div>
                  {idxFields.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sin índices compuestos registrados.</p>
                  ) : (
                    <div className="space-y-2">
                      {idxFields.map((idxItem, idxPos) => (
                        <div key={idxItem.id} className="flex items-center gap-3">
                          <input
                            {...register(`schema_data.${index}.indexes.${idxPos}.columns_str`)}
                            className="flex-1 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800"
                            placeholder="Columnas separadas por coma (ej. working_date_id, d_role_id)"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              {...register(`schema_data.${index}.indexes.${idxPos}.unique`)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            UNIQUE
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              removeIdx(idxPos);
                              onDirty?.();
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-3">
                    Distribución Física Columnar (AWS Redshift)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">DISTSTYLE</label>
                      <select
                        {...register(`schema_data.${index}.redshift_distribution.diststyle`)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 bg-white"
                      >
                        <option value="KEY">KEY</option>
                        <option value="ALL">ALL</option>
                        <option value="EVEN">EVEN</option>
                        <option value="AUTO">AUTO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">DISTKEY</label>
                      <input
                        {...register(`schema_data.${index}.redshift_distribution.distkey`)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        placeholder="ej. d_place_id"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">SORTKEYS (separadas por coma)</label>
                      <input
                        {...register(`schema_data.${index}.redshift_distribution.sortkeys_str`)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        placeholder="ej. working_date_id"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabla de Columnas */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/5">Columna / Llave</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/6">Tipo Dato</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/3">Definición Semántica</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/4">Valores Ejemplo (Sample)</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-14 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {colFields.map((col, colIndex) => {
                  const fieldType = (col as any).type;
                  const watchedType = watch(`schema_data.${index}.columns.${colIndex}.type`);
                  const customTypes = Array.from(
                    new Set(
                      [fieldType, watchedType].filter(
                        (t): t is string =>
                          Boolean(t && typeof t === "string" && !DATA_TYPES.includes(t))
                      )
                    )
                  );
                  const typeOptions = [...customTypes, ...DATA_TYPES];

                  return (
                  <tr key={col.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-2.5 align-middle">
                      <input
                        {...register(`schema_data.${index}.columns.${colIndex}.name`)}
                        className="w-full bg-transparent font-mono text-sm text-slate-900 border-none p-0 focus:ring-0 focus:outline-none"
                        placeholder="columna_id"
                      />
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <select
                        {...register(`schema_data.${index}.columns.${colIndex}.type`)}
                        className="font-mono text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-indigo-600 outline-none w-full cursor-pointer appearance-none"
                      >
                        {typeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <input
                        {...register(`schema_data.${index}.columns.${colIndex}.description`)}
                        className="w-full bg-transparent text-sm text-slate-700 border-none p-0 focus:ring-0 focus:outline-none placeholder-slate-300"
                        placeholder="Ej. Estado operativo de la visita..."
                      />
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <input
                        {...register(`schema_data.${index}.columns.${colIndex}.sample_values_str`)}
                        className="w-full bg-transparent font-mono text-xs text-emerald-700 border-none p-0 focus:ring-0 focus:outline-none placeholder-slate-300"
                        placeholder="Ej. COMPLETED, CANCELLED"
                      />
                    </td>
                    <td className="px-5 py-2.5 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => {
                          removeCol(colIndex);
                          onDirty?.();
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-right">
            <button
              type="button"
              onClick={() => {
                appendCol({ name: "", type: "varchar", description: "", sample_values_str: "" });
                onDirty?.();
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={16} /> Añadir Columna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemasPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const user = useAuthStore((state) => state.user);

  const [showDdlModal, setShowDdlModal] = useState(false);
  const [ddlInput, setDdlInput] = useState("");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    getValues,
    setValue,
  } = useForm<GlobalSchemaForm>({
    defaultValues: { schema_data: [] },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "schema_data",
  });

  const showUnsavedBanner = isDirty || hasPendingChanges;

  useEffect(() => {
    document.title = "Cerebro Global | Storecheck NexusAI";
    const loadContext = async () => {
      try {
        const schemas = await fetchKnowledgeBase(backendUrl);
        if (schemas && schemas.length > 0) {
          const normalized = normalizeTablesForForm(schemas[0].schema_data);
          reset({ schema_data: normalized });
          setHasPendingChanges(false);
        }
      } catch (err) {
        toast.error("Error al cargar la base de conocimiento");
      } finally {
        setIsLoading(false);
      }
    };
    loadContext();
  }, [backendUrl, reset]);

  const onSubmit = async () => {
    const currentTables = getValues("schema_data") || [];
    const emptyTable = currentTables.find((t: any) => !t.table_name || !t.table_name.trim());
    if (emptyTable) {
      toast.error("Todas las tablas deben tener un nombre antes de sincronizar.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanPayload = serializeTablesForSave(currentTables);
      await saveKnowledgeBase(backendUrl, cleanPayload);
      const renormalized = normalizeTablesForForm(cleanPayload);
      reset({ schema_data: renormalized });
      setHasPendingChanges(false);
      toast.success("Cerebro Global actualizado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const tablesArray = Array.isArray(json)
          ? json
          : Array.isArray(json?.schema_data)
          ? json.schema_data
          : Array.isArray(json?.tables)
          ? json.tables
          : [json];
        const normalized = normalizeTablesForForm(tablesArray);
        replace(normalized);
        setValue("schema_data", normalized, { shouldDirty: true, shouldTouch: true });
        setHasPendingChanges(true);
        toast.success(`JSON cargado (${normalized.length} tablas). Haz clic en Sincronizar Cambios para guardar.`);
      } catch (err) {
        toast.error("El archivo JSON no tiene un formato válido");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const currentTables = getValues("schema_data") || [];
    const serialized = serializeTablesForSave(currentTables);
    const blob = new Blob([JSON.stringify(serialized, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storecheck_nexus_schema.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDdlPaste = () => {
    const text = ddlInput.trim();
    if (!text) {
      toast.error("El campo de texto está vacío");
      return;
    }

    const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?([a-zA-Z0-9_{}]+)"?\.)?"?([a-zA-Z0-9_]+)"?\s*\(([\s\S]+?)\)\s*(?:;|$)/gi;
    let match;
    let tablesAdded = 0;

    while ((match = tableRegex.exec(text)) !== null) {
      const schemaName = match[1]?.trim() || "public";
      const tableName = match[2]?.trim();
      const columnsText = match[3];

      let mappedSchema = schemaName;
      if (schemaName.includes("project")) mappedSchema = "project{id}";
      if (schemaName.includes("subdistrib")) mappedSchema = "subdistributor{id}";
      if (schemaName.includes("stoiii_config")) mappedSchema = "stoiii_config";
      else if (schemaName.includes("stoiii")) mappedSchema = "stoiii";

      const columnLines = columnsText
        .split(",")
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 0 &&
            !l.toUpperCase().startsWith("CONSTRAINT") &&
            !l.toUpperCase().startsWith("PRIMARY KEY")
        );

      const newColumns = columnLines
        .map((line) => {
          const parts = line.split(/\s+/);
          const colName = parts[0].replace(/"/g, "");
          const colType = (parts[1] || "").toLowerCase().replace(/\([0-9,]+\)/g, "");

          let mappedType = "varchar";
          if (colType.includes("int") || colType.includes("serial")) mappedType = "integer";
          else if (colType.includes("timestamp") || colType.includes("date")) mappedType = "timestamp";
          else if (colType.includes("bool")) mappedType = "boolean";
          else if (colType.includes("json")) mappedType = "json";
          else if (colType.includes("float") || colType.includes("numeric") || colType.includes("decimal"))
            mappedType = "float";
          else if (colType.includes("uuid")) mappedType = "uuid";

          return {
            name: colName,
            type: mappedType,
            description: "",
            sample_values_str: "",
          };
        })
        .filter((c) => c.name);

      if (newColumns.length > 0) {
        append({
          schema: mappedSchema,
          table_name: tableName,
          db_engine: "aurora",
          table_type: tableName.startsWith("f_") ? "fact" : tableName.startsWith("d_") ? "dimension" : "",
          description: "",
          grain: "",
          primary_key_str: "id",
          default_filters: "",
          foreign_keys: [],
          indexes: [],
          redshift_distribution: { diststyle: "KEY", distkey: "", sortkeys_str: "" },
          columns: newColumns,
        });
        tablesAdded++;
      }
    }

    if (tablesAdded > 0) {
      setHasPendingChanges(true);
      toast.success(`${tablesAdded} tablas importadas del DDL. Haz clic en Sincronizar Cambios para guardar.`);
    } else {
      toast.error("No se detectaron comandos CREATE TABLE válidos");
    }
  };

  if (isLoading)
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500 font-sans">
          <Database className="animate-pulse mr-2" /> Cargando Cerebro Global...
        </div>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans">
        <TopNavbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">Cerebro Global</h2>
              <p className="text-slate-500 text-sm">
                Modelado semántico enriquecido (Grain, PK/FKs, Índices, Distribución Redshift y Filtros por Defecto).
              </p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg flex p-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tablas Sincronizadas
                </p>
                <p className="text-xl font-mono text-slate-900 font-semibold">{fields.length}</p>
              </div>
              <div className="border-l border-slate-100 pl-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Table Pruning + FKs
                </p>
                <p className="text-xl font-mono text-emerald-600 font-semibold">Activo</p>
              </div>
            </div>
          </div>

          <form
            onChange={() => setHasPendingChanges(true)}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {showUnsavedBanner && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 shadow-sm animate-pulse">
                <Zap className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Tienes cambios pendientes por guardar</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Has modificado, importado o eliminado tablas. Haz clic en <strong>Sincronizar Cambios</strong> para guardar en la base de datos.
                  </p>
                </div>
              </div>
            )}

            {/* FAST IMPORT BANNER */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-lg text-white shadow-sm">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Importación y Exportación de Esquemas</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Soporta JSON enriquecido (con Foreign Keys, Grain, Índices y Distribución Redshift) o catálogos DDL.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors cursor-pointer">
                  <Upload size={16} /> Importar JSON
                  <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
                >
                  <Download size={16} /> Exportar JSON
                </button>
                <button
                  type="button"
                  onClick={() => setShowDdlModal(true)}
                  className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
                >
                  <FileCode size={16} /> Pegar DDL
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    append({
                      schema: "public",
                      table_name: "",
                      db_engine: "aurora",
                      table_type: "",
                      description: "",
                      grain: "",
                      primary_key_str: "id",
                      default_filters: "",
                      foreign_keys: [],
                      indexes: [],
                      redshift_distribution: { diststyle: "KEY", distkey: "", sortkeys_str: "" },
                      columns: [],
                    });
                    setHasPendingChanges(true);
                  }}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
                >
                  <Plus size={16} /> Nueva Tabla
                </button>
              </div>
              <button
                type="submit"
                disabled={isSaving || !showUnsavedBanner}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm shadow-sm transition-colors ${
                  showUnsavedBanner
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Save size={16} /> {isSaving ? "Guardando..." : "Sincronizar Cambios"}
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-500">
                <Database size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">El Cerebro está vacío</h3>
                <p className="text-sm">Agrega tu primera tabla o usa la importación rápida.</p>
              </div>
            ) : (
              fields.map((field, index) => (
                <TableCard
                  key={field.id}
                  control={control}
                  register={register}
                  index={index}
                  remove={(idx: number) => {
                    remove(idx);
                    setHasPendingChanges(true);
                  }}
                  onDirty={() => setHasPendingChanges(true)}
                  errors={errors}
                  watch={watch}
                />
              ))
            )}
          </form>
        </div>
      </div>

      {/* DDL MODAL */}
      {showDdlModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Importar Esquema DDL</h3>
              <button onClick={() => setShowDdlModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 flex-1">
              <p className="text-sm text-slate-500 mb-3">
                Pega aquí el código <code>CREATE TABLE</code> exportado desde PostgreSQL, DBeaver o pgAdmin.
              </p>
              <textarea
                value={ddlInput}
                onChange={(e) => setDdlInput(e.target.value)}
                className="w-full h-64 font-mono text-sm p-4 bg-slate-900 text-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                placeholder="CREATE TABLE project10674.f_visit (&#10;  id bigint,&#10;  status varchar(50)&#10;);"
              ></textarea>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowDdlModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDdlPaste();
                  setShowDdlModal(false);
                  setDdlInput("");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
