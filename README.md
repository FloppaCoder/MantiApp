Aquí tienes el archivo `README.md` final, estructurado profesionalmente con absolutamente todo el detalle técnico del documento de diseño, los enlaces de despliegue en Vercel, la conexión a Supabase y la información académica completa de los integrantes de tu equipo.

Copia este bloque de código y pégalo directamente en tu archivo `README.md`:

# MantiApp - Panel Administrativo (Web) ⚙️

[![Despliegue en Vercel](https://img.shields.io/badge/Despliegue-Vercel-black?style=for-the-badge&logo=vercel)](https://manti-app.vercel.app/)
[![Repositorio en GitHub](https://img.shields.io/badge/Repositorio-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/FloppaCoder/MantiApp)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

MantiApp es una solución de software multiplataforma orientada a democratizar la gestión técnica de activos (CMMS - Computerized Maintenance Management System) para Pequeñas y Medianas Empresas (PYMEs)[cite: 32]. 

Este repositorio contiene el **Panel de Administración Web**, diseñado específicamente para el rol de Administrador. Su objetivo es transformar el mantenimiento reactivo en un esquema preventivo sistematizado, facilitando la toma de decisiones gerenciales, la visualización de métricas, el control centralizado del inventario de activos, la programación de calendarios y el despacho de órdenes de trabajo[cite: 32].

---

## 🌐 Enlaces del Proyecto

*   **Aplicación en Vivo (Vercel):** [https://manti-app.vercel.app/](https://manti-app.vercel.app/)
*   **Repositorio GitHub:** [https://github.com/FloppaCoder/MantiApp](https://github.com/FloppaCoder/MantiApp)

---

## 🏗️ Arquitectura del Sistema

El proyecto está estructurado siguiendo una **Arquitectura en Tres Capas (Three-Tier Architecture)** para garantizar escalabilidad, desacoplamiento de componentes y consistencia en el desarrollo multiplataforma[cite: 32]:

### 1. Capa de Presentación (UI)
*   **Framework:** [Next.js](https://nextjs.org/) (v16.3.5) utilizando el App Router. Implementa renderizado híbrido (SSR / SSG / CSR) para optimizar los tiempos de carga inicial y la seguridad[cite: 32].
*   **Librería de Interfaz:** [React](https://react.dev/) (v19.2.8) para la construcción de componentes interactivos y reutilizables[cite: 32].
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (v4) para un diseño responsivo, fluido y moderno.

### 2. Capa de Lógica de Negocio
*   **Control de Acceso Basado en Roles (RBAC):** Restringe y autoriza la ejecución de funciones. El usuario con rol `administrador` tiene acceso total al panel web, mientras que el rol `tecnico` es redirigido exclusivamente al aplicativo móvil[cite: 32].
*   **Motor de Reglas y Estado Global:** Gestión centralizada de sesiones, validación de formularios y evaluación de estados de mantenimiento (alertas proactivas de servicios próximos o vencidos)[cite: 32].

### 3. Capa de Datos y Persistencia
*   **Backend as a Service (BaaS):** [Supabase](https://supabase.com/) utilizando base de datos relacional PostgreSQL[cite: 32].
*   **Autenticación:** Supabase Auth con manejo de tokens JWT para sesiones e integraciones seguras[cite: 32].

---

## 🔑 Características Principales

*   **Dashboard Gerencial:** Visualización en tiempo real de métricas consolidadas, comparativas de mantenimientos preventivos vs. correctivos, conteo de activos y sistema de alertas críticas[cite: 32].
*   **Inventario Digital de Activos:** Catálogo completo para registrar maquinarias, vehículos, herramientas y equipos informáticos con capacidades de búsqueda y filtrado por estado operacional[cite: 32].
*   **Planificación y Prevención:** Automatización de la calendarización de mantenimientos preventivos basados en frecuencias de tiempo o uso[cite: 32].
*   **Gestión de Órdenes de Trabajo (Kanban):** Interfaz ágil para la creación, asignación y seguimiento de tareas en diferentes estados (Pendiente, Asignada, En progreso, Completada)[cite: 32].
*   **Administración de Personal Técnico:** Módulo para gestionar el perfil de los técnicos de campo, asignación de carga laboral y métricas de desempeño[cite: 32].

---

## 🛠️ Instalación y Configuración Local

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (versión 20 LTS o superior).
*   Una cuenta y proyecto configurado en [Supabase](https://supabase.com/).

### Pasos de ejecución

1. **Clonar el repositorio:**
   
   git clone [https://github.com/FloppaCoder/MantiApp.git](https://github.com/FloppaCoder/MantiApp.git)
   cd mantiapp-web



2. **Instalar dependencias:**
bash npm install



3. **Configurar variables de entorno:**
Crea un archivo `.env.local` en la raíz del proyecto y agrega tus credenciales de Supabase:
env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key



4. **Ejecutar el servidor de desarrollo:**
bash
npm run dev



Abre [http://localhost:3000](http://localhost:3000?utm_source=gemini) en tu navegador. El sistema solicitará inicio de sesión para validar los accesos.

---

## 🗄️ Estructura de Base de Datos (Esquema Público)

El sistema requiere la siguiente estructura base en la base de datos PostgreSQL de Supabase:

* `users`: Almacena los perfiles de usuario, credenciales y roles asignados (`administrador` o `tecnico`). El campo `id` de esta tabla está vinculado directamente con el UUID de Supabase Auth.


* `assets`: Fichas técnicas de los equipos, incluyendo marca, modelo, ubicación, código y estado de confiabilidad.



---

## 👥 Equipo de Desarrollo (Equipo T-025 / CachadaSV)

Proyecto desarrollado para la materia de **Diseño y Programación de Software Multiplataforma DPS941 GOIT (Virtual)** en la **Universidad Don Bosco**.

* 👨‍💻 **Carlos Marcelo Cruz Menjívar** - CM232707


* 👨‍💻 **Víctor Rafael Cornejo García** - CG232706


* 👨‍💻 **Eleazar Hazael Amaya Sánchez** - AS232697



**Docente:** Alexander Alberto Sigüenza Campos

**Fecha de Entrega:** Domingo 23 de agosto de 2026
