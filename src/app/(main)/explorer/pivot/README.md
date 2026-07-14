# Módulo Frontend — Tablas Dinámicas (CU06)

## Archivos

| Archivo | Qué hace |
|---|---|
| `types.ts` | Tipos TS espejo de tus schemas Pydantic |
| `api.ts` | **Server Actions** (`'use server'`) que leen la cookie httpOnly y llaman a `GET /perfilado/datasets/{id}` y `POST /tablas-dinamicas/generar` desde el servidor |
| `fonts.ts` | Carga de Space Grotesk / Inter / IBM Plex Mono vía `next/font/google` |
| `VariablePicker.tsx` | Selector reutilizable (single/multi) para filas, columnas y valor |
| `TablaDinamicaBuilder.tsx` | Componente principal — todo el CU06 |
| `page.example.tsx` | Ejemplo de ruta App Router |

## Instalación

```bash
npm install lucide-react
```

Copia los archivos a tu proyecto, por ejemplo bajo `components/tablas-dinamicas/`, y crea la ruta:

```
app/tablas-dinamicas/[datasetId]/page.tsx   (usa page.example.tsx como base)
```

Define en tu `.env.local`:

```
BACKEND_API_URL=http://localhost:8000
```

Nota que ya no lleva el prefijo `NEXT_PUBLIC_`: como `api.ts` corre exclusivamente en el servidor (Server Actions), no necesita exponerse al bundle del navegador.

## ⚠️ Antes de probarlo: bug en tu backend

En `ValidadorSeleccion.validar_combinacion` (service.py de `tablas_dinamicas`) hay un `return False` suelto justo después de la validación de la función de agregación, con la misma indentación que el `if` que lo precede — no queda anidado dentro de él. Esto hace que la función **siempre** devuelva `False`, sin importar si la combinación es válida, y que las validaciones 2, 3 y 4 (columna inexistente, colisión de ejes, límite de 100k filas) sean código muerto que nunca se ejecuta. Corrígelo así:

```python
if funcion not in funciones_validas:
    self.mensaje_error = f"La función '{funcion}' no es válida. Opciones permitidas: {funciones_validas}"
    self.combinacion_valida = False
    return False   # <- mover el return DENTRO del if
```

Sin este fix, el frontend recibirá un 400 en cada intento (con mensaje vacío cuando la función sí era válida).

## Supuestos que hice (ajusta si no aplican)

1. **Auth**: `api.ts` lee la cookie httpOnly `token` con `cookies()` de `next/headers` (igual que tu server action de datasets) y la reenvía como `Authorization: Bearer` al backend. Si tu cookie tiene otro nombre, ajusta `cookieStore.get('token')`. Como es un módulo `'use server'`, solo puede exportar funciones `async`; por eso el tipo `ResultadoApi<T>` vive en `types.ts` en vez de en `api.ts`.
2. **Detección de "numérica"**: como no tengo los literales exactos que devuelve tu backend en `PerfiladoVariable.tipo`, la advertencia visual de "esta variable no parece numérica" usa un heurístico (`incluye "num"/"int"/"float"`). Ajusta `pareceNumerica()` en `TablaDinamicaBuilder.tsx` con los valores reales.
3. **Colisión de ejes**: la prevengo también en el frontend (una variable seleccionada en Filas se deshabilita en Columnas y viceversa), como refuerzo de la Excepción 2.1 — pero el backend sigue siendo la fuente de verdad.
4. **`columnas` con más de una variable**: tu `MotorPivot` hace `tabla_pivot.reset_index()`, lo cual solo aplana el índice de filas. Si seleccionas más de una variable en "Columnas", pandas genera columnas con `MultiIndex`, y `to_dict(orient="records")` puede producir tuplas como llaves, que no siempre serializan limpiamente a JSON. El frontend lo permite (el schema lo permite), pero si ves errores 500 al combinar varias columnas, ese es el lugar a revisar en el backend.

## Comportamiento implementado (mapeo a tu CU06)

- Selección interactiva de filas/columnas/valor/función → **Paso 1-2**.
- Auto-actualización con debounce de 600ms al cambiar cualquier selección (toggle "Auto" para desactivarlo) → **Paso 4-5**.
- Aviso "puede tardar unos segundos más" si la respuesta tarda > 2.5s → **Excepción 5.1**.
- Banner de error mostrando el `detail` del 400 del backend → **Excepción 2.1**.
- Exportar CSV del resultado actual (extra, no pedido en el CU06 pero común en este tipo de vista).
