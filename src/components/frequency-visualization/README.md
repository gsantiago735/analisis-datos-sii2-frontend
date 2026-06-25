# CU04 — Visualizar Frecuencias

Componente de Next.js (App Router o Pages Router, funciona en ambos) que
implementa el caso de uso **CU04**: tabla de frecuencias + diagrama de
barras + boxplot por variable, con un diseño tipo panel de analítica.

Ahora mismo todo funciona con datos de ejemplo (`mockData.ts`) para que
puedas ver el resultado de inmediato. Cuando tengas el backend, solo
necesitas reemplazar esa fuente de datos — el resto del componente no
cambia.

## Requisitos

- Next.js 13+ (App Router o Pages Router).
- **Tailwind CSS** configurado en el proyecto. Si no lo tienes:
  https://tailwindcss.com/docs/guides/nextjs
- React 18+. No se necesita ninguna librería de gráficos: las barras y el
  boxplot son SVG hechos a mano (cero dependencias nuevas).

## Archivos

```
frequency-visualization/
├── types.ts                 # Contrato de datos (VariableSummary, etc.)
├── mockData.ts               # Datos de ejemplo — bórralo cuando conectes la API
├── utils.ts                  # Formateo de números/porcentajes
├── icons.tsx                 # Iconos SVG mínimos (sin dependencias)
├── TypeBadge.tsx              # Pastilla INTEGER/DECIMAL/STRING
├── FrequencyBarChart.tsx      # Histograma (tarjeta y modal)
├── BoxPlotChart.tsx           # Diagrama de caja (tarjeta y modal)
├── VariableCard.tsx           # Tarjeta de la grilla
├── VariableDetailModal.tsx    # Modal con tabla de frecuencias completa
├── FrequencyDashboard.tsx     # Componente principal (el que importas)
└── index.ts                   # Barrel export
```

## Uso rápido

Copia la carpeta `frequency-visualization/` dentro de tu proyecto (por
ejemplo en `src/components/frequency-visualization/`) y úsala así en una
página o ruta:

```tsx
// app/frecuencias/page.tsx
import { FrequencyDashboard } from "@/components/frequency-visualization";

export default function Page() {
  return <FrequencyDashboard />;
}
```

Eso ya te muestra el dashboard completo con los datos de ejemplo
(idénticos en forma a los del dataset que enviaste).

## Cómo conectarlo a tu backend

El componente recibe un arreglo de `VariableSummary` (definido en
`types.ts`). Tu endpoint debe devolver datos en esa forma — esa es la
única integración que necesitas hacer:

```tsx
// app/frecuencias/page.tsx
import { FrequencyDashboard } from "@/components/frequency-visualization";
import type { VariableSummary } from "@/components/frequency-visualization";

async function getFrecuencias(): Promise<VariableSummary[]> {
  const res = await fetch(`${process.env.API_URL}/api/frecuencias`, { cache: "no-store" });
  return res.json();
}

export default async function Page() {
  const variables = await getFrecuencias();
  return <FrequencyDashboard variables={variables} />;
}
```

### Si prefieres calcular cada variable al vuelo (lazy)

