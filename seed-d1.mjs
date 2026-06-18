import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const baseFreelance = '/Users/andrespluska/Documents/freelance/venecia-showroom';

// Read floors.ts
const fileContent = fs.readFileSync(path.join(baseFreelance, 'src/data/floors.ts'), 'utf8');
let floorsDataStr = fileContent.substring(fileContent.indexOf('export const floorsData: Floor[] = [') + 'export const floorsData: Floor[] = '.length);
floorsDataStr = floorsDataStr.substring(0, floorsDataStr.lastIndexOf('];') + 1);

// We need a context where Floor and Unit type or Record aren't strictly required
const floorsData = eval(floorsDataStr);

let sql = '';
sql += 'DELETE FROM tours;\n';
sql += 'DELETE FROM units;\n';
sql += 'DELETE FROM floors;\n';
sql += 'DELETE FROM building_faces;\n';
sql += 'DELETE FROM locations_poi;\n\n';

// 1. Insert building faces
sql += `-- Seeding building_faces\n`;
sql += `INSERT INTO building_faces (id, name, day_background, day_background_video, day_highlight, day_intro_video, day_to_left_transition, day_to_right_transition, night_background, night_background_video, night_highlight, night_intro_video, night_to_left_transition, night_to_right_transition, day_to_night_transition, night_to_day_transition, "order") VALUES \n`;
sql += `(1, 'Cara Central', 'building/photos/face_0_daylight.webp', 'building/videos/face_0_daylight.mp4', NULL, 'videos/walks/walk_center_daylight.mp4', 'building/transitions/trans_0_to_2_daylight.mp4', 'building/transitions/trans_0_to_1_daylight.mp4', 'building/photos/face_0_nightlight.webp', 'building/videos/face_0_nightlight.mp4', NULL, 'videos/walks/walk_center_nightlight.mp4', 'building/transitions/trans_0_to_2_nightlight.mp4', 'building/transitions/trans_0_to_1_nightlight.mp4', 'building/transitions/trans_0_day_to_night.mp4', 'building/transitions/trans_0_night_to_day.mp4', 0),\n`;
sql += `(2, 'Cara Derecha', 'building/photos/face_1_daylight.webp', NULL, NULL, 'videos/walks/walk_right_daylight.mp4', 'building/transitions/trans_1_to_0_daylight.mp4', NULL, 'building/photos/face_1_nightlight.webp', NULL, NULL, 'videos/walks/walk_right_nightlight.mp4', 'building/transitions/trans_1_to_0_nightlight.mp4', NULL, 'building/transitions/trans_1_day_to_night.mp4', 'building/transitions/trans_1_night_to_day.mp4', 1),\n`;
sql += `(3, 'Cara Izquierda', 'building/photos/face_2_daylight.webp', NULL, NULL, 'videos/walks/walk_left_daylight.mp4', NULL, 'building/transitions/trans_2_to_0_daylight.mp4', 'building/photos/face_2_nightlight.webp', NULL, NULL, 'videos/walks/walk_left_nightlight.mp4', NULL, 'building/transitions/trans_2_to_0_nightlight.mp4', 'building/transitions/trans_2_day_to_night.mp4', 'building/transitions/trans_2_night_to_day.mp4', 2);\n\n`;

// 2. Insert floors & units
sql += `-- Seeding floors & units\n`;
for (const floor of floorsData) {
  const floorId = `floor_${floor.id}`;
  sql += `INSERT INTO floors (id, name, level, type, image_path) VALUES ('${floorId}', '${floor.name}', ${floor.name === 'PB' ? 0 : (parseInt(floor.name.replace(/\D/g, '')) || 0)}, 'Piso', '${floor.floorPlanImage}');\n`;
  
  for (const unit of floor.units) {
    const unitId = `unit_${floor.id}_${unit.id.replace(/\s+/g, '_').toLowerCase()}`;
    const coordinates = unit.x !== undefined && unit.y !== undefined ? JSON.stringify({ x: unit.x, y: unit.y, path: unit.path }) : (unit.path ? JSON.stringify({ path: unit.path }) : 'NULL');
    let state = unit.status === 'available' ? 'AVAILABLE' : (unit.status === 'sold' ? 'sold' === unit.status ? 'SOLD' : 'RESERVED' : 'RESERVED');
    if (unit.id === 'Terraza') {
      state = 'COMMON_AREA';
    }
    const typeStr = unit.type === 'storage' ? 'STORAGE' : 'APARTMENT';
    const bedrooms = unit.bedrooms || 'NULL';
    const bathrooms = unit.bathrooms || 'NULL';
    const areaSqm = unit.dimensions || 'NULL';
    const tourUrl = unit.tourUrl ? `'${unit.tourUrl}'` : 'NULL';
    const coordsSql = coordinates === 'NULL' ? 'NULL' : `'${coordinates}'`;

    let assetId = unit.id;
    if (['201', '301', '401', '501', '601', '701'].includes(unit.id)) {
      assetId = 'tipo_201';
    } else if (['202'].includes(unit.id)) {
      assetId = 'tipo_202';
    } else if (['302', '402', '502', '602', '702'].includes(unit.id)) {
      assetId = 'tipo_302';
    } else if (['801'].includes(unit.id)) {
      assetId = 'tipo_801';
    } else if (['802'].includes(unit.id)) {
      assetId = 'tipo_802';
    }

    let photosFurnished = '[]';
    let photosUnfurnished = '[]';
    let photosPlans = '[]';

    if (typeStr === 'APARTMENT') {
      photosFurnished = JSON.stringify([`plants/details/${assetId}/furnished.jpg`]);
      photosUnfurnished = JSON.stringify([`plants/details/${assetId}/unfurnished.jpg`]);
      photosPlans = JSON.stringify([`plants/details/${assetId}/plans.jpg`]);
    }

    sql += `INSERT INTO units (id, floor_id, identifier, type, bedrooms, bathrooms, area_sqm, coordinates, state, tour_url, photos_furnished, photos_unfurnished, photos_plans, gallery, renders) VALUES ('${unitId}', '${floorId}', '${unit.identifier || unit.id}', '${typeStr}', ${bedrooms}, ${bathrooms}, ${areaSqm}, ${coordsSql}, '${state}', ${tourUrl}, '${photosFurnished}', '${photosUnfurnished}', '${photosPlans}', '[]', '[]');\n`;
  }
}

