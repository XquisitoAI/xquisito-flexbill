# Claude Code Configuration - Xquisito Frontend

Este archivo contiene la configuración y comandos específicos para trabajar con el proyecto Xquisito Frontend usando Claude Code.

## Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo (con Turbopack)
npm run dev

# Build de producción (con Turbopack)
npm run build

# Iniciar servidor de producción
npm start

# Ejecutar linting
npm run lint
```

## Estructura del Proyecto

```
xquisito-fronted/
├── app/                    # App Router de Next.js
│   ├── add-card/          # Módulo de gestión de tarjetas
│   ├── add-tip/           # Sistema de propinas
│   ├── cart/              # Carrito de compras
│   ├── checkout/          # Proceso de checkout
│   ├── choose-to-pay/     # Selección de método de pago
│   ├── components/        # Componentes reutilizables
│   ├── context/           # React Contexts
│   ├── dashboard/         # Panel principal
│   ├── dish/              # Vista de detalles de plato
│   ├── hooks/             # Custom hooks
│   ├── interfaces/        # Definiciones TypeScript
│   ├── menu/              # Menú del restaurante
│   ├── order/             # Gestión de pedidos
│   ├── payment/           # Procesamiento de pagos
│   ├── services/          # Servicios y APIs
│   ├── sign-in/           # Autenticación - Login
│   ├── sign-up/           # Autenticación - Registro
│   ├── table/             # Gestión de mesas
│   ├── user/              # Perfil de usuario
│   └── utils/             # Funciones utilitarias
├── public/                # Archivos estáticos
├── middleware.ts          # Middleware de Next.js
└── next.config.ts         # Configuración de Next.js
```

## Tecnologías Clave

- **Next.js 15.5.0**: Framework principal con App Router
- **React 19.1.0**: Biblioteca de componentes
- **TypeScript**: Tipado estático
- **TailwindCSS 4**: Framework de estilos
- **Clerk**: Autenticación y gestión de usuarios
- **next-pwa**: Capacidades de PWA
- **Turbopack**: Bundler de desarrollo y producción

## Variables de Entorno

El proyecto requiere configuración de Clerk en `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Comandos de Testing y Quality

```bash
# Linting (ESLint configurado)
npm run lint

# TypeScript check (configurado en tsconfig.json)
npx tsc --noEmit

# Build check
npm run build
```

## Notas de Desarrollo

- La aplicación redirige automáticamente a `/menu?table=12` desde la página principal
- Utiliza Turbopack para desarrollo y build de producción
- Configurado como PWA con next-pwa
- Sistema de autenticación integrado con Clerk
- Arquitectura modular organizada por funcionalidades

## Convenciones del Código

- Componentes en PascalCase
- Archivos de páginas en kebab-case
- Hooks personalizados con prefijo `use`
- Interfaces TypeScript en PascalCase con sufijo `Interface` si es necesario
- Servicios en camelCase

## Deploy y Producción

- Build optimizado con Turbopack
- Compatible con Vercel y otras plataformas de Next.js
- PWA lista para instalación en dispositivos móviles