En vez de precalcular las 14 (o más) variables de una vez, puedes pasarle
solo los metadatos livianos (nombre, tipo) y resolver el cálculo pesado
**solo cuando el analista abre el detalle** — esto cubre el requisito de
rendimiento del CU04 ("procesos pesados pueden ejecutarse de forma
progresiva"):

```tsx
<FrequencyDashboard
  variables={variablesLivianas}
  onSelectVariable={async (variable) => {
    const res = await fetch(`/api/frecuencias/${variable.id}`);
    return res.json(); // debe devolver un VariableSummary completo
  }}
/>
```

Mientras se resuelve la promesa, el modal muestra automáticamente un
skeleton de carga ("Calculando frecuencias…").

## Cómo se cubre cada parte del caso de uso

| Paso / regla del CU04                                   | Dónde está implementado |
|-----------------------------------------------------------|--------------------------|
| 1. El analista selecciona una variable                   | Buscador + clic en una tarjeta (`FrequencyDashboard`, `VariableCard`) |
| 2–3. Cálculo de frecuencia y tabla de frecuencias         | `bins` en `VariableSummary` + tabla completa en `VariableDetailModal` (con % y % acumulado) |
| 4. Diagrama de barras                                      | `FrequencyBarChart.tsx` |
| 5. Interpretación de patrones de concentración             | Texto autogenerado ("Patrón de concentración") en `VariableDetailModal.tsx` → función `buildInsight` |
| Excepción 1.1 — variable no existe                         | Estado vacío en `FrequencyDashboard.tsx` cuando la búsqueda no encuentra nada |
| Excepción 4.1 — demasiadas categorías                      | Bandera `groupedOthers` en `VariableSummary`; se muestra el aviso "Categorías agrupadas en Otros" |
| Rendimiento (<3s, procesos pesados progresivos)             | Carga perezosa opcional vía `onSelectVariable` + skeleton de carga |

## Conectar tu backend real (`getDatasetProfileAction`)

Tu endpoint de perfilado (`/perfilado/datasets/{id}`) **no** devuelve el
detalle de todas las variables de una sola vez. Devuelve dos cosas
distintas según si mandas el query param `variable`:

- **Sin `variable`**: `variables: ProfileVariable[]` — metadatos livianos
  de TODAS las variables (nombre, tipo, validos, nulos, q1/q2/q3,
  atípicos). **Sin** bins ni estadísticas completas.
- **Con `variable=NombreColumna`**: además incluye `variable_detalle` — el
  detalle COMPLETO de esa única variable (estadísticas en texto +
  distribución/bins).

Esto calza perfecto con el flujo de **carga progresiva** del CU04: la
grilla se pinta con los metadatos livianos, y el detalle pesado (bins,
boxplot) se calcula solo cuando el analista abre una tarjeta.

### 1. Grilla inicial

```tsx
"use client";
import { useEffect, useState } from "react";
import { FrequencyDashboard } from "@/components/frequency-visualization/FrequencyDashboard";
import { adaptProfileResponse, adaptProfileResponseDetail, type VariableSummary } from "@/components/frequency-visualization";
import { getDatasetProfileAction } from "@/app/actions/profile";

const DATASET_ID = 2;

export default function FrequencyPage() {
  const [variables, setVariables] = useState<VariableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const resultado = await getDatasetProfileAction(DATASET_ID);
      if (resultado.error) {
        setError(resultado.error);
      } else if (resultado.profile) {
        // Solo metadatos livianos: sin bins ni boxplot todavía.
        setVariables(adaptProfileResponse(resultado.profile));
      }
      setLoading(false);
    }
    cargar();
  }, []);

  // 2. Carga progresiva: cuando el analista abre una tarjeta, pedimos el
  //    detalle completo de ESA variable puntual (con `?variable=nombre`).
  async function onSelectVariable(variable: VariableSummary): Promise<VariableSummary> {
    const resultado = await getDatasetProfileAction(DATASET_ID, variable.name);
    if (resultado.error || !resultado.profile) return variable; // se queda con lo que ya tenía
    const completo = adaptProfileResponseDetail(resultado.profile);
    return completo ?? variable;
  }

  if (loading) return <p>Cargando variables analizadas…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <FrequencyDashboard
      variables={variables}
      onSelectVariable={onSelectVariable}
      title="Frecuencias de Heart Dataset"
    />
  );
}
```

`FrequencyDashboard` ya soporta esto de fábrica: al abrir una tarjeta,
llama a `onSelectVariable`, muestra el skeleton "Calculando frecuencias…"
mientras se resuelve, y reemplaza la tarjeta activa con el resultado
completo (bins + boxplot).

### Qué hace cada función del adaptador

| Función                      | Entrada                          | Para qué |
|-------------------------------|-----------------------------------|----------|
| `adaptProfileResponse(json)`  | `ProfileResponse` (sin detalle)   | Grilla inicial — `VariableSummary[]` livianos, `bins: []`, `boxplot: null` |
| `adaptProfileDetail(detalle, resumenVar?)` | `ProfileDetail` (`variable_detalle`) | Detalle de UNA variable ya extraído — útil si manejas el fetch tú mismo |
| `adaptProfileResponseDetail(json)` | `ProfileResponse` CON `variable_detalle` resuelto | Atajo: busca el detalle y la entrada liviana correspondiente y arma el `VariableSummary` completo en un solo paso (el que usa el ejemplo de arriba) |

Tus números en `estadisticas` vienen como strings en formato es-CO
(`"53,51"`, coma decimal). El adaptador los parsea automáticamente.

**¿Y si falta un dato?** Si no vinieran `Promedio`/`Desv. estándar` en
`estadisticas`, el adaptador los **calcula** aproximando con los puntos
medios de cada bin de `distribucion`.

**Sobre los valores atípicos:** tu backend solo entrega el *total* de
atípicos por variable (`atipicos: 29`), no los valores puntuales. El
`BoxPlotChart` no inventa puntos falsos — muestra un aviso de texto: "29
valores atípicos detectados (no graficados individualmente)". Si más
adelante tu backend expone los valores exactos, llena `boxplot.outliers`
con ese arreglo y los puntos aparecerán automáticamente.

**Tarjetas mientras no hay detalle:** como la grilla inicial no trae bins,
`VariableCard` muestra "Toca para calcular distribución" en vez de un
gráfico vacío, hasta que el analista abre la tarjeta y se resuelve
`onSelectVariable`.


## Personalización

- **Colores**: todo el color vive en clases de Tailwind (`teal-*` para las
  barras, `blue/violet/amber` para las pastillas de tipo). Cámbialos
  directamente en `TypeBadge.tsx`, `FrequencyBarChart.tsx` y
  `BoxPlotChart.tsx`.
- **Tipografía numérica**: los valores usan `font-mono` para alinear
  cifras. Si quieres el toque exacto del diseño original, agrega IBM Plex
  Mono con `next/font/google` y reemplaza `font-mono` por tu clase.
- **Tamaño de grilla**: el número de columnas se controla en
  `FrequencyDashboard.tsx` (`grid-cols-*`).

## Notas

- Todo el código es TypeScript estricto y fue verificado con `tsc`.
- No se usa `localStorage`/`sessionStorage` en ninguna parte.
- Los componentes que usan estado (`useState`) llevan `"use client"` al
  inicio, como exige el App Router.
