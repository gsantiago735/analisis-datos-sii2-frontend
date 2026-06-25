/**
 * CU04 — Visualizar Frecuencias
 * Tipos compartidos por el dashboard de distribución de variables.
 *
 * Cuando conectes el backend real, estos son los tipos que tu API
 * debería devolver (o a los que deberías mapear su respuesta).
 */

export type VariableDataType = "INTEGER" | "DECIMAL" | "STRING";

/** Una categoría o rango dentro de la tabla/diagrama de frecuencias. */
export interface FrequencyBin {
  /** Etiqueta a mostrar en el eje (ej. "1 – 5" o "Bogotá"). */
  label: string;
  /** Frecuencia absoluta. */
  count: number;
}

/** Estadísticos para el diagrama de caja (boxplot). Null para variables STRING. */
export interface BoxplotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /**
   * Valores atípicos individuales fuera de los bigotes (1.5 * IQR), si tu
   * fuente de datos los expone. Úsalo cuando SÍ tienes cada valor puntual.
   */
  outliers: number[];
  /**
   * Conteo de atípicos cuando la fuente de datos solo entrega el número
   * total (ej. perfilamientos automáticos que dicen "29 atípicos" sin listar
   * cuáles). Si está presente y `outliers` está vacío, el BoxPlotChart
   * muestra un indicador de texto en vez de inventar puntos.
   */
  outlierCount?: number;
}

export interface VariableSummary {
  /** Identificador estable, usado como key y para deep-linking. */
  id: string;
  name: string;
  type: VariableDataType;
  /** Unidad opcional, ej. "m²", "semanas". */
  unit?: string;
  /** Media. Null en variables categóricas (STRING). */
  mean: number | null;
  /** Desviación estándar. Null en variables categóricas (STRING). */
  std: number | null;
  /** Categoría más frecuente — solo aplica a STRING. */
  mode?: string;
  /** Número de categorías distintas antes de agrupar — solo aplica a STRING. */
  distinctCount?: number;
  /** Total de observaciones consideradas (válidas, sin nulos). */
  totalCount: number;
  /** Registros nulos detectados para esta variable, si la fuente lo expone. */
  nullCount?: number;
  /** Tabla de frecuencias ya calculada (lista para tabla y barras). */
  bins: FrequencyBin[];
  /** Estadísticos de caja. Null en variables categóricas (STRING). */
  boxplot: BoxplotStats | null;
  /**
   * Excepción 4.1 del caso de uso: si había demasiadas categorías,
   * el sistema agrupa el resto en "Otros". Esta bandera lo señala en la UI.
   */
  groupedOthers?: boolean;
}

/** Forma esperada de la respuesta del backend (referencia para tu integración). */
export interface FrequencyApiResponse {
  datasetId: string;
  generatedAt: string;
  variables: VariableSummary[];
}
