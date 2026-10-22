# MantiApp móvil

Aplicación Expo / React Native para técnicos, con vistas basadas en MantiPreview.

## Arquitectura

Se sigue la separación de la web: sus entradas `app/admin/*/page.tsx` son pequeñas y delegan en componentes; los tipos están en `lib/domain.ts` y las peticiones en `lib/api-client.ts`.

```text
App.tsx                          Inicio y selección de acceso/registro/panel
screens/                         Entradas de cada vista
  HomeScreen.tsx                 Inicio
  OrdersScreen.tsx               Mis órdenes
  ProfileScreen.tsx              Perfil
  OrderDetailScreen.tsx          Detalle de orden
  NotificationsScreen.tsx        Alertas derivadas de las órdenes
  ToolsScreen.tsx                Disponibilidad del módulo de herramientas
components/
  technician-shell.tsx           Navegación y composición del panel, como admin-shell en web
  bottom-nav.tsx                 Barra inferior
  home.tsx, orders.tsx, profile.tsx, notifications.tsx
  page-heading.tsx, ui.tsx       Elementos compartidos
  orders/
    order-card.tsx, orders-list.tsx, order-detail.tsx
    order-checklist.tsx, photo-evidence.tsx, report-observations.tsx
lib/
  domain.ts                      Tipos y reglas puras
  theme.ts                       Colores y estilos
  api-client.ts                  fetch, URL base, JWT, errores y useResource
  technician-api.ts              Endpoints y operaciones del técnico
  use-session.ts                 Ciclo de autenticación y autorización
  use-order-report.ts            Borrador, fotografías y guardado de la orden
  supabaseClient.ts              Supabase Auth y sesión persistente
```

Las vistas no consultan tablas de Supabase. El login y el registro conservan Supabase Auth, como en la web. Los datos del técnico pasan por la API de Next.js.

## Conectar con la API

```text
Login → Supabase Auth → access_token
Móvil → Authorization: Bearer <access_token> → Next.js /api/movil/* → Supabase con el JWT del técnico
```

Configurar `.env.local` en esta carpeta siguiendo `.env.example`:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
```

`EXPO_PUBLIC_API_URL` es el **origen de la web, sin `/api` al final**. Sustituir la IP de ejemplo por la IPv4 del equipo que ejecuta Next.js. Supabase debe ser el mismo proyecto configurado en la web. Nunca colocar la clave de servicio en variables `EXPO_PUBLIC_*`.

1. En `mantiapp-web`, iniciar el servidor con `npm run dev -- --hostname 0.0.0.0`.
2. En un teléfono físico, usar la IP LAN del equipo; ambos deben estar en la misma red y el puerto 3000 debe ser accesible.
3. En el emulador de Android Studio, usar `http://10.0.2.2:3000`. `localhost` en el teléfono apunta al propio teléfono.
4. Para producción, usar el dominio HTTPS del despliegue de Next.js que incluya estas nuevas rutas.
5. En `mantiapp-mobile`, ejecutar `npm install` y `npm start -- --clear` después de cambiar la configuración. Iniciar sesión con una cuenta con `users.rol = 'tecnico'`.

No se ha cambiado tu `.env.local` ni se ha desplegado el servidor. El túnel de Expo transporta Metro; no publica automáticamente la API de Next.js. Estas instrucciones son para la app nativa; una ejecución en navegador desde otro origen requeriría configurar CORS o un proxy.

## Contrato de endpoints

| Método | Ruta | Comportamiento |
| --- | --- | --- |
| GET | `/api/movil/perfil` | Perfil del técnico autenticado; verifica sesión y rol |
| GET | `/api/movil/ordenes` | Órdenes asignadas al identificador obtenido del JWT |
| PATCH | `/api/movil/ordenes/:id` | Cambia estado y checklist de una orden propia |

El PATCH recibe:

```json
{
  "nuevo_estado": "En progreso",
  "estado_anterior": "Asignada",
  "checklist": [{ "tarea": "Verificar condiciones de seguridad", "completada": false }]
}
```

El checklist debe incluir **todas las tareas originales** de la orden en su mismo orden. El ejemplo ilustra la estructura, no reemplaza las demás tareas. Para finalizar, enviar `Completada` desde `En progreso` con todas las tareas marcadas. El servidor devuelve la orden actualizada.

Las rutas están en `mantiapp-web/app/api/movil/`. Usan un cliente Supabase por solicitud con la clave pública y el JWT del solicitante; validan el token con `auth.getUser`, comprueban el rol y filtran por el técnico de la sesión. Las políticas RLS siguen siendo necesarias. No se usan claves de servicio ni se confía en un `tecnico_id` proporcionado por el dispositivo. Respuestas: 401 sin sesión válida, 403 sin permisos, 404 orden ajena/inexistente, 409 cambio concurrente de estado, 400 checklist o transición inválidos.

## Límites actuales

- Las fotos y observaciones siguen siendo reportes locales por usuario y orden, con hasta seis fotos copiadas al almacenamiento persistente de la app. No se sincronizan con la web; desinstalar la app los borra. La interfaz lo indica.
- El PATCH actualiza la orden. La sincronización del estado del activo necesita una operación transaccional o trigger del backend; no se añadieron migraciones de base de datos.
- Los contadores de completadas son totales, no mensuales. Las notificaciones se derivan de las órdenes críticas o con vencimiento, no son push. Herramientas muestra su disponibilidad pendiente.

## Validación

Ejecutar `npm run typecheck` y `npm test` en móvil. En web, ejecutar `npm run typecheck`, `npm test` y `node --test tests/mobile-api.test.cjs`.

Para la prueba integrada, usar una cuenta de técnico y órdenes de prueba: verificar acceso, filtros, recarga, inicio, borrador, fotos, guardado y cierre. No se necesitan credenciales reales para las pruebas automatizadas de contrato y autorización.
