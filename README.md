# Xquisito Frontend

Una aplicación de restaurante digital construida con Next.js que permite a los usuarios hacer pedidos desde sus mesas de forma interactiva.

## Características

- 🍽️ **Menú Digital Interactivo**: Navegación intuitiva por categorías y platos
- 🛒 **Carrito de Compras**: Gestión de pedidos con cantidades y modificaciones
- 💳 **Pagos Integrados**: Sistema de pago con múltiples opciones y división de cuentas
- 🔐 **Autenticación**: Sistema de usuarios con Clerk
- 📱 **PWA**: Aplicación web progresiva optimizada para móviles
- 🎯 **Sistema de Propinas**: Gestión de propinas personalizable
- 🔄 **Estado en Tiempo Real**: Sincronización de pedidos y estado de mesa

## Tecnologías

- **Framework**: Next.js 15.5.0 con Turbopack
- **UI/Styling**: TailwindCSS 4
- **Autenticación**: Clerk
- **PWA**: next-pwa
- **TypeScript**: Tipado completo
- **React**: 19.1.0

## Estructura del Proyecto

```
app/
├── add-card/          # Gestión de tarjetas de pago
├── add-tip/           # Sistema de propinas
├── cart/              # Carrito de compras
├── checkout/          # Proceso de checkout
├── choose-to-pay/     # Opciones de pago
├── components/        # Componentes reutilizables
├── context/           # Contextos de React
├── dashboard/         # Panel principal
├── dish/              # Detalles de platos
├── menu/              # Menú del restaurante
├── order/             # Gestión de pedidos
├── payment/           # Procesamiento de pagos
├── select-total-pay/  # Selección de monto a pagar
├── services/          # Servicios API
├── sign-in/           # Autenticación - Iniciar sesión
├── sign-up/           # Autenticación - Registro
├── table/             # Gestión de mesas
├── user/              # Perfil de usuario
└── utils/             # Utilidades
```

## Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPO]
cd xquisito-fronted
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
```

4. Configura Clerk con tus credenciales en `.env.local`

## Desarrollo

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

La aplicación redirige automáticamente a `/menu?table=12` para propósitos de demostración.

## Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo con Turbopack
npm run build    # Build de producción con Turbopack
npm run start    # Servidor de producción
npm run lint     # Linting con ESLint
```

## Flujo de Usuario

1. **Acceso**: Los usuarios acceden escaneando QR o enlace directo de mesa
2. **Menú**: Navegan por categorías y seleccionan platos
3. **Carrito**: Revisan y modifican su pedido
4. **Pago**: Eligen método de pago y dividen cuenta si es necesario
5. **Propinas**: Añaden propina personalizada
6. **Confirmación**: Reciben confirmación del pedido

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
