# Reloj Laboral Galaga API

Backend PERN (PostgreSQL, Express, React, Node.js) que complementa la aplicación frontend existente. Implementa una arquitectura limpia basada en controladores, servicios y repositorios para facilitar el mantenimiento y la escalabilidad.

## Características clave

- **Autenticación JWT** con tokens de actualización almacenados de forma segura.
- **Gestión de usuarios** con control de roles, estado activo y configuración de jornada.
- **Registro de fichajes** con soporte para inserciones masivas y correcciones auditadas.
- **Gestión de ausencias** con subida de adjuntos y flujo de aprobación.
- **Informes mensuales** con generación automática y estados de revisión/contestación.
- **Portal oficial** con estadísticas globales y trazabilidad de accesos.
- **Middleware comunes** (rate limiting, CORS, Helmet, validación con Zod, manejo de errores centralizado).
- **Scripts** para desarrollo (`npm run dev`) y compilación (`npm run build`).

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuración

1. Copia el archivo `.env.example` y renómbralo a `.env`:

   ```bash
   cp .env.example .env
   ```

2. Ajusta las variables de entorno según tu entorno local (cadena de conexión de PostgreSQL, secretos JWT, etc.).

3. Ejecuta las migraciones SQL ubicadas en `src/database/migrations` en tu base de datos PostgreSQL.

4. Instala las dependencias y lanza el servidor en modo desarrollo:

   ```bash
   npm install
   npm run dev
   ```

   Por defecto el servidor escucha en `http://localhost:4000`.

## Scripts disponibles

| Comando          | Descripción                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Inicia el servidor con recarga en caliente |
| `npm run build`  | Compila el código TypeScript a JavaScript |
| `npm start`      | Ejecuta el servidor compilado (`dist`)    |

## Estructura

```
backend/
├── src/
│   ├── config/             # Carga y validación de variables de entorno
│   ├── controllers/        # Controladores Express (capa HTTP)
│   ├── database/           # Pool de Postgres y migraciones SQL
│   ├── domain/             # Modelos de dominio tipados
│   ├── errors/             # Clases de error personalizadas
│   ├── middlewares/        # Middlewares reutilizables
│   ├── repositories/       # Acceso a datos y mapeo a dominio
│   ├── routes/             # Definición de rutas REST
│   ├── services/           # Lógica de negocio y orquestación
│   ├── types/              # Tipos globales/augmentations
│   └── utils/              # Utilidades comunes (logger, tokens, etc.)
├── package.json
├── tsconfig.json
└── .env.example
```

## Estándares

- Código en TypeScript con `strict` activado.
- Validación de datos con `zod` en cada endpoint.
- Separación clara entre capas (controladores ➜ servicios ➜ repositorios).
- Respuestas consistentes y manejo centralizado de errores.

¡Listo! El backend queda preparado para integrarse con el frontend de Reloj Laboral Galaga.
