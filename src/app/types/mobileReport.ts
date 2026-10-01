// Common types
export interface ParsedColumn {
    column: string;
    description: string;
}

export interface DefaultValue {
    value: string;
    description: string;
}

// Filter types
export interface GenericFilter {
    selectId: string;
    schema: 'project' | 'stoiii' | 'stoiii_config';
    datasource: string;
    count_datasource: string;
}

export interface FilterProperties {
    default_value: DefaultValue;
}

// Component types
export interface TableColumn extends ParsedColumn {
    is_number?: boolean;
    is_sortable?: boolean;
    is_percent?: boolean;
    is_image?: boolean;
    is_amount?: boolean;
}

export interface ResumeColumn {
    column: string;
    is_number?: boolean;
    is_percent?: boolean;
    is_amount?: boolean;
    is_image?: boolean;
}

export interface ResumeRow {
    description: string;
    columns: ResumeColumn[];
}

export type ComponentType = 
    | 'resume' 
    | 'table' 
    | 'basic_card' 
    | 'progress_bar' 
    | 'progress_circle' 
    | 'metric_section' 
    | 'graph_bar' 
    | 'graph_pie' 
    | 'graph_doughnut' 
    | 'graph_line' 
    | 'graph_mixed' 
    | 'grouped_list'
    | 'card_carousel'
    | 'history_list'
    | 'section_header'
    | 'report_title'
    | 'notice'
    | 'grid_group'
    | 'tab_group'
    | 'basic_tree';

export interface ReportComponent {
    id: string;
    type: ComponentType;
    title?: string;
    schema?: string;
    datasource?: string;
    count_datasource?: string;
    last_date_datasource?: string;
    
    // Shared common
    collapsed?: boolean;
    
    // Table/Resume
    column_titles?: string[];
    rows?: ResumeRow[];
    columns?: TableColumn[] | any[];
    parsedColumns?: ParsedColumn[];
    
    // Basic Card
    variant?: string;
    descriptions?: string[];
    left_col?: string;
    right_col?: string;
    left_label?: string;
    right_label?: string;
    left_is_percent?: boolean;
    right_is_percent?: boolean;
    
    // Progress Bar
    hide_stats?: boolean;
    weight?: number | string;
    show_target_label?: boolean;
    hero_pct_col?: string;
    hero_score_col?: string;
    hero_total_col?: string;
    status_label_success?: string;
    status_label_warning?: string;
    status_label_danger?: string;

    // Progress Circle & Metrics
    value_col?: string;
    target_col?: string;
    format?: string;
    show_status?: boolean;
    success_min?: number;
    warning_min?: number;
    
    // Metric Section
    layout?: string;
    metrics?: any[];

    // Grouped List / History
    group_by?: string;
    list_label?: string;
    value_is_percent?: boolean;
    period_col?: string;
    date_col?: string;

    // Carousel
    label_col?: string;
    color_col?: string;
    detail_link_id?: string;

    // Report Title & Notice
    subtitle?: string;
    show_last_updated?: boolean;
    message?: string;
    icon?: string;

    // Graphs
    random_colors?: string;
    datasource_alert?: string;
    series?: any[];
    
    // Legacy / Other
    tree?: any;
    treeColumns?: any[];
    alert?: {
        schema?: string;
        type?: string;
        message?: string;
    };
}
