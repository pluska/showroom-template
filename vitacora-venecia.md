# Vitacora Venecia Showroom - Registro de Progreso

**Proyecto:** Showroom Virtual para Venecia  
**Tipo:** Next.js + Cloudflare Pages + D1 Database  
**Estado:** En Producción  
**Última Actualización:** 18 de Junio de 2026

---

## 📋 Resumen Ejecutivo

Venecia Showroom es una plataforma web de experiencia inmobiliaria de alta performance, construida con Next.js 15, Cloudflare Pages/Workers, y una base de datos D1. El proyecto implementa un showroom virtual 360° con gestión administrativa completa, tours virtuales, galerías de unidades, mapas interactivos, y sistema de reservas con calendario.

**Arquitectura Principal:**
- Frontend: Next.js 15 con App Router
- Backend: Server Actions + API Routes (Cloudflare Workers)
- Base de Datos: Cloudflare D1 con Drizzle ORM
- Almacenamiento: Cloudflare R2 para media pesada
- Estilo: Tailwind CSS + DaisyUI
- Estado: Zustand
- Animaciones: GSAP
- Mapas: React Map GL (Mapbox)

---

## 🚀 Hitos Principales de Desarrollo

### Fase 1: Inicialización Base (Commits iniciales - Abril 2026)
- Configuración inicial del proyecto Next.js
- Integración con Cloudflare Pages y Workers
- Setup de variables de entorno y configuración base
- Estructura de directorios y componentes iniciales

### Fase 2: Componentes Core (Mayo 2026)
- **360° Scene Controller**: Sistema de transiciones entre caras del edificio
- **Interactive Floor Plans**: Planes SVG con unidades interactivas
- **Virtual Tours Integration**: Integración de Matterport
- **Dynamic Map**: Mapbox con rutas personalizadas
- **Gallery Management**: Galerías de fotos para unidades
- **Contact Form**: Formulario de contacto con integración de emails

### Fase 3: Migración a Media Pesada (Mayo-Junio 2026)
- Migración de assets a Cloudflare R2 (25MB limit Pages)
- Optimización de videos de portada
- Setup de galerías por unidad (201/202/302/801/802)
- Compresión y optimización de media

**Commits Clave:**
- `940d885`: Move files to R2 (asset limit fix)
- `e735a13`: Update portada video y amenities
- `d3714e7`: Migrate heavy media + typologies

### Fase 4: Refinamientos Visuales (Junio 2026)
- Adición de typologías con transiciones
- Transiciones entre floors por nivel de duplex
- Fix de flash fantasma en rotaciones
- Posicionamiento mejorado de video de contacto
- Tema light forzado

**Commits Clave:**
- `3e47b52`: Fix duplex level-2 assets
- `13e0320`: Show contact video beside form
- `2e35d6e`: Force light theme

### Fase 5: Dashboard Administrativo (12 de Junio de 2026) ✅
**Commit:** `4bef2ef` - "Dashboard migration"

Implementación completa de sistema administrativo con:
- **Autenticación:** NextAuth con gestión de usuarios
- **Base de Datos:** Schema completo con 11 migraciones Drizzle
- **Admin Pages:** 14+ páginas de gestión
  - Brochure management
  - Building configuration
  - Calendar y disponibilidad
  - Features (características)
  - Galleries (galerías por unidad)
  - Identity/Settings
  - Logs de actividad
  - Map configuration
  - Media management
  - Progress (construcción)
  - Tours (recorridos)
  - Units (unidades)
  - Users (usuarios)
  - Video Amenities

**Cambios Principales:**
- 35,300+ líneas de código agregadas
- Database schema con tables para: users, units, buildings, galleries, calendars, appointments, features, tours, media
- Server Actions para cada dominio
- API routes para integraciones
- Componentes de UI completos para admin

### Fase 6: Optimización Post-Dashboard (13-18 de Junio de 2026)
Refinamientos y optimizaciones tras la implementación del dashboard:

**Performance:**
- `8800040`: Stop background video preloading
- `83069ec`: Smoother transitions + non-blocking navigation
- `fbc7b91`: Optimize transition loading

