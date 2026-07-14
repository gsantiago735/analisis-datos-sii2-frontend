'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Download,
  Hash,
  Loader2,
  Scale,
  Sigma,
  Table2,
} from 'lucide-react';

import { generarTablaDinamica, getUserDatasetsAction, obtenerPerfilado } from './api';
import { inter, plexMono, spaceGrotesk } from './fonts';
import type { DatasetItem, FuncionAgregacion, PerfiladoResponse, PivotResponse } from './types';
// Cada server action ya devuelve { data } | { error }, no hace falta importar ResultadoApi aquí
import { VariablePicker } from './VariablePicker';

const FUNCIONES: { valor: FuncionAgregacion; etiqueta: string; icono: typeof Sigma }[] = [
  { valor: 'sum', etiqueta: 'Suma', icono: Sigma },
  { valor: 'mean', etiqueta: 'Promedio', icono: Scale },
  { valor: 'count', etiqueta: 'Conteo', icono: Hash },
  { valor: 'max', etiqueta: 'Máximo', icono: ArrowUpToLine },
  { valor: 'min', etiqueta: 'Mínimo', icono: ArrowDownToLine },
];

const FUNCIONES_MATEMATICAS: FuncionAgregacion[] = ['sum', 'mean'];

// AJUSTA ESTO si tu backend usa literales de "tipo" distintos a los que contienen
// estas subcadenas (p.ej. "numerica", "int64", "float64" sí calzan; revisa los tuyos).
function pareceNumerica(tipo: string): boolean {
  const t = tipo.toLowerCase();
  return t.includes('num') || t.includes('int') || t.includes('float');
}

const theme = {
  '--bg': '#F5F6F8',
  '--surface': '#FFFFFF',
  '--ink': '#12141C',
  '--ink-muted': '#5B6472',
  '--border': '#DEE1E6',
  '--accent': '#0E7C66',
  '--accent-ink': '#0B5C4C',
  '--accent-soft': '#E4F2EE',
  '--warn': '#B45309',
  '--warn-soft': '#FDF2E3',
  '--danger': '#B42318',
  '--danger-soft': '#FBEAE8',
} as React.CSSProperties;

