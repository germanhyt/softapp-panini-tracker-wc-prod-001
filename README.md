# Panini 2026 Tracker

Reimplementación del tracker de figuritas Panini Mundial 2026 con **Next.js** y **PostgreSQL**.

Proyecto independiente del repo original (`intercambio-figuras-mundial` / Firebase).

## Stack

- Next.js 16 (App Router)
- TypeScript
- PostgreSQL + Prisma
- Tailwind CSS (tokens visuales del diseño original)

## Requisitos

- Node.js 20+
- PostgreSQL (local, [Neon](https://neon.tech), Supabase, etc.)

## Setup (obligatorio)

### 1. Variables de entorno

```bash
cd panini-tracker
cp .env.example .env
```

Edita `.env`:

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | **Sí** | Conexión PostgreSQL |
| `AUTH_SECRET` | **Sí** | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Sí** | URL exacta del app, ej. `http://localhost:3001` si usas ese puerto |
| `ADMIN_EMAILS` | Recomendado | Tu correo para panel `/admin` |
| `AUTH_GOOGLE_*` | No | Login con Google |
| `SMTP_*` | No | En dev el enlace de verificación sale en consola |

### 2. Base de datos

Necesitas PostgreSQL (local, [Neon](https://neon.tech) o Supabase). Crea una base llamada `panini_tracker`.

**Local (Windows, PostgreSQL instalado):**

```sql
CREATE DATABASE panini_tracker;
```

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run setup:check
```

### 3. Arrancar

```bash
npm run dev
# Si el puerto 3000 está ocupado, Next.js usará 3001 — actualiza NEXTAUTH_URL
```

### 4. Primer registro

1. Regístrate en `/register`
2. En la **consola del servidor** aparece el enlace de verificación (no hay SMTP en dev)
3. Abre ese enlace → inicia sesión

### Verificar configuración

```bash
npm run setup:check
```

## Setup rápido (resumen)

```bash
cd panini-tracker
cp .env.example .env
# Editar DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) (o el puerto que indique la consola).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run db:migrate` | Crear/aplicar migraciones |
| `npm run db:seed` | Cargar países y catálogo de figuritas |
| `npm run db:studio` | Prisma Studio |
| `npm run setup:check` | Verifica `.env`, DB y seed |

## Estructura (Fase 0)

```
src/lib/domain/     Reglas de negocio puras (catálogo, países, stickers)
src/lib/db/           Cliente Prisma
prisma/schema.prisma  Modelo de datos
prisma/seed.ts        Seed inicial
```

## Roadmap

1. **Fase 0** — Setup + catálogo ✅
2. **Fase 1** — Auth.js + perfil ✅
3. **Fase 2** — Stickers + álbum ✅
4. **Fase 3** — Match finder ✅
5. **Fase 4** — Admin + reportes ✅

## Admin y reportes (Fase 4)

- **Panel admin** (`/admin`): estadísticas, listado de usuarios, export CSV — solo `ADMIN_EMAILS`
- **Reporte visual** (`/visual-report`): mapa imprimible de pegadas/faltantes/repetidas
- **Reporte trueque** (`/trade-report`): checklist imprimible para intercambios en persona
- **Extras** (`/extras`): figuritas promocionales fuera del catálogo estándar
- API admin: `GET /api/admin/users`
- Contador de miembros en el header

## Matches (Fase 3)

- Ranking de intercambios por país (misma lógica que el app original)
- API: `GET /api/matches`, `GET /api/stats/members`
- Invitación por correo con mensaje pre-armado (`mailto:`)
- Ruta: `/matches` (nav inferior 🤝)

## Stickers (Fase 2)

- Dashboard con estadísticas y avance por selección
- Álbum paginado con búsqueda, selección masiva y guardado por página
- Persistencia en PostgreSQL (`user_stickers`)
- API: `GET/PATCH /api/stickers/me`, `DELETE /api/stickers/me/[code]`

## Auth (Fase 1)

- Registro con email/contraseña + verificación por enlace
- Login con credenciales
- Google OAuth (opcional: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`)
- Completar perfil (nombre, apellido, país)
- Middleware de rutas protegidas

En desarrollo, el enlace de verificación se imprime en la consola del servidor si no hay SMTP configurado.

## Producción

Checklist mínimo antes de abrir a usuarios:

| Requisito | Estado |
|-----------|--------|
| PostgreSQL + `DATABASE_URL` | Configurar en hosting |
| `AUTH_SECRET` + `NEXTAUTH_URL` (dominio real) | Obligatorio |
| `RESEND_API_KEY` + `EMAIL_FROM` verificado | Correo transaccional |
| `prisma migrate deploy` + seed inicial | Primera vez |
| Recuperación de contraseña | `/forgot-password` |
| Rate limit en auth | register, resend, forgot, reset |
| Health check | `GET /api/health` |
| Política de privacidad | `/privacidad` |

### Health check

```bash
curl https://tudominio.com/api/health
# { "status": "ok", "checks": { "database": "ok" }, ... }
```

### Migraciones en producción

```bash
npx prisma migrate deploy
npm run db:seed   # solo la primera vez
```

### Rate limiting

Los endpoints de auth limitan intentos por IP y correo (memoria del proceso). En despliegues multi-instancia considera Redis/Upstash para límites globales.


-----------------------------
()
antes del deploy revisamos la fiabilidad de set de datos read de las figuras o stickets y selecciones de fuentes oficiales, verificamos si coincide correctamente con el albúm oficial

()
El proyecto por polóticas pertenece a Refugio Gastronómico con logo /logo-refugio.png

()
vale en el mercado en lugar de los buttons de la parte superior derecha colocamos el dinámico del login de la app (sea localhost o cuando tenga una url dominio correcto)

()
generamos un chat con websockets para la convesación de los diferentes usuario de forma óptima, lo aplicamos paso a paso