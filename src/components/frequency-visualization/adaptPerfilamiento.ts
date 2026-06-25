/**
 * Adaptador: respuesta real de tu backend (`ProfileResponse`,
 * `getDatasetProfileAction`) -> VariableSummary[] / VariableSummary
 *
 * Tu API NO devuelve el detalle de todas las variables de una sola vez.
 * Devuelve:
 *
 *   - `variables: ProfileVariable[]`   -> metadatos livianos de TODAS las
 *                                         variables (nombre, tipo, q1/q2/q3,
 *                                         atípicos). Suficiente para pintar
 *                                         la grilla inicial, pero SIN bins
 *                                         ni estadísticas completas.
 *   - `variable_detalle?: ProfileDetail` -> detalle COMPLETO de UNA sola
 *                                         variable (bins, estadísticas),
 *                                         la que se pidió con `?variable=`.
 *
 * Por eso este archivo expone dos funciones separadas:
 *
 *   1. `adaptProfileResponse(json)` — arma el `VariableSummary[]` inicial
 *      para la grilla, con lo que hay disponible en `variables[]` (sin
 *      bins, porque el backend no los manda en este paso).
 *
 *   2. `adaptProfileDetail(detalle, resumenVar?)` — convierte el detalle de
 *      UNA variable (`variable_detalle`) en su `VariableSummary` completo,
 *      con bins y boxplot. Úsala dentro de `onSelectVariable` para
 *      completar la tarjeta cuando el analista abre el modal.
 *
 * Si tu backend cambiara y empezara a mandar `detalles_variables` para
 * todas las variables a la vez, no necesitarías estas dos funciones por
 * separado — pero hoy por hoy (según `ProfileResponse`) sí las necesitas.
 */

import type { BoxplotStats, FrequencyBin, VariableSummary, VariableDataType } from "./types";

// ---------------------------------------------------------------------------
// Forma real del JSON que entrega tu backend (calcada de tus interfaces
// ProfileResponse / ProfileVariable / ProfileDetail). Si tu backend cambia
// el contrato, ajusta solo estas interfaces.
// ---------------------------------------------------------------------------

export interface ProfileEstadistica {
  etiqueta: string;
  valor: string;
}

export interface ProfileDistributionBin {
  rango: string;
  cantidad: number;
}

export interface ProfileRange {
  rango: string;
  porcentaje: number;
}

/** Metadatos livianos de una variable — lo que viene en `variables[]`. */
export interface ProfileVariable {
  nombre: string;
  tipo: string;
  validos: number;
  nulos: number;
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  atipicos?: number | null;
}

/** Detalle completo de UNA variable — lo que viene en `variable_detalle`. */
export interface ProfileDetail {
  nombre: string;
  tipo: string;
  validos: number;
  nulos: number;
  estadisticas: ProfileEstadistica[];
  distribucion: ProfileDistributionBin[];
  porcentajes: ProfileRange[];
}

export interface ProfileSummary {
  registros: number;
  variables: number;
  completitud: number;
  registros_nulos: number;
  valores_atipicos: number;
  numericas: number;
  categoricas: number;
  temporales: number;
}

export interface ProfileResponse {
  dataset_id: number;
  dataset_nombre: string;
  nombre_archivo?: string | null;
  fecha_subida: string;
  resumen: ProfileSummary;
  variables: ProfileVariable[];
  variable_detalle?: ProfileDetail | null;
}

// ---------------------------------------------------------------------------
// Helpers de parseo (compartidos por ambas funciones de adaptación)
// ---------------------------------------------------------------------------

/**
 * Tu backend manda algunos números como strings en formato es-CO, con coma
 * decimal y a veces separador de miles con punto (ej. "1.234,56", "53,51").
 * Esta función los normaliza a `number` de JS. También acepta números ya
 * parseados (por si en algún campo vienen como `number` directamente).
 */
function parseEsNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—" || trimmed === "-") return null;

  // "1.234,56" -> quita puntos de miles, cambia la coma decimal por punto.
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function findStat(stats: ProfileEstadistica[], etiqueta: string): string | null {
  const found = stats.find((s) => s.etiqueta === etiqueta);
  return found ? found.valor : null;
}

/** "Q1 47,00 · Q3 60,00" -> { q1: 47, q3: 60 } */
function parseCuartilesString(raw: string | null): { q1: number | null; q3: number | null } {
  if (!raw) return { q1: null, q3: null };
  const q1Match = raw.match(/Q1\s*([\d.,]+)/i);
  const q3Match = raw.match(/Q3\s*([\d.,]+)/i);
  return {
    q1: q1Match ? parseEsNumber(q1Match[1]) : null,
    q3: q3Match ? parseEsNumber(q3Match[1]) : null,
  };
}