export default function TablaDinamicaBuilder() {
  // Lista de datasets del usuario, para el <select> que reemplaza al [datasetId] de la ruta
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [cargandoDatasets, setCargandoDatasets] = useState(true);
  const [errorDatasets, setErrorDatasets] = useState<string | null>(null);

  // Dataset elegido en el <select>. null mientras el usuario no ha elegido ninguno.
  const [datasetId, setDatasetId] = useState<number | null>(null);

  const [perfilado, setPerfilado] = useState<PerfiladoResponse | null>(null);
  const [cargandoColumnas, setCargandoColumnas] = useState(false);
  const [errorColumnas, setErrorColumnas] = useState<string | null>(null);

  const [filas, setFilas] = useState<string[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [valor, setValor] = useState<string[]>([]);
  const [funcion, setFuncion] = useState<FuncionAgregacion>('sum');
  const [autoActualizar, setAutoActualizar] = useState(true);

  const [resultado, setResultado] = useState<PivotResponse | null>(null);
  const [cargandoPivot, setCargandoPivot] = useState(false);
  const [errorPivot, setErrorPivot] = useState<string | null>(null);
  const [tardando, setTardando] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carga de la lista de datasets del usuario para el <select> (GET /carga/datasets).
  // Ya no se lee ningún [datasetId] de la ruta: se corre una sola vez al montar.
  useEffect(() => {
    let activo = true;
    setCargandoDatasets(true);
    setErrorDatasets(null);
    getUserDatasetsAction()
      .then((res) => {
        if (!activo) return;
        if (res.error) setErrorDatasets(res.error);
        setDatasets(res.datasets);
      })
      .catch((err: Error) => {
        if (activo) setErrorDatasets(err.message);
      })
      .finally(() => {
        if (activo) setCargandoDatasets(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Carga de variables del dataset elegido (GET /perfilado/datasets/{id}).
  // Se dispara cada vez que el usuario cambia la selección en el <select>, y
  // limpia la configuración previa porque las variables de un dataset no
  // necesariamente existen en otro.
  useEffect(() => {
    if (datasetId === null) {
      setPerfilado(null);
      return;
    }

    let activo = true;
    setCargandoColumnas(true);
    setErrorColumnas(null);
    setFilas([]);
    setColumnas([]);
    setValor([]);
    setResultado(null);
    setErrorPivot(null);

    obtenerPerfilado(datasetId)
      .then((res) => {
        if (!activo) return;
        if (res.error) {
          setErrorColumnas(res.error);
        } else {
          setPerfilado(res.data);
        }
      })
      .catch((err: Error) => {
        // solo cubre fallos inesperados de la propia server action, no errores del backend
        if (activo) setErrorColumnas(err.message);
      })
      .finally(() => {
        if (activo) setCargandoColumnas(false);
      });
    return () => {
      activo = false;
    };
  }, [datasetId]);

  const generar = useCallback(() => {
    if (datasetId === null || filas.length === 0 || valor.length === 0) return;

    setCargandoPivot(true);
    setErrorPivot(null);
    setTardando(false);
    slowTimerRef.current = setTimeout(() => setTardando(true), 2500);

    generarTablaDinamica({
      dataset_id: datasetId,
      filas,
      columnas,
      valores: valor[0],
      funcion_agregacion: funcion,
    })
      .then((res) => {
        if (res.error) {
          setErrorPivot(res.error);
          setResultado(null);
        } else {
          setResultado(res.data);
        }
      })
      .catch((err: Error) => {
        // solo cubre fallos inesperados de la propia server action, no errores del backend
        setErrorPivot(err.message);
        setResultado(null);
      })
      .finally(() => {
        setCargandoPivot(false);
        setTardando(false);
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      });
  }, [datasetId, filas, columnas, valor, funcion]);

  // Actualización en tiempo real al modificar filtros/dimensiones (paso 4-5 del CU06)
  useEffect(() => {
    if (!autoActualizar) return;
    if (datasetId === null || filas.length === 0 || valor.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generar(), 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, filas, columnas, valor, funcion, autoActualizar]);

  const variables = perfilado?.variables ?? [];
  const variableValor = variables.find((v) => v.nombre === valor[0]);
  const advertenciaNumerica =
    !!variableValor && FUNCIONES_MATEMATICAS.includes(funcion) && !pareceNumerica(variableValor.tipo);

  const puedeGenerar = filas.length > 0 && valor.length > 0;

  const columnasTabla = resultado?.datos_pivot?.length ? Object.keys(resultado.datos_pivot[0]) : [];
  const columnasFilas = resultado?.configuracion?.filas ?? [];

  function exportarCSV() {
    if (!resultado?.datos_pivot?.length) return;
    const encabezados = columnasTabla;
    const filasCSV = resultado.datos_pivot.map((fila) =>
      encabezados.map((c) => JSON.stringify(fila[c] ?? '')).join(',')
    );
    const csv = [encabezados.join(','), ...filasCSV].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabla_dinamica_dataset_${datasetId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={theme} className={`${inter.className} min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-8`}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-ink)]">
                CU06 · Exploración interactiva
              </p>
              <h1 className={`${spaceGrotesk.className} mt-1 text-2xl font-semibold text-[var(--ink)] sm:text-3xl`}>
                {perfilado?.dataset_nombre ??
                  (datasetId === null
                    ? 'Selecciona un dataset'
                    : cargandoColumnas
                      ? 'Cargando dataset…'
                      : 'Tablas dinámicas')}
              </h1>
              {perfilado && (
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {perfilado.resumen.registros.toLocaleString('es-CO')} registros · {perfilado.resumen.variables}{' '}
                  variables · {perfilado.resumen.completitud.toFixed(1)}% completitud
                </p>
              )}
            </div>

            <div className="min-w-[220px]">
              <label htmlFor="dataset-select" className="mb-1 block text-xs font-medium text-[var(--ink-muted)]">
                Dataset
              </label>
              <select
                id="dataset-select"
                value={datasetId ?? ''}
                disabled={cargandoDatasets || datasets.length === 0}
                onChange={(e) => setDatasetId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors focus:border-[var(--accent)] focus:outline-none disabled:cursor-not-allowed disabled:text-[var(--ink-muted)]"
              >
                <option value="" disabled>
                  {cargandoDatasets
                    ? 'Cargando datasets…'
                    : datasets.length === 0
                      ? 'No tienes datasets'
                      : 'Elige un dataset…'}
                </option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorDatasets && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>No se pudieron cargar tus datasets: {errorDatasets}</span>
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Panel de configuración */}
          <aside className="h-fit space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <h2 className={`${spaceGrotesk.className} text-sm font-semibold text-[var(--ink)]`}>
                Configuración
              </h2>
              <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                Auto
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoActualizar}
                  onClick={() => setAutoActualizar((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    autoActualizar ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      autoActualizar ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>

            {datasetId === null ? (
              <p className="rounded-md border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-[var(--ink-muted)]">
                Elige un dataset arriba para configurar la tabla dinámica.
              </p>
            ) : errorColumnas ? (
              <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">
                No se pudieron cargar las variables: {errorColumnas}
              </div>
            ) : (
              <>
                <VariablePicker
                  label="Filas"
                  helper="Requerido"
                  variables={variables}
                  mode="multi"
                  selected={filas}
                  disabledNames={columnas}
                  onChange={setFilas}
                  emptyMessage={cargandoColumnas ? 'Cargando variables…' : 'Sin variables disponibles.'}
                />
                <VariablePicker
                  label="Columnas"
                  helper="Opcional"
                  variables={variables}
                  mode="multi"
                  selected={columnas}
                  disabledNames={filas}
                  onChange={setColumnas}
                  emptyMessage={cargandoColumnas ? 'Cargando variables…' : 'Sin variables disponibles.'}
                />
                <VariablePicker
                  label="Valor a medir"
                  helper="Requerido"
                  variables={variables}
                  mode="single"
                  selected={valor}
                  onChange={setValor}
                  emptyMessage={cargandoColumnas ? 'Cargando variables…' : 'Sin variables disponibles.'}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                    Función de agregación
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FUNCIONES.map(({ valor: fVal, etiqueta, icono: Icono }) => (
                      <button
                        key={fVal}
                        type="button"
                        onClick={() => setFuncion(fVal)}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          funcion === fVal
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                            : 'border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-ink)]'
                        }`}
                      >
                        <Icono className="h-3.5 w-3.5" /> {etiqueta}
                      </button>
                    ))}
                  </div>
                </div>

                {advertenciaNumerica && (
                  <div className="flex items-start gap-2 rounded-lg border border-[var(--warn)]/25 bg-[var(--warn-soft)] p-3 text-xs text-[var(--warn)]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      &quot;{valor[0]}&quot; no parece numérica.{' '}
                      {FUNCIONES.find((f) => f.valor === funcion)?.etiqueta} podría fallar: prueba con Conteo.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={generar}
                  disabled={!puedeGenerar || cargandoPivot}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-ink)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--ink-muted)]"
                >
                  {cargandoPivot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table2 className="h-4 w-4" />}
                  {cargandoPivot ? 'Generando…' : 'Generar tabla'}
                </button>
              </>
            )}
          </aside>

          {/* Resultado */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className={`${plexMono.className} rounded-md bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink-muted)]`}
                >
                  {resultado
                    ? `${FUNCIONES.find((f) => f.valor === resultado.configuracion.funcion_agregacion)?.etiqueta.toUpperCase()}(${resultado.configuracion.valores})`
                    : 'fx'}
                </span>
                <span className="text-sm text-[var(--ink-muted)]">
                  {resultado ? `${resultado.datos_pivot.length} filas` : 'Sin datos aún'}
                </span>
              </div>
              {resultado && resultado.datos_pivot.length > 0 && (
                <button
                  type="button"
                  onClick={exportarCSV}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                >
                  <Download className="h-3.5 w-3.5" /> Exportar CSV
                </button>
              )}
            </div>

            <div className="p-5">
              {errorPivot && (
                <div className="flex items-start gap-3 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--danger)]">No se pudo generar la tabla</p>
                    <p className="mt-0.5 text-sm text-[var(--ink)]">{errorPivot}</p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      Ajusta la selección de variables e inténtalo de nuevo.
                    </p>
                  </div>
                </div>
              )}

              {!errorPivot && cargandoPivot && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                  <p className="text-sm text-[var(--ink-muted)]">Procesando datos…</p>
                  {tardando && (
                    <p className="text-xs text-[var(--ink-muted)]">
                      Los datasets grandes pueden tardar unos segundos más.
                    </p>
                  )}
                </div>
              )}

              {!cargandoPivot && !errorPivot && !resultado && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Table2 className="h-6 w-6 text-[var(--ink-muted)]" />
                  <p className="max-w-xs text-sm text-[var(--ink-muted)]">
                    {datasetId === null
                      ? 'Elige un dataset para comenzar.'
                      : 'Selecciona al menos una variable de fila y un valor a medir para comenzar.'}
                  </p>
                </div>
              )}

              {!cargandoPivot && !errorPivot && resultado && resultado.datos_pivot.length > 0 && (
                <div className="max-h-[28rem] overflow-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                      <tr>
                        {columnasTabla.map((col) => {
                          const esFila = columnasFilas.includes(col);
                          return (
                            <th
                              key={col}
                              className={`sticky top-0 z-10 border-b border-[var(--border)] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] ${
                                esFila ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)]' : 'bg-[var(--bg)]'
                              }`}
                            >
                              {col}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.datos_pivot.map((fila, i) => (
                        <tr key={i} className="odd:bg-white even:bg-[var(--bg)]/50 hover:bg-[var(--accent-soft)]/40">
                          {columnasTabla.map((col) => {
                            const val = fila[col];
                            const esNumero = typeof val === 'number';
                            return (
                              <td
                                key={col}
                                className={`border-b border-[var(--border)] px-3 py-2 text-[var(--ink)] ${
                                  esNumero ? `${plexMono.className} tabular-nums text-right` : 'text-left'
                                }`}
                              >
                                {val === null || val === undefined
                                  ? '—'
                                  : esNumero
                                    ? (val as number).toLocaleString('es-CO')
                                    : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
