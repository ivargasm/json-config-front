# NexusAI Data Engine - Frontend

El frontend de NexusAI Data Engine es la interfaz moderna de construcción de reportes interactivos y análisis de datos. Está desarrollado con **Next.js 15 (App Router)**, **React**, **TypeScript** y **Tailwind CSS**. 

El sistema provee constructores visuales que transforman consultas SQL en archivos de configuración JSON nativos para dispositivos móviles (`Mobile Reports`) y plataformas preset (`Preset Reports`).

## Características Principales

- **Constructores Visuales Duales**:
  - **Mobile Reports**: Plataforma de generación de vistas complejas. Soporta extracción inteligente de columnas mediante chips, agregación de filtros globales, selectores de fecha (`last_date_datasource`), y guardado local en caché persistente.
  - **Preset Reports**: Interfaz paramétrica que detecta si el query es `groupBy` o `normal`, auto-configura el tipado de los widgets y genera simultáneamente el JSON y el script SQL de inserción (i18n) requeridos por el sistema base.
- **Asistente SQL con IA**: Un área de juegos interactiva donde el desarrollador puede usar lenguaje natural para interrogar la base de datos (vía Groq LLM), previsualizar los resultados en una tabla y exportar el código SQL perfecto hacia los constructores visuales.
- **Gestión de Estados Moderno**: Se reemplazó todo el prop-drilling con stores persistentes usando **Zustand**. Esto permite que el progreso (incluso de un JSON gigantesco) se guarde instantáneamente en el `localStorage` sin perder datos al recargar la página.
- **UI/UX Resiliente**: Componentes reutilizables, alertas Toast (vía `sonner`), navegación segura (vía `ProtectedRoute`), validaciones de formularios con **Zod** y **React Hook Form**.

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación y Configuración

1. **Instalación de dependencias**:
   ```bash
   npm install
   ```

2. **Variables de Entorno**:
   Crea un archivo `.env.local` en la raíz de `frontend/` y apunta hacia el backend:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. **Desarrollo**:
   ```bash
   npm run dev
   ```

4. **Producción**:
   El proyecto está configurado para permitir `npm run build` ignorando reglas de lint estrictas temporales (`ignoreDuringBuilds`) a fin de facilitar la entrega de las fases iniciales.
   ```bash
   npm run build
   npm run start
   ```

## Estructura de Directorios

- `src/app/(auth)/`: Pantallas de Login y Registro de dos pasos.
- `src/app/mobile-report/`: Constructor de reportes dinámicos por componentes.
- `src/app/preset-report/`: Constructor y mapeador de reportes predefinidos.
- `src/app/generator/`: AI Copilot y probador de queries de BD.
- `src/app/store/`: Stores globales de Zustand con sincronización automática.