import { ComponentType } from '../types/mobileReport';

export interface ExpectedColumn {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
}

export interface ComponentDocumentation {
  id: ComponentType;
  label: string;
  category: 'Indicador / Métrica' | 'Tablas y Listas' | 'Gráficas' | 'Estructura y Texto';
  summary: string;
  sqlExpectation: 'Primera Fila (Escalar / Registro Único)' | 'Múltiples Filas (Lista de Registros)' | 'Sin Consulta SQL (Estático)' | 'Primera Fila (Escalar) o Sin Consulta';
  expectedColumns: ExpectedColumn[];
  exampleSql: string;
  tips: string[];
}

export const MOBILE_COMPONENTS_CATALOG: ComponentDocumentation[] = [
  {
    id: 'resume',
    label: 'Resumen (Indicadores)',
    category: 'Indicador / Métrica',
    summary: 'Muestra una matriz de renglones y celdas con valores comparativos (ej. Actual vs Objetivo). Cada renglón toma sus columnas de la misma primera fila del query.',
    sqlExpectation: 'Primera Fila (Escalar / Registro Único)',
    expectedColumns: [
      { name: 'alias_de_cada_celda', type: 'numérico / texto', description: 'Cada alias definido en rows[].columns debe venir como columna en el SELECT.' },
    ],
    exampleSql: `SELECT 
    120 AS vendidos, 
    150 AS objetivo, 
    0.80 AS porcentaje_avance`,
    tips: [
      'El query debe devolver una sola fila con todos los alias que usarán los renglones.',
      'Si configuras detalle expandible (detail_datasource), debes definir la propiedad "key" en cada renglón.'
    ]
  },
  {
    id: 'table',
    label: 'Tabla / Tarjetas',
    category: 'Tablas y Listas',
    summary: 'Lista tabular o cuadrícula de tarjetas (layout: "cards") con paginación integrada y ordenamiento opcional.',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'primera_columna', type: 'texto / numérico', description: 'En layout "cards", esta primera columna se usa como el título principal de cada tarjeta.' },
      { name: 'columnas_secundarias', type: 'cualquiera', description: 'Alias correspondientes a las columnas configuradas en la tabla.' },
    ],
    exampleSql: `SELECT 
    p.place_dsc AS tienda, 
    COUNT(v.id) AS visitas_realizadas, 
    ROUND(AVG(v.score), 2) AS calificacion_promedio
FROM project&projectId&.f_visit v
JOIN project&projectId&.d_place p ON v.d_place_id = p.id
WHERE v.status = 'COMPLETED'
GROUP BY p.place_dsc
ORDER BY visitas_realizadas DESC`,
    tips: [
      'Requiere obligatoriamente un count_datasource que devuelva un conteo escalar (ej: SELECT COUNT(*) ...).',
      'En modo "cards", la primera columna no se formatea con sufijos (se usa limpia como título de la tarjeta).'
    ]
  },
  {
    id: 'basic_card',
    label: 'Tarjeta Básica',
    category: 'Indicador / Métrica',
    summary: 'Tarjeta para resaltar números o mensajes interpolados. Soporta variante "default" (texto con comodines &c_alias&) o "dual" (dos valores numéricos lado a lado).',
    sqlExpectation: 'Primera Fila (Escalar / Registro Único)',
    expectedColumns: [
      { name: 'left_col', type: 'numérico / texto', description: 'En variante dual: alias para el valor numérico izquierdo.', optional: true },
      { name: 'right_col', type: 'numérico / texto', description: 'En variante dual: alias para el valor numérico derecho.', optional: true },
      { name: 'alias_interpolado', type: 'cualquiera', description: 'En variante normal: alias que se reemplazan en descriptions con &c_alias&.', optional: true },
    ],
    exampleSql: `SELECT 
    'Superama Polanco' AS tienda, 
    1450 AS actual, 
    1800 AS objetivo`,
    tips: [
      'En variante default, puedes escribir en descriptions frases como: "Vendiste &c_actual& de &c_objetivo& unidades".',
      'En variante dual, define left_label y right_label para nombrar las dos columnas.'
    ]
  },
  {
    id: 'progress_bar',
    label: 'Barra de Progreso',
    category: 'Indicador / Métrica',
    summary: 'Muestra una barra horizontal de porcentaje con semáforo (success_min, warning_min). Soporta variante "default" o "hero".',
    sqlExpectation: 'Primera Fila (Escalar / Registro Único)',
    expectedColumns: [
      { name: 'percentage', type: 'numérico', description: 'Porcentaje de avance (0 a 100 o decimal 0 a 1).' },
      { name: 'target_percentage', type: 'numérico', description: 'Meta de porcentaje (opcional, ej. 100).', optional: true },
      { name: 'real', type: 'numérico', description: 'En variante hero: alias del puntaje/valor real (hero_score_col).', optional: true },
      { name: 'target', type: 'numérico', description: 'En variante hero: alias del objetivo total (hero_total_col).', optional: true },
    ],
    exampleSql: `SELECT 
    80 AS percentage, 
    8 AS real, 
    10 AS target, 
    100 AS target_percentage`,
    tips: [
      'Cuidado: si percentage devuelve 0 exacto, la app móvil interpreta que no hay datos en esta versión.',
      'Usa success_min: 0.7 y warning_min: 0.3 para definir los cortes verde, amarillo y rojo.'
    ]
  },
  {
    id: 'progress_circle',
    label: 'Círculo de Progreso',
    category: 'Indicador / Métrica',
    summary: 'Indicador circular tipo dona para cumplimiento y porcentajes con semaforización opcional.',
    sqlExpectation: 'Primera Fila (Escalar / Registro Único)',
    expectedColumns: [
      { name: 'percentage / value_col', type: 'numérico', description: 'Valor del avance (o numerador si se usa ratio).' },
      { name: 'target_col', type: 'numérico', description: 'Denominador u objetivo si el format es "ratio".', optional: true },
    ],
    exampleSql: `SELECT 
    8 AS realizadas, 
    10 AS objetivo`,
    tips: [
      'Si format es "ratio", muestra visualmente "8 / 10" y calcula el arco proporcionalmente.',
      'Si no defines target_col, el valor se toma directamente como porcentaje hasta 100.'
    ]
  },
  {
    id: 'metric_section',
    label: 'Sección de Métricas',
    category: 'Indicador / Métrica',
    summary: 'Conjunto de múltiples métricas dispuestas en renglón (layout: "row") o cuadrícula (layout: "grid").',
    sqlExpectation: 'Primera Fila (Escalar / Registro Único)',
    expectedColumns: [
      { name: 'alias_de_cada_metrica', type: 'numérico', description: 'Cada elemento en metrics[] debe tener un value_col que coincida con una columna del SELECT.' },
      { name: 'alias_target', type: 'numérico', description: 'Columna con el objetivo para métricas con target_col.', optional: true },
    ],
    exampleSql: `SELECT 
    85 AS realizadas, 
    100 AS planeadas, 
    0.92 AS disponibilidad, 
    0.78 AS share_of_shelf`,
    tips: [
      'Cada métrica en la lista metrics[] mapea su propio id, label, value_col y format ("percent" o "ratio").',
      'Soporta semáforos individuales heredando success_min y warning_min.'
    ]
  },
  {
    id: 'graph_bar',
    label: 'Gráfica de Barras',
    category: 'Gráficas',
    summary: 'Gráfica de barras vertical para comparar categorías, tiendas o períodos. Soporta una sola serie o multiserie.',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'label / label_col', type: 'texto', description: 'Etiqueta del eje X para cada barra o grupo de barras.' },
      { name: 'value', type: 'numérico', description: 'En una sola serie: valor de la altura de la barra.' },
      { name: 'color', type: 'texto (hex)', description: 'En una sola serie: color hexadecimal de la barra (ej: "#4F46E5").', optional: true },
      { name: 'series[].value_col', type: 'numérico', description: 'En multiserie: alias numérico correspondiente a cada serie.', optional: true },
    ],
    exampleSql: `-- Para una sola serie:
SELECT 'Bebidas' AS label, 120 AS value, '#4F46E5' AS color
UNION ALL
SELECT 'Snacks', 85, '#06B6D4'
UNION ALL
SELECT 'Lácteos', 95, '#10B981'`,
    tips: [
      'Para una sola serie, los alias requeridos son exactamente "label", "value" y opcionalmente "color".',
      'Para multiserie, configura label_col para la categoría y cada serie define su propio value_col.'
    ]
  },
  {
    id: 'graph_line',
    label: 'Gráfica de Línea',
    category: 'Gráficas',
    summary: 'Gráfica de líneas para tendencias en el tiempo (semanas, meses, días). Excelente para seguimiento multiserie (ej: Actual vs Objetivo).',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'label / label_col', type: 'texto', description: 'Etiqueta del eje temporal (semana, fecha, mes).' },
      { name: 'value', type: 'numérico', description: 'En una serie: valor numérico del punto.' },
      { name: 'series[].value_col', type: 'numérico', description: 'En multiserie: alias numérico de cada línea.', optional: true },
    ],
    exampleSql: `-- Ejemplo multiserie (tendencia semanal):
SELECT 'Semana 1' AS periodo, 10 AS actual, 12 AS objetivo
UNION ALL
SELECT 'Semana 2', 14, 15
UNION ALL
SELECT 'Semana 3', 18, 16
UNION ALL
SELECT 'Semana 4', 21, 20`,
    tips: [
      'En multiserie, define label_col: "periodo" y en series[] defines las líneas con su color y value_col.',
      'Asegúrate de ordenar los datos cronológicamente en el SQL.'
    ]
  },
  {
    id: 'graph_pie',
    label: 'Gráfica de Pastel',
    category: 'Gráficas',
    summary: 'Gráfica circular de pastel para mostrar distribución y composición de partes sobre un total (Share / Participación).',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'label', type: 'texto', description: 'Nombre del sector o rebanada.' },
      { name: 'value', type: 'numérico', description: 'Valor cuantitativo de la rebanada.' },
      { name: 'color', type: 'texto (hex)', description: 'Color hexadecimal opcional (ej: "#F59E0B").', optional: true },
    ],
    exampleSql: `SELECT 'Marca A' AS label, 45 AS value, '#4F46E5' AS color
UNION ALL
SELECT 'Marca B', 30, '#06B6D4'
UNION ALL
SELECT 'Otras Marcas', 25, '#94A3B8'`,
    tips: [
      'Los alias obligatorios en el SELECT deben ser exactamente "label" y "value".',
      'Si omites "color", la aplicación generará colores automáticamente.'
    ]
  },
  {
    id: 'graph_doughnut',
    label: 'Gráfica Doughnut',
    category: 'Gráficas',
    summary: 'Gráfica de dona circular, idéntica a la gráfica de pastel pero con espacio hueco central.',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'label', type: 'texto', description: 'Nombre del segmento.' },
      { name: 'value', type: 'numérico', description: 'Valor numérico del segmento.' },
      { name: 'color', type: 'texto (hex)', description: 'Color del segmento.', optional: true },
    ],
    exampleSql: `SELECT 'Completadas' AS label, 78 AS value, '#10B981' AS color
UNION ALL
SELECT 'Pendientes', 15, '#F59E0B'
UNION ALL
SELECT 'Canceladas', 7, '#EF4444'`,
    tips: [
      'Al igual que graph_pie, requiere alias exactos "label" y "value".'
    ]
  },
  {
    id: 'grouped_list',
    label: 'Lista Agrupada',
    category: 'Tablas y Listas',
    summary: 'Lista de elementos clasificados bajo encabezados de grupo (group_by) con buscador en tiempo real y badges de estado.',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'group_by', type: 'texto', description: 'Alias de la columna por la cual se agrupan los elementos (ej. categoría o estado).' },
      { name: 'list_label', type: 'texto', description: 'Alias del nombre o etiqueta principal de cada fila.' },
      { name: 'columnas_secundarias', type: 'cualquiera', description: 'Columnas adicionales que se muestran como datos secundarios o badges.' },
    ],
    exampleSql: `SELECT 
    'Presente' AS estado, 
    'Coca Cola Original 600ml' AS producto, 
    24 AS stock, 
    '$18.50' AS precio
UNION ALL
SELECT 'Agotado', 'Pepsi Regular 500ml', 0, '$16.00'`,
    tips: [
      'Configura group_by con el alias del agrupador (ej. "estado") y list_label con el identificador (ej. "producto").',
      'Puedes configurar badges mapeando valores exactos a estilos como "success" o "danger".'
    ]
  },
  {
    id: 'card_carousel',
    label: 'Carrusel de Tarjetas',
    category: 'Indicador / Métrica',
    summary: 'Deslizador horizontal de tarjetas compactas con porcentaje, etiqueta y navegación interactiva al dar clic.',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'label_col', type: 'texto', description: 'Alias para el nombre o texto de la tarjeta.' },
      { name: 'value_col', type: 'numérico', description: 'Alias para el valor o avance numérico (0 a 100).' },
      { name: 'color_col', type: 'texto (hex)', description: 'Alias con el color individual de cada tarjeta (opcional, fallback #3B82F6).', optional: true },
    ],
    exampleSql: `SELECT 
    'Bodega Aurrera San Juan' AS tienda, 
    85 AS avance, 
    '#10B981' AS color
UNION ALL
SELECT 'Walmart Toreo', 62, '#F59E0B'`,
    tips: [
      'Ideal para colocar debajo de filtros globales y permitir filtrar la pantalla al tocar una tarjeta usando nav_params.'
    ]
  },
  {
    id: 'history_list',
    label: 'Historial',
    category: 'Tablas y Listas',
    summary: 'Lista cronológica de eventos o mediciones agrupados por período (mes/semana) con fecha y valor.',
    sqlExpectation: 'Múltiples Filas (Lista de Registros)',
    expectedColumns: [
      { name: 'period_col', type: 'texto', description: 'Alias del período agrupador (ej. "Octubre 2026").' },
      { name: 'date_col', type: 'texto / fecha', description: 'Alias de la fecha o día del registro (ej. "12/10/2026").' },
      { name: 'value_col', type: 'numérico', description: 'Alias del valor medido.' },
    ],
    exampleSql: `SELECT 
    'Semana 41' AS periodo, 
    '12/10/2026' AS fecha, 
    0.88 AS avance
UNION ALL
SELECT 'Semana 41', '11/10/2026', 0.92`,
    tips: [
      'Soporta value_is_percent para multiplicar automáticamente por 100 si el valor viene entre 0 y 1.',
      'Soporta semáforos con success_min y warning_min.'
    ]
  },
  {
    id: 'notice',
    label: 'Aviso (Notice)',
    category: 'Estructura y Texto',
    summary: 'Banner informativo o de alerta con variantes de color (info, success, warning, danger). Puede ser estático o condicionado por SQL.',
    sqlExpectation: 'Primera Fila (Escalar) o Sin Consulta',
    expectedColumns: [
      { name: 'alias_interpolados', type: 'cualquiera', description: 'Si tiene datasource, sus columnas pueden usarse en el mensaje con &c_alias&.', optional: true },
    ],
    exampleSql: `-- Si devuelve al menos 1 fila, el aviso se muestra; si no devuelve filas, se oculta:
SELECT COUNT(*) AS pendientes 
FROM project&projectId&.f_visit 
WHERE status = 'PENDING'`,
    tips: [
      'Si no pones datasource, el aviso siempre será visible con el texto de message.',
      'Si pones datasource y la consulta devuelve 0 filas, el aviso se oculta automáticamente.'
    ]
  },
  {
    id: 'report_title',
    label: 'Título del Reporte',
    category: 'Estructura y Texto',
    summary: 'Encabezado superior del reporte con título, subtítulo e indicador de última actualización.',
    sqlExpectation: 'Primera Fila (Escalar) o Sin Consulta',
    expectedColumns: [
      { name: 'last_updated', type: 'fecha / timestamp', description: 'Si show_last_updated es true, se formatea esta columna como fecha de corte.', optional: true },
      { name: 'alias_dinamicos', type: 'cualquiera', description: 'Columnas para interpolar en el título con &c_alias&.', optional: true },
    ],
    exampleSql: `SELECT 
    'Región Centro' AS region, 
    CURRENT_DATE AS last_updated`,
    tips: [
      'Puedes usar &c_region& dentro del título: "Reporte Ejecutivo - &c_region&".'
    ]
  },
  {
    id: 'section_header',
    label: 'Encabezado de Sección',
    category: 'Estructura y Texto',
    summary: 'Separador visual estático para organizar el reporte en bloques temáticos.',
    sqlExpectation: 'Sin Consulta SQL (Estático)',
    expectedColumns: [],
    exampleSql: `-- No requiere consulta SQL`,
    tips: [
      'Solo requiere la propiedad "title". Se traduce automáticamente si existe en i18n o se muestra como texto literal.'
    ]
  },
  {
    id: 'grid_group',
    label: 'Cuadrícula (Grid)',
    category: 'Estructura y Texto',
    summary: 'Contenedor que distribuye componentes hijos en columnas (Bootstrap col-1 a col-12).',
    sqlExpectation: 'Sin Consulta SQL (Estático)',
    expectedColumns: [],
    exampleSql: `-- El contenedor no lleva SQL; cada componente hijo en "children" lleva su propia consulta.`,
    tips: [
      'Cada hijo dentro de children[] puede tener "col: 6" para 2 columnas iguales o "col: 4" para 3 columnas.',
      'Los componentes hijos no evalúan show_when propio; debes poner la regla en el grid_group raíz.'
    ]
  },
  {
    id: 'tab_group',
    label: 'Pestañas (Tabs)',
    category: 'Estructura y Texto',
    summary: 'Contenedor con pestañas superiores que cargan componentes hijos de forma diferida al hacer clic.',
    sqlExpectation: 'Sin Consulta SQL (Estático)',
    expectedColumns: [],
    exampleSql: `-- El contenedor no lleva SQL; cada pestaña contiene componentes hijos independientes.`,
    tips: [
      'Define en tabs[] objetos con { key: "id_pestana", label: "Texto", children: [...] }.',
      'Los hijos de pestañas sí admiten show_when y hide_when para navegación.'
    ]
  }
];

export function getComponentDoc(type: ComponentType): ComponentDocumentation | undefined {
  return MOBILE_COMPONENTS_CATALOG.find(c => c.id === type);
}
