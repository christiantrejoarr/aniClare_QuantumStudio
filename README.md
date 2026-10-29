# AniClare Spa

Plataforma del spa: catálogo, reservas y panel de administración.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) en ejecución
- Node.js 22 y npm, solo si vas a trabajar la PWA con recarga automática

## 1. Configurar el entorno local

En la raíz del repositorio:

```powershell
Copy-Item .env.example .env
```

`.env` queda fuera de git. Los valores de `.env.example` sirven para esta máquina. No los uses en producción.

## 2. Levantar el proyecto

Desde la raíz:

```powershell
docker compose up -d --build
```

La primera vez construye la API y la PWA. Cuando el contenedor `api` quede healthy:

| Qué | Dirección |
|---|---|
| Sitio | http://localhost:8080 |
| API | http://localhost:3000/api/health |
| Panel de administración | http://localhost:8080/admin |

La primera vez que arranca la API crea la cuenta de administración en PostgreSQL, tabla `identity.users`. El usuario y la contraseña salen de `ADMIN_USERNAME` y `ADMIN_PASSWORD` en `.env`. Con el ejemplo local son `admin` y `change-me-local-only`. Si esa cuenta ya existe, no se vuelve a escribir.

Ahí se ven todas las reservas y se editan los servicios, con precio, duración y anticipo.

## 3. Trabajar la PWA con recarga automática

El contenedor del paso anterior publica el sitio ya compilado. Para ver los cambios de `apps/web` al guardar:

```powershell
cd apps\web
npm install
npx ng serve --host 127.0.0.1 --port 4200
```

Ábrela en http://127.0.0.1:4200. Sigue usando la API de Docker en http://localhost:3000/api. El panel queda en http://127.0.0.1:4200/admin.

## 4. Detener

Desde la raíz:

```powershell
docker compose down
```

Eso apaga los contenedores y conserva la base de datos. Para borrar también los volúmenes locales:

```powershell
docker compose down -v
```
