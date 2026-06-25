import type { VariableSummary } from "./types";

// Convierte strings tipo "132,30" o "9,43" a números flotantes de JavaScript
const parseSpanishFloat = (val: string | undefined | null): number => {
  if (!val) return 0;
  const sanitized = val.replace(/\./g, "").replace(",", ".");
  return parseFloat(sanitized);
};

// Extrae el valor de la estadística según su etiqueta en el JSON
const getStatValue = (stats: Array<{ etiqueta: string; valor: string }>, label: string): string | undefined => {
  return stats.find((s) => s.etiqueta.toLowerCase() === label.toLowerCase())?.valor;
};

/**
 * Transforma el JSON crudo del backend al formato VariableSummary[]
 */
export function transformBackendJson(backendJson: any): VariableSummary[] {
  if (!backendJson || !backendJson.variables) return [];

  return backendJson.variables.map((v: any) => {
    const detalle = backendJson.detalles_variables?.[v.nombre];
    const stats = detalle?.estadisticas || [];

    let mappedType: "INTEGER" | "DECIMAL" | "STRING" = "STRING";
    let mean: number | null = null;
    let std: number | null = null;
    let mode: string | undefined = undefined;
    let distinctCount: number | undefined = undefined;
    let boxplot: VariableSummary["boxplot"] = null;

    // Procesar variables numéricas (Age, RestingBP, Cholesterol, etc.)
    if (v.tipo === "Numérica") {
      const promedioStr = getStatValue(stats, "Promedio");
      const desvStr = getStatValue(stats, "Desv. estándar");
      const minimoStr = getStatValue(stats, "Mínimo");
      const maximoStr = getStatValue(stats, "Máximo");

      mean = promedioStr ? parseSpanishFloat(promedioStr) : 0;
      std = desvStr ? parseSpanishFloat(desvStr) : 0;

      // Detectar tipo basado en si hay decimales significativos
      const hasDecimals = 
        (promedioStr && !promedioStr.endsWith(",00")) || 
        (desvStr && !desvStr.endsWith(",00"));
      
      mappedType = hasDecimals ? "DECIMAL" : "INTEGER";

      boxplot = {
        min: parseSpanishFloat(minimoStr),
        q1: v.q1 ?? 0,
        median: v.q2 ?? parseSpanishFloat(getStatValue(stats, "Mediana")),
        q3: v.q3 ?? 0,
        max: parseSpanishFloat(maximoStr),
        outliers: [], // El JSON provee el conteo (v.atipicos), mapeamos vacío por compatibilidad
      };
    } 
    // Procesar variables categóricas (Sex, ChestPainType, RestingECG, etc.)
    else if (v.tipo === "Categórica") {
      mappedType = "STRING";
      mode = getStatValue(stats, "Más frecuente");
      const unicosStr = getStatValue(stats, "Valores únicos");
      distinctCount = unicosStr ? parseInt(unicosStr, 10) : undefined;
    }

    console.log(detalle?.distribucion);
    
    // Mapear la distribución de frecuencias a los 'bins' del gráfico
    const bins = (detalle?.distribucion || []).map((d: any) => (console.log("ddada",d)));

    const summary: any = {
      id: v.nombre.toLowerCase().replace(/\s+/g, "_"),
      name: v.nombre,
      type: mappedType,
      mean,
      std,
      totalCount: v.validos,
      bins,
      boxplot,
    };

    if (mode !== undefined) summary.mode = mode;
    if (distinctCount !== undefined) summary.distinctCount = distinctCount;

    return summary as VariableSummary;
  });
}