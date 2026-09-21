# MantiApp - Panel Administrativo (Web) ⚙️

MantiApp es una solución de software multiplataforma orientada a democratizar la gestión técnica de activos (CMMS - Computerized Maintenance Management System) para Pequeñas y Medianas Empresas (PYMEs). 

Este repositorio contiene el **Panel de Administración Web**, diseñado específicamente para el rol de Administrador. Su objetivo es facilitar la toma de decisiones gerenciales, la visualización de métricas (dashboards), el control centralizado del inventario de activos, la programación de calendarios y el despacho de órdenes de trabajo.

---

## 🚀 Tecnologías Utilizadas

El proyecto está desarrollado con una arquitectura moderna basada en componentes y renderizado híbrido:

*   **Framework:** [Next.js](https://nextjs.org/) (v16.3.5) con App Router[cite: 3, 13].
*   **Librería UI:** [React](https://react.dev/) (v19.2.8)[cite: 3].
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (v4)[cite: 3].
*   **Base de Datos y Autenticación:** [Supabase](https://supabase.com/) (v2.116.0) utilizando PostgreSQL[cite: 3, 13].

---

## 🔑 Características Principales

*   **Control de Acceso Basado en Roles (RBAC):** Sistema de autenticación seguro que restringe el acceso a la plataforma web exclusivamente a los usuarios con el rol de `administrador`.
*   **Dashboard Gerencial:** Visualización en tiempo real de métricas consolidadas, mantenimientos preventivos vs. correctivos, conteo de activos y sistema de alertas críticas.
*   **Inventario Digital de Activos:** Catálogo completo para registrar maquinarias, vehículos, herramientas y equipos informáticos con capacidades de búsqueda y filtrado por estado operacional.
*   **Gestión de Órdenes de Trabajo (Kanban):** Interfaz ágil para la creación, asignación y seguimiento de tareas en diferentes estados (Pendiente, Asignada, En progreso, Completada).
*   **Administración de Personal Técnico:** Módulo para gestionar el perfil de los técnicos de campo, asignación de carga laboral y métricas de desempeño[cite: 13].

---

## 🛠️ Instalación y Configuración Local

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (versión 20 LTS o superior)[cite: 3, 4].
*   Una cuenta y proyecto configurado en [Supabase](https://supabase.com/).
