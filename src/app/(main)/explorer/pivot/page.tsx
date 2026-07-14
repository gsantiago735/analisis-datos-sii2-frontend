// Ejemplo de uso con App Router.
// Copia esto como: app/tablas-dinamicas/page.tsx
// (Ya NO lleva segmento dinámico [datasetId]: el dataset se elige desde un
// <select> dentro del propio componente, alimentado por getUserDatasetsAction.)

import TablaDinamicaBuilder from "./TablaDinamicaBuilder";


export default function Page() {
  return <TablaDinamicaBuilder />;
}
