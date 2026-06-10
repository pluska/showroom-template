# Tareas Pendientes (TODO)

- [ ] **Formulario de Contacto - Calendario**: Implementar la integración del calendario en el formulario de contacto para que los prospectos puedan agendar reuniones presenciales o virtuales con los vendedores.
- [ ] **Mapa - Videos**: Implementar la funcionalidad de visualización de videos incrustados dentro de los marcadores o modales del mapa.
- [ ] **Autenticación**: Reactivar el login y middleware (descomentar código en `layout.tsx` y `middleware.ts`).
- [ ] **Roles y Permisos**: Validar el acceso a módulos según el rol del usuario (Super Admin, Admin, Seller) y realizar pruebas de flujo.
- [ ] **Módulo de Prospectos (Futuro)**: Diseñar y desarrollar un módulo dedicado para la gestión de prospectos. Configurar integraciones para enviar archivos (brochures, fichas de unidades, etc.) de forma directa desde el servidor:
  - **Correo electrónico**: Envío automático de archivos PDF adjuntos desde el backend utilizando Resend.
  - **WhatsApp**: Envío de documentos y plantillas multimedia directamente a los chats de los clientes utilizando una API de WhatsApp (como Twilio WhatsApp API o Meta Cloud API).
