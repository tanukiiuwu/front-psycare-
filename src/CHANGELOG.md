# Historial de versiones – PsyCare

Este archivo documenta los principales cambios y versiones del frontend de PsyCare.

## [1.0.0] - 2025-05-14

### Agregado

- Estructura básica del proyecto organizada por carpetas:
  - `/src`: Código fuente.
  - `/public`: Archivos estáticos.
- Página de inicio con logo centrado y saludo personalizado.
- Registro y login conectados a API externa.
- Panel para pacientes con sección "Hoy Me Sentí".
- Cuestionarios diarios con conexión a base de datos.
- Sección de configuración editable desde el frontend.
- Variables de entorno con soporte para Vite (`VITE_API_URL`).

### Mejorado

- Diseño responsivo con CSS limpio.
- Separación de archivos JS embebidos, y CSS externo.

### Pendiente

- Validación avanzada de formularios.
- Integración con notificaciones o alertas personalizadas.
