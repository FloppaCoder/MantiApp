# MantiApp - Panel Administrativo Web

MantiApp es una solución de software multiplataforma orientada a la gestión técnica de activos y mantenimiento para Pequeñas y Medianas Empresas (PYMEs). El sistema busca facilitar la transición de un modelo de mantenimiento reactivo hacia un esquema preventivo y organizado.

Este repositorio contiene el **Panel Administrativo Web**, diseñado para usuarios con rol de administrador. Desde este panel es posible gestionar activos, supervisar órdenes de trabajo, consultar métricas, planificar mantenimientos y administrar el personal técnico.

---

## Enlaces del Proyecto

* **Aplicación en producción:** [MantiApp en Vercel](https://manti-app.vercel.app/?utm_source=gemini)
* **Repositorio oficial:** [GitHub - FloppaCoder/MantiApp](https://github.com/FloppaCoder/MantiApp?utm_source=gemini)

---

## Arquitectura del Sistema

MantiApp utiliza una arquitectura de tres capas, permitiendo separar de forma escalable la interfaz de usuario, la lógica de negocio y la persistencia de datos.

### 1. Capa de Presentación

* **Framework:** Next.js 16.3.5 utilizando App Router.
* **Librería de interfaz:** React 19.2.8.
* **Estilos:** Tailwind CSS 4.
* **Renderizado:** Uso estratégico de renderizado del lado del servidor (SSR) y del cliente (CSR) según las necesidades de cada componente.

### 2. Capa de Lógica de Negocio

* **Control de acceso basado en roles (RBAC):** Restringe y habilita las funcionalidades disponibles según el nivel de autorización del usuario.
* *Administrador:* Acceso total al panel web y a las funciones de gestión del sistema.
* *Técnico:* Perfil operativo destinado exclusivamente al uso de la aplicación móvil.


* **Gestión de sesiones:** Control riguroso de la autenticación y estado del usuario.
* **Validación:** Sanitización y validación de formularios y datos de entrada.
* **Gestión de mantenimiento:** Control de estados, generación de alertas proactivas y programación de actividades.

### 3. Capa de Datos y Persistencia

* **Backend as a Service:** Supabase.
* **Base de datos:** Modelo relacional alojado e integrado mediante Supabase.
* **Autenticación:** Supabase Auth.
* **Sesiones:** Manejo de autenticación mediante tokens (JWT) y sesiones seguras en el cliente.

---

## Características Principales

### Dashboard Administrativo

Panel centralizado diseñado para la toma de decisiones gerenciales. Permite consultar información crítica del sistema, incluyendo:

* Métricas generales de mantenimiento en tiempo real.
* Comparación estadística entre mantenimientos preventivos y correctivos.
* Recuento global de activos registrados y en operación.
* Alertas destacadas relacionadas con mantenimientos próximos o vencidos.

### Gestión de Activos

Módulo para administrar el inventario digital de la organización, clasificando los activos en categorías como maquinaria, vehículos, herramientas y equipos informáticos. Registra la siguiente información:

* Código de identificación interno.
* Marca y modelo.
* Información técnica y especificaciones.
* Ubicación física.
* Estado operacional actual.

### Planificación de Mantenimientos

Herramienta para organizar y programar actividades preventivas asegurando la continuidad del negocio. Los criterios de planificación incluyen:

* Frecuencia de tiempo o fecha programada.
* Frecuencia de uso (horas de trabajo, kilometraje).
* Seguimiento del estado de cumplimiento.

### Gestión de Órdenes de Trabajo

El sistema permite crear, asignar y realizar seguimiento de tareas a través de un flujo estructurado. La interfaz utiliza un esquema tipo Kanban visual para facilitar la gestión de los siguientes estados:

* Pendiente
* Asignada
* En progreso
* Completada

### Administración del Personal Técnico

Módulo de recursos humanos enfocado en el área técnica para gestionar:

* Perfiles y datos de contacto de los técnicos.
* Asignación directa de órdenes de trabajo.
* Monitoreo de la distribución de la carga laboral y seguimiento de actividades.

---

## Instalación y Configuración Local

### Prerrequisitos

Para ejecutar el proyecto en un entorno local, asegúrese de contar con las siguientes herramientas:

* **Node.js:** Versión 20 LTS o superior.
* **Supabase:** Una cuenta activa y un proyecto previamente configurado.
* **Git:** Instalado y configurado en el sistema local.

### Pasos de Instalación

**1. Clonar el repositorio**

```bash
git clone https://github.com/FloppaCoder/MantiApp.git
cd mantiapp-web

```

**2. Instalar dependencias**

```bash
npm install

```

**3. Configurar variables de entorno**
Cree un archivo `.env.local` en el directorio raíz del proyecto y defina las credenciales de conexión:

```env
NEXT_PUBLIC_SUPABASE_URL=su_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=su_supabase_anon_key

```

**4. Ejecutar el servidor de desarrollo**

```bash
npm run dev

```

Una vez iniciado el servidor, acceda desde su navegador web a `http://localhost:3000`. El sistema solicitará autenticación inicial para validar sus credenciales y permisos.

---

## Estructura de Base de Datos

El sistema gestiona su modelo relacional a través de Supabase. El esquema `public` está compuesto por las siguientes entidades interconectadas:

*   **`users`**: Almacena la información de acceso y establece el nivel de autorización.
    *   *Datos clave:* Identificador (vinculado a Supabase Auth), email, nombre, apellido y rol (`administrador` o `tecnico`).
*   **`profiles`**: Extensión de perfiles, diseñada específicamente para el personal técnico en campo.
    *   *Datos clave:* Especialidad y teléfono de contacto.
*   **`assets`**: Repositorio central del inventario físico de la empresa.
    *   *Datos clave:* Código interno, nombre, categoría, ubicación y estado operacional.
*   **`maintenance_plans`**: Motor de prevención que programa las intervenciones futuras.
    *   *Datos clave:* Relación con el activo (`asset_id`), tipo de mantenimiento, tarea a realizar, frecuencia y próxima fecha calculada.
*   **`work_orders`**: Núcleo operativo para la gestión de tareas (Tablero Kanban).
    *   *Datos clave:* Código de OT, relación con el activo (`asset_id`) y el técnico asignado (`tecnico_id`), prioridad, estado actual, checklist de validación (JSONB) y URL de evidencia fotográfica.
---

## Tecnologías Utilizadas

| Tecnología | Rol en el Proyecto |
| --- | --- |
| **Next.js** | Framework principal y enrutamiento (App Router) |
| **React** | Construcción interactiva de la interfaz de usuario |
| **Tailwind CSS** | Sistema de diseño y hojas de estilo de utilidad |
| **Supabase** | Base de datos relacional, Backend as a Service y Autenticación |
| **Vercel** | Infraestructura de despliegue en producción |
| **GitHub** | Sistema de control de versiones y colaboración |

---

## Equipo de Desarrollo

Proyecto desarrollado por el **Equipo T-025 / CachadaSV** para la asignatura *Diseño y Programación de Software Multiplataforma DPS941 GOIT (Virtual)* de la Universidad Don Bosco.

* **Carlos Marcelo Cruz Menjívar** — CM232707
* **Víctor Rafael Cornejo García** — CG232706
* **Eleazar Hazael Amaya Sánchez** — AS232697

**Docente:** Alexander Alberto Sigüenza Campos

**Fecha de entrega:** 23 de agosto de 2026

---

**Licencia:** Este proyecto fue diseñado y desarrollado con fines estrictamente académicos.
