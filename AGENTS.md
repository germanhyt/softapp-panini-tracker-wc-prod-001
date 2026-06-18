<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->



----------------------------------

Observaciones
()
Documentación detallada del proyecto: `docs/PROYECTO.md` (objetivo, casos de uso, flujos, arquitectura, sección Extras).
()
Se puede tener tipo un mercado de figuritas repetidas que los usuarios van publicando que les falte (tabla de cards paginado con filtros)? la idea con esto es que se colocará en una pantalla pública para que los usuarios puedan visualizarlo y ver qué hay disponibles

()
- Pemitir seleccionar qué publicar (si los faltantes o repetidas) sea opcional por el usuario, y lo que sea necesario
- Recuerda el idioma es neutro de lima/Perú no argentino (para el proyecto) 
- Mejora de UI e interactividad para que vaye el proyecto acorde a /logo-panini.jpg, refactorizamos

()

---

# Code Review Rules (GGA)

## General
REJECT if:
- Hardcoded secrets or credentials
- `any` type (TypeScript) or missing type hints (Python)
- Empty catch blocks (silent error handling)
- Code duplication (violates DRY)
- `console.log` / `print()` in production code

## TypeScript/React
REJECT if:
- `import * as React` → use `import { useState }` (named imports)
- `var()` or hex colors in className → use Tailwind utilities
- `useMemo`/`useCallback` without justification (React 19 Compiler handles this)
- Missing `"use client"` in client components

PREFER:
- `cn()` for conditional class merging
- Semantic HTML over divs
- Named exports over default exports

## Response Format
FIRST LINE must be exactly:
STATUS: PASSED
or
STATUS: FAILED

If FAILED, list: `file:line - rule violated - issue`