function isCategorical(tipo: string): boolean {
  return tipo === "Categórica" || tipo.toLowerCase() === "categorica" || tipo.toLowerCase() === "string";
}

function inferNumericSubtype(values: Array<number | null | undefined>): VariableDataType {
  const known = values.filter((v): v is number => v !== null && v !== undefined);
  if (known.length === 0) return "INTEGER";
  const hasDecimals = known.some((v) => Math.abs(v - Math.round(v)) > 1e-9);
  return hasDecimals ? "DECIMAL" : "INTEGER";
}

// ---------------------------------------------------------------------------
// Cálculo de respaldo: si faltara media/desviación y no vinieran en
// `estadisticas`, las derivamos desde los bins de distribución (aproximando
// cada bin por su punto medio). Es una aproximación, no el valor exacto,
// pero evita que el dashboard se quede sin dato.
// ---------------------------------------------------------------------------

function binMidpoint(rango: string): number | null {
  // Formatos vistos: "(27.951, 37.8]", "37.8", "(-0.2, 40.0]"
  const rangeMatch = rango.match(/\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]?/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  }
  const single = Number(rango);
  return Number.isFinite(single) ? single : null;
}

function estimateMeanStdFromBins(bins: FrequencyBin[]): { mean: number | null; std: number | null } {
  const points = bins
    .map((b) => ({ mid: binMidpoint(b.label), count: b.count }))
    .filter((p): p is { mid: number; count: number } => p.mid !== null);

  const total = points.reduce((acc, p) => acc + p.count, 0);
  if (total === 0) return { mean: null, std: null };

  const mean = points.reduce((acc, p) => acc + p.mid * p.count, 0) / total;
  const variance = points.reduce((acc, p) => acc + p.count * (p.mid - mean) ** 2, 0) / total;
  return { mean, std: Math.sqrt(variance) };
}

// ---------------------------------------------------------------------------
// 1. Adaptación LIVIANA — para la grilla inicial (sin bins, tu backend no
//    los manda en `variables[]`). El boxplot se puede construir igual con
//    q1/q2/q3 + min/max estimados (no tenemos min/max reales aquí, así que
//    el boxplot completo se deja para cuando se abra el detalle).
// ---------------------------------------------------------------------------

function adaptLightVariable(v: ProfileVariable): VariableSummary {
  const categorical = isCategorical(v.tipo);
  const totalCount = v.validos;
  const nullCount = v.nulos ?? undefined;

  if (categorical) {
    return {
      id: v.nombre,
      name: v.nombre,
      type: "STRING",
      mean: null,
      std: null,
      totalCount,
      nullCount,
      bins: [], // Sin distribución todavía — llega con el detalle.
      boxplot: null,
    };
  }

  const q1 = v.q1 ?? null;
  const median = v.q2 ?? null;
  const q3 = v.q3 ?? null;
  const type = inferNumericSubtype([q1, median, q3]);

  // Sin min/max reales en este punto, así que NO armamos un boxplot a
  // medias — VariableCard ya maneja boxplot:null mostrando "No aplica" si
  // tu UI lo necesitara, pero aquí preferimos esperar al detalle completo
  // para no dibujar una caja con datos incompletos/erróneos.
  return {
    id: v.nombre,
    name: v.nombre,
    type,
    mean: null,
    std: null,
    totalCount,
    nullCount,
    bins: [],
    boxplot: null,
  };
}

/**
 * Adapta la lista liviana `ProfileResponse.variables` (SIN bins ni
 * boxplot — tu backend no los manda hasta que pides el detalle de una
 * variable puntual). Úsala para la grilla inicial de `FrequencyDashboard`.
 *
 *   const { profile } = await getDatasetProfileAction(datasetId);
 *   const variables = adaptProfileResponse(profile);
 *   <FrequencyDashboard variables={variables} onSelectVariable={...} />
 */
export function adaptProfileResponse(json: ProfileResponse): VariableSummary[] {
  return json.variables.map(adaptLightVariable);
}

// ---------------------------------------------------------------------------
// 2. Adaptación COMPLETA — para el detalle de una variable puntual
//    (ProfileDetail = json.variable_detalle). Aquí sí tenemos bins y
//    estadísticas, así que se construye el VariableSummary completo.
// ---------------------------------------------------------------------------

