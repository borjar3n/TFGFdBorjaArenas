# Sistema de Gestión Agrícola

Este es un sistema web integral diseñado para la gestión y optimización de explotaciones agrarias. La plataforma ofrece herramientas digitales para el análisis de datos, visualización de mapas y administración de las operaciones diarias de una finca.

## 📜 Descripción

El proyecto es una aplicación full-stack que busca resolver problemas comunes en la gestión agrícola, como el manejo manual de datos, la complejidad del catastro y la falta de análisis de rentabilidad. Proporciona una solución centralizada para mejorar la eficiencia y la toma de decisiones.

## ✨ Características Principales

* **🗺️ Integración con Catastro**: Permite la selección visual de parcelas directamente desde los mapas oficiales del catastro español.
* **🏢 Sistema Multi-empresa**: Administra múltiples explotaciones o empresas desde una única plataforma, con datos aislados y permisos granulares.
* **📊 Análisis de Datos**: Ofrece un motor de análisis para calcular métricas de producción, económicas, operacionales y ambientales.
* **📱 Diseño Responsivo**: Interfaz optimizada para su uso tanto en escritorio como en dispositivos móviles directamente en el campo.
* **📦 Gestión de Inventario**: Lleva un control en tiempo real de los insumos agrícolas (semillas, fertilizantes, etc.) con alertas de stock.
* **📋 Planificación de Tareas**: Facilita la asignación y el seguimiento de las tareas agrícolas por parcela y por usuario.

## 🛠️ Tecnologías Utilizadas

El proyecto está construido con un stack de tecnologías moderno y robusto:

* **Frontend**:
    * React
    * TypeScript
    * Vite
    * Tailwind CSS
    * shadcn/ui (para componentes de interfaz)
    * React Leaflet (para mapas)
    * Recharts (para gráficos)
* **Backend**:
    * Node.js
    * Express.js
    * Drizzle ORM (para interactuar con la base de datos)
    * Passport.js (para autenticación)
* **Base de Datos**:
    * PostgreSQL
    * PostGIS (para datos geográficos)

## 🚀 Instalación y Puesta en Marcha

Para ejecutar este proyecto en tu entorno local, sigue estos pasos:

1.  **Clonar el repositorio**:
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd AgriculturalManagement
    ```

2.  **Instalar dependencias**:
    Asegúrate de tener Node.js (versión 18+) instalado.
    ```bash
    npm install
    ```

3.  **Configurar la base de datos**:
    * Instala PostgreSQL (versión 15+) y la extensión PostGIS.
    * Crea una base de datos para el proyecto.

4.  **Variables de entorno**:
    * Crea un archivo `.env` en la raíz del proyecto.
    * Configura la variable `DATABASE_URL` para conectar con tu base de datos.

5.  **Aplicar las migraciones de la base de datos**:
    ```bash
    npm run db:push
    ```

6.  **Iniciar la aplicación**:
    ```bash
    npm run dev
    ```

La aplicación debería estar funcionando en `http://localhost:5000`.

## 📦 Scripts Disponibles

En el archivo `package.json` se definen los siguientes scripts:

* `npm run dev`: Inicia el servidor de desarrollo.
* `npm run build`: Compila el proyecto para producción.
* `npm start`: Ejecuta la versión de producción compilada.
* `npm run check`: Realiza una comprobación de tipos con TypeScript.
* `npm run db:push`: Aplica los cambios del esquema a la base de datos.