**Fixes Visuales:**
- `bb47204`: Fix ghost frame flash + cache inmutable + range support
- `f366732`: Fix duplex plan rendering
- `e1061d4`: Blend typology video con plans
- `647cfc5`: Floor plan images full screen
- `5615ce1`: Fix previous face flash

**Media Optimization:**
- `529bdea`: Convert contact image to WebP
- `3a694ca`: Migrate building faces PNG → WebP

### Fase 7: Pulido de Transiciones del Showroom (18 de Junio de 2026)
Eliminación del "ghost-frame" (cara/fondo anterior visible brevemente durante transiciones de rotación, día/noche y entrada) y mejoras de UX de carga, basadas en reportes técnicos detallados del usuario sobre timing de decodificación de imágenes en el navegador.

**Cambios Principales:**
- Spinner de carga movido del overlay centrado a los propios botones que disparan la acción (rotación, día/noche, "Ingresar"), en vez de un fade-out global de la UI.
- Sistema de doble buffer con crossfade por opacidad para las imágenes de fondo (`SceneController.tsx`): cada nueva imagen se monta en una capa `<img>` independiente y solo se revela (crossfade) una vez que `img.decode()` confirma que el bitmap está realmente decodificado, evitando el parpadeo del frame anterior.
- Cache de decodificación (`decodedImageCacheRef`/`warmDecode`) que mantiene "calientes" en memoria las imágenes de las caras vecinas y el fondo alterno (día/noche), evitando ~300-400ms de demora de decodificación en el primer clic aunque los bytes ya estén en caché HTTP.
- Precarga ampliada a todas las caras del edificio (no solo las vecinas inmediatas), ya que solo hay 2-3 caras en total.
- Video de entrada "Ingresar" → `/plantas/9` movido a un componente de layout (`FloorEntryTransition.tsx`, montado en `layout.tsx`) que sobrevive a la navegación `showroom` → `/plantas/9`, evitando que el video se desmonte a mitad de la transición.
- Fix de un flash de "Piso 9 not found" / Lobby vacío en cargas frías: tanto `FloorEntryTransition` como `SceneController` ahora esperan a que los datos/imagen de destino estén realmente listos antes de revelar la vista (con timeout de seguridad de 4s para nunca quedar bloqueados en negro).
- Botón de header de tours (`TourHeader.tsx`) reposicionado ligeramente más abajo para no chocar con un control nativo de Kuula.

**Commits Clave:**
- `9030d8a` / `0dfdcbf` / `2fd7500`: Spinner inline en botones (reemplaza overlay/máscara negra)
- `e2f9b66`: Doble buffer con crossfade de opacidad
- `5e7c389`: Precarga de todas las caras del edificio
- `cca1cbd`: Video de entrada a plantas movido a overlay de layout (`FloorEntryTransition`)
- `918350e`: Cache de decodificación para imágenes vecinas
- `3eb7631`: No revelar destino hasta que datos/imagen estén listos (fix "Piso 9 not found")

---

## 📊 Estado Actual (18 de Junio de 2026)

### Completado ✅
- [x] Frontend completo y responsive
- [x] Dashboard administrativo funcional
- [x] Sistema de autenticación
- [x] Base de datos D1 con schema completo
- [x] Integración Cloudflare (Pages, Workers, R2)
- [x] Showroom 360° con transiciones smooth
- [x] Mapas interactivos
- [x] Sistema de tours virtuales
- [x] Galerías por unidad
- [x] Formulario de contacto con emails
- [x] Optimización de media (WebP, R2)
- [x] Deploy automático vía git push a main

### En Monitoreo/Mantenimiento
- [ ] Performance monitoring en producción
- [ ] User testing de dashboard
- [ ] Feedback de usuarios finales
- [ ] Optimización de SEO

---

