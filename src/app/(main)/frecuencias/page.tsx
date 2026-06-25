"use client";

import { useEffect, useState } from "react";
import { FrequencyDashboard } from "@/components/frequency-visualization/FrequencyDashboard";
import {
  adaptProfileResponse,
  adaptProfileResponseDetail,
  type VariableSummary,
  type DatasetOption,
} from "@/components/frequency-visualization";
import { getDatasetProfileAction } from "@/app/actions/profile";
import { getUserDatasetsAction } from "@/app/actions/datasets";

export default function FrequencyPage() {
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);

  const [variables, setVariables] = useState<VariableSummary[]>([]);

  // `loading` cubre la carga INICIAL (datasets + primer perfilado). Una vez
  // que ya hay algo en pantalla, cambiar de dataset usa `loadingDataset` en
  // su lugar, para no volver a mostrar la pantalla completa de carga.
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDataset, setLoadingDataset] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Al montar: traemos los datasets del usuario y, con el primero de la
  //    lista, disparamos la carga inicial del perfilado.
  useEffect(() => {
    let cancelado = false;

    async function init() {
      setLoading(true);
      setError(null);

      const resultadoDatasets = await getUserDatasetsAction();

      if (cancelado) return;

      if (resultadoDatasets.error) {
        setError(resultadoDatasets.error);
        setLoading(false);
        return;
      }

      const opciones: DatasetOption[] = resultadoDatasets.datasets.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        nombreArchivo: d.nombre_archivo ?? null,
      }));

      setDatasets(opciones);

      if (opciones.length === 0) {
        setLoading(false);
        return;
      }

      // Primer dataset del usuario por defecto.
      const primero = opciones[0];
      setSelectedDatasetId(primero.id);
      await cargarPerfilado(primero.id, { esCargaInicial: true, cancelado: () => cancelado });
    }

    init();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Carga (o recarga) del perfilado de UN dataset puntual: primero pinta
  //    los metadatos livianos, y luego completa cada card en paralelo con
  //    su detalle (bins + boxplot), igual que antes — solo que ahora puede
  //    repetirse cada vez que el usuario cambia el dataset seleccionado.
  async function cargarPerfilado(
    datasetId: number,
    opts: { esCargaInicial?: boolean; cancelado?: () => boolean } = {}
  ) {
    const yaCancelado = () => opts.cancelado?.() ?? false;

    try {
      if (opts.esCargaInicial) {
        setLoading(true);
      } else {
        setLoadingDataset(true);
      }
      setError(null);

      const resultado = await getDatasetProfileAction(datasetId);

      if (yaCancelado()) return;

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      if (!resultado.profile) return;

      const livianas = adaptProfileResponse(resultado.profile);
      setVariables(livianas);

      if (opts.esCargaInicial) setLoading(false);
      else setLoadingDataset(false);

      // Completa cada card en paralelo con su detalle (bins + boxplot),
      // sin bloquear el render. Si el usuario cambia de dataset de nuevo
      // mientras esto corre, `yaCancelado()` evita pisar el estado nuevo
      // con datos del dataset anterior.
      livianas.forEach(async (variable) => {
        try {
          const detalleResultado = await getDatasetProfileAction(datasetId, variable.name);
          if (yaCancelado() || detalleResultado.error || !detalleResultado.profile) return;

          const completo = adaptProfileResponseDetail(detalleResultado.profile);
          if (!completo) return;

          setVariables((prev) => prev.map((v) => (v.id === completo.id ? completo : v)));
        } catch (err) {
          console.error(`No se pudo cargar el detalle de "${variable.name}":`, err);
        }
      });
    } catch (err) {
      console.error("Error al invocar la acción de perfilado:", err);
      if (!yaCancelado()) setError("Error inesperado al conectar con el servidor.");
    } finally {
      if (!yaCancelado()) {
        setLoading(false);
        setLoadingDataset(false);
      }
    }
  }

  // 3. El analista elige otro dataset en el selector del dashboard.
  function handleSelectDataset(datasetId: number) {
    if (datasetId === selectedDatasetId) return;
    setSelectedDatasetId(datasetId);
    setVariables([]); // evita parpadeo con datos del dataset anterior
    cargarPerfilado(datasetId);
  }

  // 4. Si el detalle de una variable puntual no llegó todavía (o falló) al
  //    completarse en segundo plano, se puede reintentar al abrir su card.
  async function handleSelectVariable(variable: VariableSummary): Promise<VariableSummary> {
    if (variable.bins.length > 0 || selectedDatasetId === null) return variable;

    const resultado = await getDatasetProfileAction(selectedDatasetId, variable.name);

    if (resultado.error || !resultado.profile) {
      console.error("Error al obtener el detalle de la variable:", resultado.error);
      return variable;
    }

    const completo = adaptProfileResponseDetail(resultado.profile);
    return completo ?? variable;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Cargando variables analizadas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Todavía no tienes datasets cargados.
        </p>
      </div>
    );
  }

  return (
    <FrequencyDashboard
      variables={variables}
      onSelectVariable={handleSelectVariable}
      datasets={datasets}
      selectedDatasetId={selectedDatasetId}
      onSelectDataset={handleSelectDataset}
      isLoadingDataset={loadingDataset}
      title="Frecuencias de dataset"
      subtitle="Visualización de métricas y distribuciones del dataset seleccionado."
    />
  );
}