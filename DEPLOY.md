# Subir Ingresotaruka a Internet

## Requisitos previos

1. Tener el proyecto en GitHub
2. Cuenta gratuita en **Railway** (railway.app) - incluye PostgreSQL

---

## PASO 1: Subir el proyecto a GitHub

```bash
cd "/Users/renesilva/Desktop/Puerta gym"
git init
git add .
git commit -m "Ingresotaruka v1.0"
gh repo create ingresotaruka --public --source=. --push
```

---

## PASO 2: Desplegar en Railway

### 2.1 Conectar Railway con GitHub

1. Entra a https://railway.app y crea cuenta (puedes usar GitHub)
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige tu repositorio `ingresotaruka`

### 2.2 Agregar PostgreSQL

1. En el dashboard del proyecto, click en **"+ New"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway automáticamente crea la base de datos y agrega `DATABASE_URL` como variable de entorno

### 2.3 Configurar el Backend

Railway detectará el `package.json` del servidor. Configura:

1. **Root Directory**: `/server`
2. **Build Command**: `npm install && npx prisma generate`
3. **Start Command**: `npm run db:deploy && npm run db:seed && npm start`

Variables de entorno (Railway las configura automáticamente al agregar PostgreSQL, pero agrega estas manualmente):

```
JWT_SECRET=un-secreto-muy-largo-y-seguro-cambiar
PORT=4000
CLIENT_URL=https://TU_FRONTEND.vercel.app
```

### 2.4 Anotar la URL del backend

Railway te dará una URL como `https://ingresotaruka-production.up.railway.app`. **Anótala**, la necesitarás para el frontend.

---

## PASO 3: Desplegar el Frontend en Vercel (gratis)

### 3.1 Conectar Vercel

1. Entra a https://vercel.com y crea cuenta con GitHub
2. Click en **"Add New"** → **"Project"**
3. Selecciona tu repositorio `ingresotaruka`

### 3.2 Configurar

1. **Root Directory**: `client`
2. **Framework Preset**: Next.js
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### 3.3 Variables de entorno (IMPORTANTE)

En Vercel, ve a Settings → Environment Variables y agrega:

```
NEXT_PUBLIC_API_URL = https://TU_BACKEND.railway.app/api
NEXT_PUBLIC_SOCKET_URL = https://TU_BACKEND.railway.app
NEXT_PUBLIC_UPLOADS_URL = https://TU_BACKEND.railway.app
```

(Reemplaza `TU_BACKEND` con la URL que te dio Railway)

### 3.4 Deploy

Click en **"Deploy"**. Vercel hará el build y te dará una URL como `https://ingresotaruka.vercel.app`.

---

## PASO 4: Probar

1. **Login admin**: `https://TU_FRONTEND.vercel.app/login`
   - Email: `admin@tarukagym.cl`
   - Contraseña: `admin123`

2. **Login alumnos**: `https://TU_FRONTEND.vercel.app/cliente/login`
   - Email: el del alumno
   - Contraseña: `Taruka26`

3. **Escaneo NFC/QR**: `https://TU_FRONTEND.vercel.app/check/CODIGO`

4. **Control de acceso**: `https://TU_FRONTEND.vercel.app/control-acceso`

---

## NOTAS IMPORTANTES

- **Railway**: $5/mes crédito gratis (suficiente para ~1 mes de prueba)
- **Vercel**: plan Hobby gratuito (ilimitado)
- El primer deploy tarda ~3-5 minutos
- Los WebSockets (Socket.IO) funcionan correctamente en Railway
- Las fotos de socios se guardan en el servidor de Railway
- El cron job de vencimiento corre automáticamente

## Dominio personalizado (opcional)

Puedes comprar un dominio (ej. ingresotaruka.cl) y conectarlo a Vercel (gratis).
Así los QR/NFC apuntarán a `https://ingresotaruka.cl/check/CODIGO`.
