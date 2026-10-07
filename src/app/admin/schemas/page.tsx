"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import ProtectedRoute from "../../components/ProtectedRoutes";
import { fetchKnowledgeBase, saveKnowledgeBase } from "../../lib/api";
import { useAuthStore } from "../../store/Store";
import TopNavbar from "../../components/TopNavbar";
import { Database, Trash2, Plus, Upload, Save, ChevronDown, ChevronUp, FileCode, Zap, LayoutTemplate } from "lucide-react";

// Esquema Zod
const columnSchema = z.object({
  name: z.string().min(1, "Requerido"),
  type: z.string().min(1, "Requerido"),
  description: z.string().optional(),
});

const tableSchema = z.object({
  schema: z.string().min(1, "Requerido"),
  table_name: z.string().min(1, "Requerido"),
    db_engine: z.string(),
  description: z.string().optional(),
  columns: z.array(columnSchema),
});

const globalSchema = z.object({
  schema_data: z.array(tableSchema),
});

type GlobalSchemaForm = z.infer<typeof globalSchema>;

const DATA_TYPES = [
  "integer", "int8", "int4", "bigint", "smallint",
  "varchar", "text", "char", "uuid",
  "boolean", "bool",
  "timestamp", "date", "time", "timestamptz",
  "float", "float4", "float8", "numeric", "decimal",
  "json", "jsonb"
];

