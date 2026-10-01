export interface Variable {
    var: string;
    dsc: string;
    filterType: string;
    defaultAlias: string;
    sql_include: string;
    sql_exclude: string;
}

export interface DatasetType {
    id: number;
    dsci18n: string;
    description: string;
}

export interface PresetColumn {
    originalName: string;
    name: string;
    dataType: string;
    customMessage: string;
    select?: string;
    alias?: string;
    agg?: string;
}

export interface PresetReportState {
    jsonType: 'normal' | 'groupBy';
    reportName: string;
    projectName: string;
    configType: 'adhoc' | 'preset';
    mainSql: string;
    columns: PresetColumn[];
    selectedVariables: Record<string, string>;
    selectedDatasetType: number;
    preQueries: string;
    postQueries: string;
}