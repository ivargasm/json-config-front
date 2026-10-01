import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PresetColumn, PresetReportState } from '../types/presetReport';
import { AVAILABLE_VARIABLES, DATASET_TYPES } from '../lib/presetConstants';

interface PresetStore extends PresetReportState {
    // Actions
    setField: <K extends keyof PresetReportState>(field: K, value: PresetReportState[K]) => void;
    setVariableAlias: (varName: string, alias: string) => void;
    toggleVariable: (varName: string) => void;
    setColumns: (columns: PresetColumn[]) => void;
    updateColumn: (index: number, updates: Partial<PresetColumn>) => void;
    clearStore: () => void;
    loadFromJSON: (data: any) => void;
}

const initialState: PresetReportState = {
    jsonType: 'normal',
    reportName: '',
    projectName: '',
    configType: 'preset',
    mainSql: '',
    columns: [],
    selectedVariables: {},
    selectedDatasetType: DATASET_TYPES?.[0]?.id || 0,
    preQueries: '',
    postQueries: ''
};

export const usePresetReportStore = create<PresetStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setField: (field, value) => set({ [field]: value }),

            setVariableAlias: (varName, alias) => set(state => ({
                selectedVariables: { ...state.selectedVariables, [varName]: alias }
            })),

            toggleVariable: (varName) => set(state => {
                const newVars = { ...state.selectedVariables };
                if (newVars[varName] !== undefined) {
                    delete newVars[varName];
                } else {
                    const template = AVAILABLE_VARIABLES.find(v => v.var === varName);
                    newVars[varName] = template?.defaultAlias || 'v';
                }
                return { selectedVariables: newVars };
            }),

            setColumns: (columns) => set({ columns }),

            updateColumn: (index, updates) => set(state => {
                const newCols = [...state.columns];
                newCols[index] = { ...newCols[index], ...updates };
                return { columns: newCols };
            }),

            
            clearStore: () => set(initialState),

            loadFromJSON: (config) => {
                if (!config || !config.columns || config.columns.length === 0) {
                    console.error("El JSON cargado es inválido o no contiene columnas.");
                    return;
                }
                const jsonType = config.columns[0].agg ? 'groupBy' : 'normal';
                const nameParts = config.columns[0].name.split('.');
                const reportName = nameParts[3] || 'report';
                const configType = (nameParts[4] || 'adhoc') as 'adhoc' | 'preset';
                const projectName = nameParts[5] || 'project';

                const columns = config.columns.map((col: any) => ({
                    originalName: col.name.split('.').pop() || '',
                    name: col.name,
                    dataType: col.dataType,
                    customMessage: col.name.split('.').pop() || '',
                    select: col.select,
                    alias: col.alias,
                    agg: col.agg,
                }));

                const selectedVariables = config.variables.reduce((acc: any, v: any) => {
                    const alias = v.sql_include.split('.')[0] || 'v';
                    acc[v.var] = alias;
                    return acc;
                }, {});

                set({
                    jsonType,
                    reportName,
                    configType,
                    projectName,
                    mainSql: config.sql || "",
                    columns,
                    selectedVariables,
                    selectedDatasetType: config.type?.id || DATASET_TYPES[0].id,
                    preQueries: config.preQuery ? config.preQuery.join('; ') : '',
                    postQueries: config.postQuery ? config.postQuery.join('; ') : ''
                });
            }
        }),
        { name: 'preset-report-storage' }
    )
);