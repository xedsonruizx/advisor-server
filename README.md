# Backend (Express) — Elite Advisors

API segura para asesorías por membresía: autenticación con JWT en cookie `httpOnly`, validación con `zod`, seguridad con `helmet`, `cors` y rate limiting. Incluye flujo de planes y compra (Stripe opcional).

## Prerrequisitos
- Node.js 18+ y npm
- Archivo `server/.env` configurado

## Variables de entorno
Copiar `server/.env.example` a `server/.env` y completar:
- `PORT=4000`
- `CLIENT_URL=http://localhost:5173`
- `JWT_SECRET` con un valor largo y aleatorio
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` si usarás pagos reales

## Instalación
```
cd server
npm install
```

## Base de datos y seed
```
npm run prisma:generate
npm run prisma:migrate
npm run seed
```
- Base de datos SQLite en `server/dev.db`
- Usuarios de prueba:
  - admin@example.com / AdminPassword123!
  - advisor@example.com / AdvisorPassword123!
  - client1@example.com / ClientPassword123!
  - Roles: `admin`, `advisor`, `client` con permisos asignados

## Desarrollo
```
npm run dev
```
- API en `http://localhost:4000`
- `cors` permite el frontend definido por `CLIENT_URL`

## Comandos
- `npm run dev`: inicia el servidor
- `npm start`: producción simple (idéntico a `dev` aquí)

## Endpoints
- `GET /health`: estado
- `POST /api/auth/register`: registro
- `POST /api/auth/login`: login
- `POST /api/auth/logout`: logout
- `GET /api/auth/me`: usuario autenticado
- `GET /api/memberships/plans`: listado de planes
- `POST /api/memberships/purchase`: inicio de compra
- `GET /api/memberships/status`: estado de membresía
- `POST /api/memberships/webhook`: webhook Stripe (pendiente de firma y validación)

## Pagos (Stripe)
- Sin `STRIPE_SECRET_KEY`, se usa un stub que redirige al `successUrl` para pruebas.
- Para membresías reales, usa `mode: subscription` con precios de Stripe y gestiona webhooks.

## Seguridad
- `helmet` para cabeceras seguras
- `cors` restringido a `CLIENT_URL` con `credentials: true`
- Rate limiting global (100 req/15min)
- JWT en cookie `httpOnly`, `sameSite=lax` y `secure` en producción
- Passwords con `bcrypt`
- Validación de entrada con `zod`

## Problemas comunes
- Error CORS: revisa `CLIENT_URL` en `.env`
- Puerto ocupado: cambia `PORT` en `.env`
- Stripe: valida claves y firma del webhook