## 🔧 Dependencias Principales

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "drizzle-orm": "0.45.2",
  "next-auth": "5.0.0-beta.31",
  "gsap": "3.14.2",
  "react-map-gl": "8.1.0",
  "mapbox-gl": "3.18.1",
  "tailwindcss": "4.0",
  "zustand": "5.0.11"
}
```

---

## 📁 Estructura de Base de Datos (D1)

### Tablas Principales
- **users**: Gestión de usuarios del admin
- **buildings**: Información del edificio
- **units**: Unidades inmobiliarias
- **floors**: Plantas/niveles
- **galleries**: Galerías de fotos
- **unit_galleries**: Relación unidad-galería
- **amenities**: Amenidades del proyecto
- **amenity_videos**: Videos de amenidades
- **tours**: Tours virtuales
- **calendars**: Disponibilidad
- **appointments**: Reservas/citas
- **appointments_time_slots**: Horarios disponibles
- **features**: Características del proyecto
- **progress**: Progreso de construcción
- **brochures**: Material de marketing

---

## 🚀 Scripts y Comandos

```bash
# Desarrollo
npm run dev                    # Dev server en localhost:3000
npm run dev:pages            # Dev con Cloudflare Pages

# Build
npm run build                 # Build para producción
npm run pages:build           # Build para Cloudflare Pages

# Base de Datos
npm run db:generate          # Generate migrations
npm run db:migrate           # Apply migrations
npm run db:studio            # Drizzle Studio
npm run db:seed              # Seed data

# Utilities
npm run lint                 # ESLint
```

---

## 🌐 URLs y Rutas Principales

**Público:**
- `/` - Home/Portada
- `/showroom` - Showroom 360°
- `/plantas` - Floor plans
- `/recorridos` - Tours virtuales
- `/ubicacion` - Mapa interactivo
- `/galeria` - Galerías
- `/avance-de-obra` - Progreso de construcción
- `/unidad/[id]` - Detalle de unidad
- `/contact` - Contacto
- `/login` - Acceso usuario

**Admin:**
- `/dashboard` - Dashboard principal
- `/dashboard/building` - Configuración edificio
- `/dashboard/units` - Gestión de unidades
- `/dashboard/galleries` - Galerías
- `/dashboard/calendar` - Calendario y disponibilidad
- `/dashboard/tours` - Tours
- `/dashboard/progress` - Progreso construcción
- `/dashboard/brochure` - Brochures
- `/dashboard/media` - Media
- `/dashboard/users` - Usuarios
- `/dashboard/logs` - Logs

---

## 🔐 Variables de Entorno Requeridas

```env
# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# Assets Storage
NEXT_PUBLIC_ASSET_BASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Email
RESEND_API_KEY=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_API_TOKEN=
```

---

## 📈 Métricas de Progreso

| Aspecto | Progreso |
|---------|----------|
| Frontend UI | 100% ✅ |
| Dashboard Admin | 100% ✅ |
| Base de Datos | 100% ✅ |
| API Integration | 100% ✅ |
| Media Optimization | 100% ✅ |
| Deployment | 100% ✅ |
| Performance | 95% 🔄 |
| Testing | 70% 🔄 |
| Documentation | 80% 🔄 |

---

## 🎯 Próximos Pasos Potenciales

1. **Testing:**
   - Unit tests para server actions
   - E2E tests para dashboard
   - Performance testing

2. **Enhancements:**
   - Analytics integration
   - A/B testing de forms
   - Mejora de SEO
   - Internationalization (i18n)

3. **Mantenimiento:**
   - Monitoreo en producción
   - Error tracking (Sentry)
   - User feedback collection
   - Regular security audits

---

## 📚 Documentación Relacionada

- [STRUCTURE.md](./STRUCTURE.md) - Arquitectura detallada
- [CLONE_AND_FILL.md](./CLONE_AND_FILL.md) - Guía para replicar el template
- [RULES_AI.md](./RULES_AI.md) - Reglas para asistentes IA
- [README.md](./README.md) - Información general

---

## 📝 Notas de Implementación

### Consideraciones Técnicas Importantes

1. **Assets > 25MB:**
   - Media pesada debe estar en R2
   - Configurar URLs de R2 en config
   - Usar lazy loading para videos

2. **Database:**
   - D1 es serverless, sin connection pooling
   - Usar server actions para queries
   - Migrations vía wrangler

3. **Performance:**
   - Cache headers configurados en worker
   - WebP para imágenes
   - Lazy loading de videos
   - Non-blocking transitions

4. **Deployment:**
   - `git push main` dispara build automático
   - Wrangler maneja D1 migrations
   - R2 es replicado globalmente

---

**Documento actualizado:** 18 de Junio de 2026  
**Responsable:** Andres Pluska  
**Email:** adrianavbastidasp@gmail.com
