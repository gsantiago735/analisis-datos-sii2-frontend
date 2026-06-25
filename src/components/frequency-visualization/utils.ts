/** Formatea números grandes con separador de miles, es-CO. */
export function formatNumber(value: number, maxDecimals = 2): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

/** Formatea un porcentaje (0–100) con un decimal. */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Decide cuántos decimales mostrar según la magnitud, para que valores
 * muy pequeños (ej. 0.0058) no se vean como "0.00".
 */
export function smartDecimals(value: number): number {
  const abs = Math.abs(value);
  if (abs === 0) return 0;
  if (abs >= 100) return 0;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 3;
  return 4;
}
