# Análisis de Datos SII2 — Frontend

Frontend del sistema de análisis de datos, construido con Next.js 16, React 19 y Tailwind CSS v4.

## Requisitos

- Node.js 18 o superior
- El backend FastAPI corriendo (local o Docker)

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# URL base del backend FastAPI
# En desarrollo local:
BACKEND_URL=http://localhost:8000

# En Docker (usar el nombre del servicio):
# BACKEND_URL=http://backend:8000
```

> `.env.local` nunca se sube al repositorio. No lo confirmes en git.

## Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno (ver sección anterior)

# 3. Levantar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

Al entrar, el middleware redirige automáticamente a `/login` si no hay sesión activa.

## Otros comandos

```bash
npm run build   # Build de producción
npm run start   # Servidor de producción (requiere build previo)
npm run lint    # Linter (ESLint)
```
