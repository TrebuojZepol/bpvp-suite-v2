# Exponer el dashboard en Internet (Cloudflare + `native.btc-defi.com`)

El dashboard Next.js habla con el motor Go **por la red local** (`BPVP_ENGINE_URL`, p. ej. `http://127.0.0.1:8081`). Solo hace falta publicar **el puerto del dashboard** hacia Internet; el motor puede seguir en `localhost`.

## Opción recomendada: Cloudflare Tunnel (sin abrir puertos en el router)

1. **Cloudflare Dashboard** → **Zero Trust** (o **Networks** → **Tunnels**).
2. **Create a tunnel** → instalar `cloudflared` en tu Mac (Homebrew: `brew install cloudflared`).
3. Autentica el conector con el comando que te da Cloudflare.
4. En el túnel, **Public Hostname**:
   - **Subdomain:** `native`
   - **Domain:** `btc-defi.com` (debe estar en Cloudflare DNS).
   - **Service type:** HTTP  
   - **URL:** `http://localhost:3050` (o el puerto donde corre Next).

5. **DNS:** Cloudflare suele crear el registro **CNAME** `native` → `<tunnel-id>.cfargotunnel.com`. Comprueba en **DNS** que `native.btc-defi.com` esté **proxied** (nube naranja).

6. **SSL/TLS** del sitio: modo **Full (strict)** si el origen es HTTPS; con túnel a `http://localhost:3050` normalmente **Full** está bien (Cloudflare termina TLS al visitante).

## Qué debe estar corriendo en tu Mac

| Proceso | Puerto | Notas |
|---------|--------|--------|
| Postgres + Redis | 5432 / 6379 | `infra/docker` |
| Motor auth (`go run ./cmd/auth`) | **8081** | `source .local-dev/runtime.env` |
| Next.js | **3050** | Mejor **`next start`** (ver abajo), no solo `next dev` |

## Producción mínima para URL pública

`next dev` no está pensado para exponerlo a Internet. Para algo serio:

```bash
cd apps/dashboard
cp .env.example .env.local   # BPVP_ENGINE_URL=http://127.0.0.1:8081, PORT=3050
pnpm run build
NODE_ENV=production PORT=3050 pnpm exec next start
```

Así las cookies de sesión usan `secure` en producción (ver `app/api/auth/login/route.ts`).

## Seguridad (importante)

- Cualquiera con la URL podrá ver la **pantalla de login**. Protege el túnel con **Cloudflare Access** (política por correo / OTP) o restringe por IP.
- Rota contraseñas de desarrollo si las filtraste.
- No subas `infra/docker/.env`, `.local-dev/`, ni tokens de túnel al repositorio.

## CSP / WebSockets

Si más adelante el dashboard usa **WebSockets** hacia otro host, revisa `connect-src` en `apps/dashboard/middleware.ts` para incluir tu origen público o el host del motor si lo expones aparte.

## Alternativa: despliegue real

Para producción estable: dashboard en **Vercel** / **Cloudflare Workers** (adaptando Next) y motor en **VPS** o **Kubernetes**, con Postgres/Redis gestionados — fuera del alcance de este documento breve.
