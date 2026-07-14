// Tipos espejo de tus schemas Pydantic (perfilado/schemas.py y tablas_dinamicas/schemas.py)

export interface PerfiladoVariable {
  nombre: string;
  tipo: string; // AJUSTA: verifica los literales exactos que emite tu backend (p.ej. "numerica" | "categorica" | "temporal")
  validos: number;
  nulos: number;
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  atipicos?: number | null;
}

export interface PerfiladoResumen {
  registros: number;
  variables: number;
  completitud: number;
  registros_nulos: number;
  valores_atipicos: number;
  numericas: number;
  categoricas: number;
  temporales: number;
}

// Item de la lista que devuelve GET /carga/datasets (usado por el <select> de
// datasets). AJUSTA los nombres de campo según lo que realmente devuelva tu
// backend: aquí asumo un shape parecido al de PerfiladoResponse de arriba.
export interface DatasetItem {
  id: number;
  nombre: string; // AJUSTA: puede llamarse "nombre_dataset" o similar en tu API
  nombre_archivo?: string | null;
  fecha_subida?: string;
}

export interface PerfiladoResponse {
  dataset_id: number;
  dataset_nombre: string;
  nombre_archivo: string | null;
  fecha_subida: string;
  resumen: PerfiladoResumen;
  variables: PerfiladoVariable[];
  variable_detalle?: unknown;
}

export type FuncionAgregacion = 'sum' | 'mean' | 'count' | 'max' | 'min';

export interface PivotConfiguracion {
  filas: string[];
  columnas: string[];
  valores: string;
  funcion_agregacion: FuncionAgregacion;
}

export interface PivotRequest extends PivotConfiguracion {
  dataset_id: number;
}

export interface PivotResponse {
  dataset_id: number;
  configuracion: PivotConfiguracion;
  datos_pivot: Record<string, string | number | null>[];
  mensaje: string;
}

// Las server actions de api.ts solo pueden exportar funciones async (restricción
// de Next.js para módulos 'use server'), así que este tipo vive aquí en vez de ahí.
export type ResultadoApi<T> = { data: T; error?: undefined } | { data?: undefined; error: string };