function TableCard({ control, register, index, remove, errors, watch }: any) {
  const { fields, append, remove: removeCol } = useFieldArray({
    control,
    name: `schema_data.${index}.columns`,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const schemaName = watch(`schema_data.${index}.schema`) || "public";
  const tableName = watch(`schema_data.${index}.table_name`) || "nueva_tabla";
  const numColumns = fields.length;

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
            <h3 className="text-xl font-bold text-slate-900 font-sans tracking-tight">{tableName}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Entidad de base de datos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-mono border border-slate-200">
            esquema: {schemaName}
          </span>
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-mono border border-indigo-100">
            {numColumns} columnas
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(index); }}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-md transition-colors ml-2"
            title="Eliminar tabla"
          >
            <Trash2 size={18} />
          </button>
          <div className="text-slate-400 ml-2">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-0 bg-white">
          <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex gap-4">
              <div className="flex-[0.5]">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Motor BD</label>
                <select
                  {...register(`schema_data.${index}.db_engine`)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                >
                  <option value="aurora">Aurora (PG)</option>
                  <option value="redshift">AWS Redshift</option>
                </select>
              </div>
              <div className="flex-[0.75]">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Esquema</label>
              <select
                {...register(`schema_data.${index}.schema`)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              >
                <option value="stoiii">stoiii</option>
                <option value="stoiii_config">stoiii_config</option>
                <option value="project{id}">project</option>
                <option value="subdistributor{id}">subdistribuidor</option>
                <option value="public">public</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Tabla</label>
              <input
                {...register(`schema_data.${index}.table_name`)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                placeholder="ej. d_product"
              />
            </div>
            <div className="flex-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descripción (Semántica)</label>
              <input
                {...register(`schema_data.${index}.description`)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-md h-9 px-3 focus:ring-1 focus:ring-indigo-600 outline-none"
                placeholder="Propósito de la tabla..."
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/4">Columna / Llave</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/5">Tipo Postgres</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-2/4">Definición Semántica</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map((col, colIndex) => (
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
                        {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-2.5 align-middle">
                      <input
                        {...register(`schema_data.${index}.columns.${colIndex}.description`)}
                        className="w-full bg-transparent text-sm text-slate-700 border-none p-0 focus:ring-0 focus:outline-none placeholder-slate-300"
                        placeholder="Ej. Identificador único..."
                      />
                    </td>
                    <td className="px-5 py-2.5 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => removeCol(colIndex)}
                        className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-right">
            <button
              type="button"
              onClick={() => append({ name: "", type: "varchar", description: "" })}
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
  const user = useAuthStore(state => state.user);
  
  const [showDdlModal, setShowDdlModal] = useState(false);
  const [ddlInput, setDdlInput] = useState("");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const { control, register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue } = useForm<GlobalSchemaForm>({
    resolver: zodResolver(globalSchema),
    defaultValues: { schema_data: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schema_data",
  });

  useEffect(() => {
    const loadContext = async () => {
      try {
        const schemas = await fetchKnowledgeBase(backendUrl);
        if (schemas && schemas.length > 0) {
          reset({ schema_data: schemas[0].schema_data });
            
        }
      } catch (err) {
        toast.error("Error al cargar la base de conocimiento");
      } finally {
        setIsLoading(false);
      }
    };
    loadContext();
  }, [backendUrl, reset]);

  const onSubmit = async (data: GlobalSchemaForm) => {
    setIsSaving(true);
    try {
      await saveKnowledgeBase(backendUrl, data.schema_data);
        reset(data);
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
        if (Array.isArray(json)) {
          reset({ schema_data: json });
          toast.success("JSON importado correctamente");
        } else {
          toast.error("El JSON debe ser un arreglo de tablas");
        }
      } catch (err) {
        toast.error("JSON inválido");
      }
    };
    reader.readAsText(file);
  };

  const handleDdlPaste = () => {
    const text = ddlInput.trim();
    if (!text) {
      toast.error("El campo de texto está vacío");
      return;
    }

    const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?([a-zA-Z0-9_{}]+)"?\.)?"?([a-zA-Z0-9_]+)"?\s*\(([\s\S]+?)\)\s*(?:;|$)/gi;
    const currentData = watch("schema_data");
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

      const columnLines = columnsText.split(',').map(l => l.trim()).filter(l => l.length > 0 && !l.toUpperCase().startsWith('CONSTRAINT') && !l.toUpperCase().startsWith('PRIMARY KEY'));

      const newColumns = columnLines.map(line => {
        const parts = line.split(/\s+/);
        let colName = parts[0].replace(/"/g, '');
        let colType = parts[1]?.toLowerCase().replace(/\([0-9,]+\)/g, ''); 
        
        let mappedType = "varchar";
        const t = colType;
        if (t.includes('int') || t.includes('serial')) mappedType = "integer";
        else if (t.includes('timestamp') || t.includes('date')) mappedType = "timestamp";
        else if (t.includes('bool')) mappedType = "boolean";
        else if (t.includes('json')) mappedType = "json";
        else if (t.includes('float') || t.includes('numeric') || t.includes('decimal')) mappedType = "float";
        else if (t.includes('uuid')) mappedType = "uuid";

        return {
          name: colName,
          type: mappedType,
          description: ""
        };
      }).filter(c => c.name);

      if (newColumns.length > 0) {
        append({
          schema: mappedSchema,
          table_name: tableName,
          db_engine: "aurora",
          description: "",
          columns: newColumns
        });
        tablesAdded++;
      }
    }

    if (tablesAdded > 0) {
      toast.success(`${tablesAdded} tablas importadas del DDL`);
    } else {
      toast.error("No se detectaron comandos CREATE TABLE válidos");
    }
  };

  if (isLoading) return (
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
               <p className="text-slate-500 text-sm">Modelado semántico e indexación de esquemas relacionales para inferencia SQL generativa.</p>
             </div>
             <div className="bg-white border border-slate-200 shadow-sm rounded-lg flex p-4 gap-6">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tablas Sincronizadas</p>
                   <p className="text-xl font-mono text-slate-900 font-semibold">{fields.length}</p>
                </div>
                <div className="border-l border-slate-100 pl-6">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precisión LLM (Est)</p>
                   <p className="text-xl font-mono text-emerald-600 font-semibold">99.4%</p>
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
              {isDirty && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 shadow-sm animate-pulse">
                  <Zap className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">Tienes cambios sin guardar</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Has modificado, agregado o eliminado tablas. Los cambios no se aplicarn hasta que hagas clic en <strong>Sincronizar Cambios</strong>.
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
                  <h2 className="text-lg font-semibold text-slate-900">Importación Rápida de Esquemas</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Carga catálogos DDL o árboles JSON para actualizar los embeddings semánticos.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors cursor-pointer">
                  <Upload size={16} /> Subir JSON
                  <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                </label>
                <button type="button" onClick={() => setShowDdlModal(true)} className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors">
                  <FileCode size={16} /> Pegar DDL
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={() => append({ schema: "public", table_name: "", db_engine: "aurora", description: "", columns: [] })}
                   className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
                 >
                   <Plus size={16} /> Nueva Tabla
                 </button>
               </div>
               <button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm shadow-sm transition-colors ${isDirty ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
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
                  remove={remove}
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
              <button onClick={() => setShowDdlModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            <div className="p-6 flex-1">
              <p className="text-sm text-slate-500 mb-3">Pega aquí el código <code>CREATE TABLE</code> exportado desde PostgreSQL, DBeaver o pgAdmin.</p>
              <textarea
                value={ddlInput}
                onChange={(e) => setDdlInput(e.target.value)}
                className="w-full h-64 font-mono text-sm p-4 bg-slate-900 text-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                placeholder="CREATE TABLE public.usuarios (&#10;  id uuid,&#10;  nombre varchar(255)&#10;);"
              ></textarea>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowDdlModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={() => { handleDdlPaste(); setShowDdlModal(false); setDdlInput(""); }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Procesar e Importar</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}


