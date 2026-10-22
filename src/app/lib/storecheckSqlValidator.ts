/**
 * Validador de Sintaxis SQL para Storecheck Mobile Portal
 * 
 * Reglas críticas:
 * 1. Prohibido usar cast con dos puntos '::' (falla en el parser de Storecheck).
 * 2. En subqueries / CTEs con 'WITH', el nombre de la subconsulta/CTE DEBE comenzar con 'project_' (ej. WITH project_resumen AS (...)).
 *    El esquema de las tablas se mantiene normal como project&projectId&.
 * 3. El portal siempre convierte todo el query a lowercase antes de ejecutarlo.
 */

export interface SqlValidationIssue {
  id: 'cast_colon' | 'with_project_underscore' | 'uppercase_literal';
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  canAutoFix: boolean;
  fixLabel?: string;
  fixedSql?: string;
}

export function fixCastColon(sql: string): string {
  // Reemplaza func(...)::tipo, (expr)::tipo, tabla.col::tipo o col::tipo con CAST(expr AS tipo)
  return sql.replace(/([a-zA-Z0-9_\.]+\([^\(\)]*\)|\([^\(\)]+\)|[a-zA-Z0-9_\.]+)::([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, expr, type) => {
    return `CAST(${expr} AS ${type})`;
  });
}

export function fixWithProjectCteNames(sql: string): string {
  // En consultas con WITH, el nombre del CTE debe comenzar con 'project_' (ej. WITH project_resumen AS (...))
  const regex = /(?:WITH(?:\s+RECURSIVE)?|,)\s+([a-zA-Z0-9_]+)(?:\s*\([^)]*\))?\s+AS\s*\(/gi;
  const invalidCtes: string[] = [];
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const name = match[1];
    if (!name.toLowerCase().startsWith('project_') && !invalidCtes.includes(name)) {
      invalidCtes.push(name);
    }
  }

  let fixedSql = sql;
  for (const name of invalidCtes) {
    const newName = 'project_' + name;
    const wordRegex = new RegExp('\\b' + name + '\\b', 'g');
    fixedSql = fixedSql.replace(wordRegex, newName);
  }
  return fixedSql;
}

export function validateStorecheckSql(sql: string | null | undefined): SqlValidationIssue[] {
  if (!sql || !sql.trim()) return [];

  const issues: SqlValidationIssue[] = [];

  // 1. Prohibir CAST con '::'
  const castColonRegex = /(?<!:)::([a-zA-Z_][a-zA-Z0-9_]*)/;
  if (castColonRegex.test(sql)) {
    const fixed = fixCastColon(sql);
    issues.push({
      id: 'cast_colon',
      type: 'error',
      title: "Operador '::' no permitido en Storecheck",
      message: "El portal de Storecheck falla al procesar casteos con '::' (ej. campo::text). Debes usar la función estándar CAST(campo AS tipo).",
      canAutoFix: fixed !== sql,
      fixLabel: "Auto-corregir a CAST(...)",
      fixedSql: fixed,
    });
  }

  // 2. CTEs / Subqueries con 'WITH' exigen que el nombre del CTE empiece con 'project_'
  const cteRegex = /(?:WITH(?:\s+RECURSIVE)?|,)\s+([a-zA-Z0-9_]+)(?:\s*\([^)]*\))?\s+AS\s*\(/gi;
  const invalidCtes: string[] = [];
  let cteMatch;
  while ((cteMatch = cteRegex.exec(sql)) !== null) {
    const name = cteMatch[1];
    if (!name.toLowerCase().startsWith('project_') && !invalidCtes.includes(name)) {
      invalidCtes.push(name);
    }
  }

  if (invalidCtes.length > 0) {
    const fixed = fixWithProjectCteNames(sql);
    const examples = invalidCtes.map(n => `'${n}' ➔ 'project_${n}'`).join(', ');
    issues.push({
      id: 'with_project_underscore',
      type: 'error',
      title: "Nombre de subconsulta WITH debe iniciar con 'project_'",
      message: `En consultas con 'WITH', Storecheck exige que el nombre de cada subquery/CTE empiece con el prefijo 'project_' (${examples}) para que el parser no arroje error. El esquema de las tablas se mantiene normal como project&projectId&.`,
      canAutoFix: fixed !== sql,
      fixLabel: "Renombrar a project_*",
      fixedSql: fixed,
    });
  }

  // 3. El portal convierte todo a minúsculas (Advertencia de strings con mayúsculas)
  const uppercaseStringRegex = /'([^'\n\r]*?[A-Z][^'\n\r]*?)'/g;
  const matches = [...sql.matchAll(uppercaseStringRegex)];
  if (matches.length > 0) {
    const sampleMatches = Array.from(new Set(matches.map(m => m[0]))).slice(0, 3).join(', ');
    issues.push({
      id: 'uppercase_literal',
      type: 'warning',
      title: "Portal convierte todo el query a minúsculas",
      message: `Se detectaron cadenas con mayúsculas (${sampleMatches}). El portal convertirá todo el query a minúsculas antes de enviarlo a la BD. Si filtras columnas de texto (ej. en WHERE o JOIN), usa siempre LOWER(campo) = 'valor' o ILIKE para evitar filtros vacíos.`,
      canAutoFix: false,
    });
  }

  return issues;
}
