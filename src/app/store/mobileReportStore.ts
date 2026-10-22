import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReportComponent, GenericFilter, FilterProperties, ParsedColumn, DefaultValue } from '../types/mobileReport';


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { 
    role: 'assistant', 
    content: '¡Hola! Soy tu Asistente IA para Reportes Mobile.\n\n🧠 **Conectado a Cerebro Global**: Conozco las tablas reales de Storecheck (`d_product`, `f_visit`, `d_place`, `calendar`, etc.).\n\n**¿Qué puedo hacer por ti?**\n✅ Crear y diseñar los 18 tipos de componentes de Storecheck con sus consultas SQL reales.\n✅ Configurar reglas de visibilidad (`show_when`, `hide_when`) e interacciones al dar clic.\n✅ Crear subtablas o drilldowns anidados (`detail`).\n✅ Aplicar reglas estrictas de Storecheck (sin `::`, con `project_` en CTEs y filtros `LOWER`).\n\n¿Qué componente o sección deseas construir hoy?' 
  }
];

interface MobileReportState {
    // Filters State
    filters: string[];
    generic_filters: GenericFilter[];
    filters_properties: Record<string, FilterProperties>;
    
    // Chat State
    chatMessages: ChatMessage[];
    setChatMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
    resetChat: () => void;
    
    // Components State
    components: ReportComponent[];
    
    // Actions - Filters
    addFilter: (filter: string) => void;
    removeFilter: (filter: string) => void;
    updateGenericFilter: (filter: GenericFilter) => void;
    removeGenericFilter: (selectId: string) => void;
    updateDefaultValue: (selectId: string, value: DefaultValue) => void;
    clearFilters: () => void;
    
    // Actions - Components
    addComponent: (component: ReportComponent) => void;
    updateComponent: (id: string, updated: Partial<ReportComponent>) => void;
    removeComponent: (id: string) => void;
    setParsedColumns: (id: string, columns: ParsedColumn[]) => void;
    clearComponents: () => void;
    setComponents: (components: ReportComponent[]) => void;
    
    // Global Actions
    loadFromJSON: (data: any) => void;
    exportJSON: () => any;
    resetReport: () => void;
}

export const useMobileReportStore = create<MobileReportState>()(
    persist(
        (set, get) => ({
    filters: [],
    generic_filters: [],
    filters_properties: {},
    components: [],
    // Chat State
    chatMessages: INITIAL_CHAT_MESSAGES,
    setChatMessages: (updater) => set((state) => ({
      chatMessages: typeof updater === 'function' ? updater(state.chatMessages) : updater
    })),
    resetChat: () => set({
      chatMessages: INITIAL_CHAT_MESSAGES
    }),
    resetReport: () => set({
      filters: [],
      generic_filters: [],
      filters_properties: {},
      components: [],
      chatMessages: INITIAL_CHAT_MESSAGES
    }),

    // Components State

    addFilter: (filter) =>
        set((state) => ({
            filters: [...state.filters, filter],
            filters_properties: {
                ...state.filters_properties,
                [filter]: { default_value: { value: '-1', description: 'Todos' } }
            }
        })),

    removeFilter: (filter) =>
        set((state) => {
            const newProperties = { ...state.filters_properties };
            delete newProperties[filter];
            return {
                filters: state.filters.filter((f) => f !== filter),
                filters_properties: newProperties
            };
        }),

    updateGenericFilter: (filter) =>
        set((state) => {
            const exists = state.generic_filters.some(f => f.selectId === filter.selectId);
            if (exists) {
                return {
                    generic_filters: state.generic_filters.map(f => f.selectId === filter.selectId ? filter : f)
                };
            }
            return {
                generic_filters: [...state.generic_filters, filter],
                filters_properties: {
                    ...state.filters_properties,
                    [filter.selectId]: { default_value: { value: '-1', description: 'Todos' } }
                }
            };
        }),
        
    removeGenericFilter: (selectId) =>
        set((state) => {
            const newProperties = { ...state.filters_properties };
            delete newProperties[selectId];
            return {
                generic_filters: state.generic_filters.filter((f) => f.selectId !== selectId),
                filters_properties: newProperties
            };
        }),

    updateDefaultValue: (selectId, value) =>
        set((state) => ({
            filters_properties: {
                ...state.filters_properties,
                [selectId]: { default_value: value }
            }
        })),

    clearFilters: () => set({ filters: [], generic_filters: [], filters_properties: {} }),

    addComponent: (component) =>
        set((state) => {
            const exists = state.components.some((c) => c.id === component.id);
            if (exists) {
                return {
                    components: state.components.map((c) =>
                        c.id === component.id ? { ...c, ...component } : c
                    ),
                };
            }
            return {
                components: [...state.components, component],
            };
        }),

    updateComponent: (id, updated) =>
        set((state) => ({
            components: state.components.map((c) =>
                c.id === id ? { ...c, ...updated } : c
            ),
        })),

    removeComponent: (id) =>
        set((state) => ({
            components: state.components.filter((c) => c.id !== id),
        })),

    setParsedColumns: (id, columns) =>
        set((state) => ({
            components: state.components.map((c) =>
                c.id === id ? { ...c, parsedColumns: columns } : c
            ),
        })),

    clearComponents: () => set({ components: [] }),
    setComponents: (components) => set({ components }),

    loadFromJSON: (data) =>
        set({
            filters: data.filters || [],
            generic_filters: data.generic_filters || [],
            filters_properties: data.filters_properties || {},
            components: data.components || [],
        }),
        
    exportJSON: () => {
        const state = get();
        // Clean up components to match exactly what is needed
        const cleanedComponents = state.components.map((c) => {
            const { parsedColumns, ...rest } = c;
            return rest;
        });
        
        return {
            filters: state.filters,
            filters_properties: state.filters_properties,
            generic_filters: state.generic_filters,
            components: cleanedComponents
        };
    }
        }),
        { name: 'mobile-report-storage' }
    )
);