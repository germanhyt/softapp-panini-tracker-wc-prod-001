# Panini Tracker — Deploy en VPS (Docker)

Dominio base: [gcbprojects.site](https://gcbprojects.site/)

## Ubicación en el VPS

Mismo nivel que `datarefugio`, `sisa-reservas`, `portalweb`, etc.:

```
/home/projects/
├── datarefugio/
├── sisa-reservas/
├── shared/              ← nginx_proxy + certbot (app_shared_network)
└── panini-tracker/      ← este proyecto
    ├── .env
    ├── docker-compose.yml
    ├── Dockerfile
    └── deploy/nginx-panini.conf.snippet
```

Los contenedores `panini_app`, `panini_ws` y `panini_db` se conectan a **`app_shared_network`** para que `nginx_proxy` pueda enrutar el tráfico.

---

## Subdominios que necesitas

| Subdominio | Tipo | Uso | Obligatorio |
|------------|------|-----|-------------|
| **`panini.gcbprojects.site`** | A → IP del VPS | App web (Next.js), `NEXTAUTH_URL`, mercado público | **Sí** |
| **`ws.panini.gcbprojects.site`** | A → IP del VPS | Chat en tiempo real (`NEXT_PUBLIC_WS_URL`) | **Sí** (si usas chat) |

No hace falta subdominio para PostgreSQL (solo red interna Docker).

### DNS (ejemplo)

```
panini.gcbprojects.site      A    62.169.23.24
ws.panini.gcbprojects.site   A    62.169.23.24
```

Alternativa con un solo subdominio: proxy WebSocket en nginx bajo path (requiere cambiar `NEXT_PUBLIC_WS_URL`). Recomendamos **2 registros A** por simplicidad.

---

## Requisitos en el VPS

- Docker + Docker Compose
- Red externa `app_shared_network` (misma que otros proyectos GCB)
- Nginx/Caddy en el host apuntando a contenedores
- Llave SSH: `~/.ssh/vps_estacionamiento` (usuario `root` o deploy)

```bash
# Crear red si no existe
docker network create app_shared_network
```

---

## Estructura en el servidor

```
/home/projects/panini-tracker/
├── .env                 # secretos (no commitear)
├── docker-compose.yml
├── Dockerfile
└── ...
```

---

## Primer deploy

### Deploy automatizado

```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

Sincroniza a `/home/projects/panini-tracker`, crea `.env` si no existe, build y `docker compose up -d`.

### 1. Subir código (manual)

Desde tu máquina local:

```bash
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  -e "ssh -i ~/.ssh/vps_estacionamiento" \
  ./ root@62.169.23.24:/home/projects/panini-tracker/
```

O clonar con git en el VPS.

### 2. Configurar entorno

```bash
ssh -i ~/.ssh/vps_estacionamiento root@62.169.23.24
cd /home/projects/panini-tracker
cp .env.production.example .env
nano .env   # AUTH_SECRET, POSTGRES_PASSWORD, ADMIN_EMAILS, RESEND, URLs
```

Generar secret:

```bash
openssl rand -base64 32
```

### 3. Build y arranque

```bash
docker compose build
docker compose up -d
docker compose run --rm app npx prisma db seed   # solo primera vez
```

### 4. Verificar

```bash
docker compose ps
docker compose logs -f app
curl -s http://panini_app:3000/api/health   # desde red docker
```

---

## Nginx compartido (`/home/projects/shared`)

El proxy ya usado por el resto de proyectos GCB. Añade el snippet del repo:

```bash
# En el VPS, después de crear DNS
cat /home/projects/panini-tracker/deploy/nginx-panini.conf.snippet >> /home/projects/shared/nginx.conf

# Certificado (requiere DNS apuntando al VPS)
cd /home/projects/shared
docker compose run --rm certbot certonly --webroot -w /webroot \
  -d panini.gcbprojects.site -d ws.panini.gcbprojects.site

docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

Snippet fuente: [`deploy/nginx-panini.conf.snippet`](../deploy/nginx-panini.conf.snippet)

---

## Nginx (referencia manual)

Ajusta según tu nginx existente en el VPS:

```nginx
# App
server {
    listen 443 ssl http2;
    server_name panini.gcbprojects.site;

    # ssl_certificate ... (Let's Encrypt / certbot)

    location / {
        proxy_pass http://panini_app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# WebSocket chat
server {
    listen 443 ssl http2;
    server_name ws.panini.gcbprojects.site;

    location / {
        proxy_pass http://panini_ws:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

El nginx del host debe estar en `app_shared_network` o usar `proxy_pass` a `127.0.0.1` si publicas puertos (no recomendado).

---

## Actualizar deploy

```bash
cd /home/projects/panini-tracker
git pull   # o rsync
docker compose build app ws
docker compose up -d
```

Las migraciones se aplican solas al iniciar `app` (`prisma migrate deploy`).

---

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose logs -f app` | Logs Next.js |
| `docker compose logs -f ws` | Logs WebSocket |
| `docker compose exec db psql -U panini panini_tracker` | Consola PostgreSQL |
| `npm run verify:catalog` | Verificar catálogo (local) |

---

## Checklist pre-producción

- [ ] DNS: `panini` + `ws.panini` apuntando al VPS
- [ ] `.env` con `NEXTAUTH_URL` y `NEXT_PUBLIC_WS_URL` HTTPS
- [ ] `RESEND_API_KEY` + dominio verificado en Resend
- [ ] `ADMIN_EMAILS` configurado
- [ ] SSL (certbot) para ambos subdominios
- [ ] Google OAuth redirect URIs si aplica: `https://panini.gcbprojects.site/api/auth/callback/google`
- [ ] Seed ejecutado una vez
- [ ] `curl https://panini.gcbprojects.site/api/health`

---

## Contenedores

| Servicio | Container | Puerto interno |
|----------|-----------|----------------|
| PostgreSQL | `panini_db` | 5432 |
| Next.js | `panini_app` | 3000 |
| WebSocket | `panini_ws` | 3002 |
