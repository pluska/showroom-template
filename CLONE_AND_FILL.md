# How to Use This Template

This template is designed to help you create new showroom projects quickly. Follow these steps to set up a new project:

## 1. Clone and Install
Clone this repository and install dependencies:
```bash
npm install
```

## 2. Configure Project Identity
Open `src/config/config.ts` and update all the placeholders with your project's specific information:
- `appName`, `appDescription`, `domainName`
- `colors.main` (Your primary brand color)
- `company` and `buildingSocials` information

## 3. Set Up Environment Variables
Copy the example environment file and fill in your project's credentials:
```bash
cp .env.example .env.local
```
Key variables to configure:
- `NEXT_PUBLIC_ASSET_BASE_URL`: URL pointing to the folder containing your project's images and videos.
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Mapbox token for location maps.
- `NEXTAUTH_SECRET`: Secret key for authentication sessions.

## 4. Database Schema & Seeding (New D1 Dynamic Data)
This template uses a Cloudflare D1 database (SQLite) for dynamic data. Follow these steps to seed it:
1. **Floors & Units**:
   - Update `src/data/floors.ts` with your floors and unit details (prices, status, coordinates, dimensions).
   - Generate the SQL seed file based on your `floors.ts` content:
     ```bash
     node generate-seed.mjs
     ```
     This creates `seed.sql` in the root folder.
2. **Apply Migrations and Seed**:
   - Initialize the local database:
     ```bash
     npm run db:generate
     npm run db:migrate
     npm run db:seed
     ```
3. **Puntos de Interés (Map POIs)**:
   - Configure your project's local landmarks/POIs in `src/data/santa_fe_locations.json`. 
   - Upon first load of the Map dashboard (`/dashboard/map`) or the client Map view (`/ubicacion`), the system will automatically seed this data into the D1 `locations_poi` table.

## 5. Fill Static Data Files
Update the remaining files in `src/data/` with your project data:
- `homepage.ts`: Update the hero section content and introduction slides.
- `buildingData.ts`: Define the building faces, background images, and transition videos.

## 6. Update Asset Manifest
Add all the asset paths that need to be preloaded to `src/data/asset-manifest.ts`. This ensures a smoother user experience as assets are loaded in the background.

## 7. Run Locally & Deploy
Verify everything works locally:
```bash
# Cloudflare Pages dev server (recommended for D1/R2 compatibility)
npm run dev:pages
```
When ready, build the project:
```bash
npm run build
```

---

### Tips for Customizing Dynamic Features:

1. **Map POI Presets & Uploads**:
   - **Preset Icons**: The clickable icon suggestions for Point of Interests (POIs) in the admin dashboard are defined statically in `src/components/dashboard/map/MapDashboard.tsx` inside `ICON_PRESETS` grouped by category. If you add new icon assets to `/public/icons/`, append their paths to `ICON_PRESETS` to display them as clickable presets. Alternatively, you can type the path manually in the field or use the **"Subir Ícono Propio"** tab to upload them directly.
2. **Galleries & R2 Images**:
   - The photo galleries are managed dynamically via `/dashboard/galleries`.
   - Default collections (`general`, `amenities`, `floor-1`) are auto-seeded on first load. You can add new collections, upload cover photos, and add images directly via R2/D1 database bindings.
   - If a collection doesn't have any images in the database yet, it will safely fall back to listing matching assets from `src/data/asset-manifest.ts` matching the collection folder name (e.g. `gallery/` or `amenities/`).
3. **Role-Based Permissions**:
   - In local development mode without an active session, the mock user is assigned the `"SUPER_ADMIN"` role by default so you have access to all tabs (Units, Galleries, Maps, Logs, etc.) and can see `COMMON_AREA` units (like Terraces) which are hidden from regular customers or other roles.