// 3. Seeding locations_poi
sql += `\n-- Seeding locations_poi\n`;

function getCategoryAndDir(type) {
  const t = (type || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (t === 'finanzas') {
    return { category: 'Finanzas', dir: 'FINANZAS' };
  } else if (t === 'salud y bienestar') {
    return { category: 'Salud y bienestar', dir: 'SALUD_Y_BIENESTAR' };
  } else if (t === 'comercio') {
    return { category: 'Comercio', dir: 'COMERCIO' };
  } else if (t === 'restaurantes') {
    return { category: 'Restaurantes', dir: 'RESTAURANTES' };
  } else if (t === 'areas verdes y recreacion') {
    return { category: 'Áreas verdes y Recreación', dir: 'AREAS_VERDES_Y_RECREACION' };
  } else if (t === 'lifestyle') {
    return { category: 'Lifestyle', dir: 'LIFESTYLE' };
  } else if (t === 'educacion' || t === 'ed') {
    return { category: 'Educación', dir: 'EDUCACION' };
  } else {
    return { category: 'Otros', dir: 'VENECIA' };
  }
}

function getIconPath(dir, iconName) {
  if (!iconName) return null;
  const iconsDir = path.join(baseFreelance, 'public/icons', dir);
  if (!fs.existsSync(iconsDir)) return null;
  const files = fs.readdirSync(iconsDir);
  
  const cleanIcon = iconName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  for (const file of files) {
    const cleanFile = file.toLowerCase().split('.')[0].replace(/[^a-z0-9_-]/g, '');
    if (cleanFile === cleanIcon) {
      return `icons/${dir}/${file}`;
    }
  }
  const noLogoIcon = cleanIcon.replace(/^logo-/, '');
  for (const file of files) {
    const cleanFile = file.toLowerCase().split('.')[0].replace(/[^a-z0-9_-]/g, '');
    const noLogoFile = cleanFile.replace(/^logo-/, '');
    if (noLogoFile === noLogoIcon) {
      return `icons/${dir}/${file}`;
    }
  }
  return files.length > 0 ? `icons/${dir}/${files[0]}` : null;
}

const geojsonPath = path.join(baseFreelance, 'drive-information/drive-download-20260612T210737Z-3-001/8. MAPA/Ubicaciones Venecia.geojson');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

for (const feature of geojsonData.features) {
  const name = feature.properties.name.replace(/'/g, "''");
  const { category, dir } = getCategoryAndDir(feature.properties.type);
  const icon = feature.properties.icon;
  const resolvedPath = getIconPath(dir, icon);
  const imagePathSql = resolvedPath ? `'${resolvedPath}'` : 'NULL';
  const lng = feature.geometry.coordinates[0];
  const lat = feature.geometry.coordinates[1];
  const id = feature.id || crypto.randomUUID().replace(/-/g, '');

  sql += `INSERT INTO locations_poi (id, name, category, image_path, longitude, latitude, is_active) VALUES ('${id}', '${name}', '${category}', ${imagePathSql}, ${lng}, ${lat}, 1);\n`;
}

// 4. Save to seed_remote.sql
const outputPath = path.join(baseFreelance, 'src/lib/db/seed_remote.sql');
fs.writeFileSync(outputPath, sql);
console.log(`seed_remote.sql successfully generated at: ${outputPath}`);