/**
 * Convierte el detalle completo de UNA variable (`ProfileDetail`, lo que
 * llega en `variable_detalle` al pedir `?variable=nombre`) en su
 * `VariableSummary` completo, con bins y boxplot listos para el modal.
 *
 * @param detalle      El objeto `variable_detalle` devuelto por el backend.
 * @param resumenVar   (Opcional) la entrada liviana de `variables[]` para
 *                      esa misma variable — se usa como respaldo de
 *                      q1/q2/q3/atípicos si el texto de `estadisticas` no
 *                      los trajera por algún motivo.
 */
export function adaptProfileDetail(detalle: ProfileDetail, resumenVar?: ProfileVariable): VariableSummary {
  const categorical = isCategorical(detalle.tipo);
  const totalCount = detalle.validos;
  const nullCount = detalle.nulos ?? undefined;

  const bins: FrequencyBin[] = detalle.distribucion.map((d) => ({ label: d.rango, count: d.cantidad }));

  // Excepción 4.1 del CU04: si es categórica con muchas categorías y el
  // backend ya agrupó el resto, lo detectamos buscando una etiqueta "Otros".
  const groupedOthers = categorical && bins.some((b) => /^otros/i.test(b.label));

  if (categorical) {
    const distinctCountRaw = findStat(detalle.estadisticas, "Valores únicos");
    const mode = findStat(detalle.estadisticas, "Más frecuente") ?? undefined;

    return {
      id: detalle.nombre,
      name: detalle.nombre,
      type: "STRING",
      mean: null,
      std: null,
      mode,
      distinctCount: distinctCountRaw ? Number(distinctCountRaw) : bins.length,
      totalCount,
      nullCount,
      bins,
      boxplot: null,
      groupedOthers: groupedOthers || undefined,
    };
  }

  // --- variable numérica ---
  const stats = detalle.estadisticas;
  const min = parseEsNumber(findStat(stats, "Mínimo"));
  const max = parseEsNumber(findStat(stats, "Máximo"));
  const mean = parseEsNumber(findStat(stats, "Promedio"));
  const median = parseEsNumber(findStat(stats, "Mediana")) ?? resumenVar?.q2 ?? null;
  const std = parseEsNumber(findStat(stats, "Desv. estándar"));
  const cuartilesRaw = findStat(stats, "Cuartiles");
  const { q1: q1FromString, q3: q3FromString } = parseCuartilesString(cuartilesRaw);

  // Preferimos el texto de `estadisticas`; si no está, caemos al resumen
  // liviano (`variables[]`), que también trae q1/q3 ya calculados.
  const q1 = q1FromString ?? resumenVar?.q1 ?? null;
  const q3 = q3FromString ?? resumenVar?.q3 ?? null;

  // Respaldo: si no vino mean/std en el texto, lo calculamos aproximando
  // con los puntos medios de cada bin.
  const fallback = mean === null || std === null ? estimateMeanStdFromBins(bins) : { mean: null, std: null };
  const finalMean = mean ?? fallback.mean ?? null;
  const finalStd = std ?? fallback.std ?? null;

  const outlierCount = resumenVar?.atipicos ?? undefined;

  const boxplot: BoxplotStats | null =
    min !== null && max !== null && q1 !== null && q3 !== null && median !== null
      ? {
          min,
          q1,
          median,
          q3,
          max,
          // El backend solo entrega el TOTAL de atípicos, no los valores
          // puntuales. No inventamos puntos: se exponen como `outlierCount`
          // y el BoxPlotChart muestra un aviso de texto en vez de puntos.
          outliers: [],
          outlierCount: outlierCount ?? undefined,
        }
      : null;

  const type = inferNumericSubtype([median, q1, q3, min, max]);

  return {
    id: detalle.nombre,
    name: detalle.nombre,
    type,
    mean: finalMean,
    std: finalStd,
    totalCount,
    nullCount,
    bins,
    boxplot,
  };
}

/**
 * Conveniencia: si tu Server Action ya devuelve el `ProfileResponse`
 * completo CON `variable_detalle` resuelto (porque pasaste `variable` al
 * pedirlo), esta función arma directamente el `VariableSummary` completo
 * de esa variable, buscando su entrada liviana en `variables[]` como
 * respaldo de q1/q3/atípicos.
 */
export function adaptProfileResponseDetail(json: ProfileResponse): VariableSummary | null {
  if (!json.variable_detalle) return null;
  const resumenVar = json.variables.find((v) => v.nombre === json.variable_detalle!.nombre);
  return adaptProfileDetail(json.variable_detalle, resumenVar);
}
