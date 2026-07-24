# Ingresotaruka - Sistema de Gestión y Control de Acceso

Sistema web profesional para la administración de socios y control de acceso mediante NFC/QR para gimnasios.

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Tiempo real | Socket.IO |
| Autenticación | JWT + bcrypt |
| Validación | Zod |

## Estructura del Proyecto

```
ingresotaruka/
├── client/                    # Frontend Next.js
│   ├── src/
│   │   ├── app/               # Páginas (App Router)
│   │   │   ├── login/         # Login de administradores
│   │   │   ├── dashboard/     # Panel principal
│   │   │   ├── socios/        # Gestión de socios
│   │   │   ├── control-acceso/# Control de acceso en tiempo real
│   │   │   ├── historial/     # Historial de ingresos
│   │   │   └── check/[id]/    # Página pública del socio
│   │   ├── components/        # Componentes reutilizables
│   │   │   └── layout/        # Sidebar, Header, DashboardLayout
│   │   ├── contexts/          # AuthContext (JWT)
│   │   ├── hooks/             # useSocket (WebSocket)
│   │   ├── lib/               # api.ts (cliente HTTP)
│   │   └── types/             # TypeScript interfaces
│   ├── tailwind.config.ts
│   └── next.config.js
├── server/                    # Backend Express
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos
│   │   └── seed.ts            # Datos iniciales
│   └── src/
│       ├── config/            # Configuración y Prisma client
│       ├── controllers/       # Lógica de negocio
│       ├── middleware/        # Auth, validación, errores
│       ├── routes/            # Rutas API REST
│       ├── services/          # Servicios (auth, sockets)
│       ├── sockets/           # WebSocket (Socket.IO)
│       └── jobs/              # Cron jobs (vencimiento)
└── package.json               # Workspace root
```

## Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** >= 9.x

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd "Puerta gym"
npm install
```

Esto instalará las dependencias del servidor y cliente automáticamente.

### 2. Configurar PostgreSQL

Crear la base de datos:

```bash
# Acceder a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE taruka_gym;

# Salir
\q
```

### 3. Configurar variables de entorno

Editar `server/.env`:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/taruka_gym?schema=public"
JWT_SECRET="cambiar-por-un-secreto-seguro-en-produccion"
PORT=4000
CLIENT_URL="http://localhost:3000"
```

### 4. Ejecutar migraciones y seed

```bash
# Generar el cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate -- --name init

# Crear administrador inicial
npm run db:seed
```

**Credenciales iniciales:**
- Email: `admin@tarukagym.cl`
- Contraseña: `admin123`

### 5. Iniciar el sistema

```bash
# Desarrollo (servidor + cliente simultáneamente)
npm run dev

# O por separado:
npm run dev:server   # Backend en puerto 4000
npm run dev:client   # Frontend en puerto 3000
```

## Acceso al Sistema

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000/login` | Login de administradores |
| `http://localhost:3000/dashboard` | Panel principal |
| `http://localhost:3000/socios` | Gestión de socios |
| `http://localhost:3000/control-acceso` | Control de acceso (recepción) |
| `http://localhost:3000/historial` | Historial de ingresos |
| `http://localhost:3000/check/CODIGO_UNICO` | Página pública del socio |

## API REST

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Verificar token |
| PUT | `/api/auth/cambiar-password` | Cambiar contraseña |

### Socios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/socios?search=&estado=&page=&limit=` | Listar socios |
| GET | `/api/socios/:id` | Obtener socio |
| POST | `/api/socios` | Crear socio (multipart) |
| PUT | `/api/socios/:id` | Actualizar socio (multipart) |
| PUT | `/api/socios/:id/estado` | Cambiar estado |
| DELETE | `/api/socios/:id` | Eliminar socio |
| GET | `/api/socios/buscar/:codigo` | Buscar por código |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Estadísticas generales |
| GET | `/api/dashboard/ultimos-ingresos` | Últimos 10 ingresos |

### Ingresos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ingresos?fechaDesde=&fechaHasta=&pudoIngresar=&page=&limit=` | Listar ingresos |

### Renovaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/renovaciones` | Renovar membresía |
| GET | `/api/renovaciones/:socioId` | Historial de renovaciones |

### Check (Público)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/check/:codigo` | Verificar socio (NFC/QR) |

### Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notificaciones` | Listar notificaciones |
| GET | `/api/notificaciones/no-leidas` | Conteo no leídas |
| PUT | `/api/notificaciones/:id/leer` | Marcar como leída |
| PUT | `/api/notificaciones/leer-todas` | Marcar todas |

## WebSocket (Socket.IO)

El servidor emite eventos en tiempo real:

| Evento | Descripción |
|--------|-------------|
| `nuevo-acceso` | Cuando un socio escanea su NFC/QR |
| `nueva-notificacion` | Cuando se genera una notificación |

### Salas (Rooms)
- `admin-room`: Panel de control de acceso
- `check-{socioId}`: Página individual del socio

## Funcionalidades

- Login seguro con JWT + bcrypt
- Dashboard con métricas en tiempo real
- CRUD completo de socios con foto
- Búsqueda instantánea con debounce
- Control de acceso con WebSocket (sin recargar)
- Sonidos de aprobación/rechazo (Web Audio API)
- Página pública del socio al escanear NFC/QR
- Historial completo de ingresos con filtros
- Renovación de membresía (+30, +60, +90, +180, +365 días)
- Vencimiento automático de membresías (cron diario)
- Sistema de notificaciones
- Paginación en todos los listados
- Modo oscuro completo
- Diseño responsive
- Animaciones suaves
- Validación de formularios
- Carga de imágenes (fotos de socios)

## Build para Producción

```bash
# Build del frontend
npm run build

# El servidor se ejecuta directamente con tsx o compilado:
cd server && npm run build && npm start
```

## Licencia

Software propietario - Ingresotaruka
