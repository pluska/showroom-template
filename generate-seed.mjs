import fs from 'fs';
import path from 'path';

// Load from relative path in template
const floorsFilePath = path.join(process.cwd(), 'src/data/floors.ts');
const fileContent = fs.readFileSync(floorsFilePath, 'utf8');

// Extract the floorsData array text
const targetString = 'export const floorsData: Floor[] = ';
const startIndex = fileContent.indexOf(targetString);
if (startIndex === -1) {
  throw new Error("Could not find floorsData array in floors.ts");
}

let floorsDataStr = fileContent.substring(startIndex + targetString.length);
floorsDataStr = floorsDataStr.substring(0, floorsDataStr.lastIndexOf('];') + 1);

// Stub getAssetUrl so eval works cleanly without imports
const getAssetUrl = (url) => url;

const floor1 = "plants/floor_1.png";
const floor2 = "plants/floor_2.png";
const floor3 = "plants/floor_3.png";
const floor4 = "plants/floor_4.png";
const floor5 = "plants/floor_5.png";
const floor6 = "plants/floor_6.png";
const floor7 = "plants/floor_7.png";
const floorDuplex1 = "plants/floor_duplex_1.png";
const floorDuplex2 = "plants/floor_duplex_2.png";
const floorPB = "plants/floor_pb.png";

const floorsData = eval(floorsDataStr);

let sql = 'PRAGMA foreign_keys = OFF;\nDELETE FROM tours;\nDELETE FROM units;\nDELETE FROM floors;\n';

for (const floor of floorsData) {
  const floorId = `floor_${floor.id}`;
  sql += `INSERT INTO floors (id, name, level, type, image_path) VALUES ('${floorId}', '${floor.name}', ${floor.name === 'PB' ? 0 : (parseInt(floor.name.replace(/\D/g, '')) || 0)}, 'Piso', '${floor.floorPlanImage}');\n`;
  
  for (const unit of floor.units) {
    const unitId = `unit_${floor.id}_${unit.id.replace(/\s+/g, '_').toLowerCase()}`;
    const typeStr = unit.type === 'storage' ? 'STORAGE' : 'APARTMENT';
    const bedrooms = unit.bedrooms || 0;
    const bathrooms = unit.bathrooms || 0;
    const areaSqm = unit.dimensions || 0;
    const state = unit.status === 'sold' ? 'SOLD' : (unit.status === 'reserved' ? 'RESERVED' : 'AVAILABLE');
    const tourUrl = unit.tourUrl ? `'${unit.tourUrl}'` : 'NULL';
    
    // Coordinates mapping
    let coordinates = 'NULL';
    if (unit.x !== undefined || unit.y !== undefined || unit.path !== undefined) {
      coordinates = JSON.stringify({ x: unit.x, y: unit.y, path: unit.path });
    }
    const coordsSql = coordinates === 'NULL' ? 'NULL' : `'${coordinates}'`;
    
    sql += `INSERT INTO units (id, floor_id, identifier, type, bedrooms, bathrooms, area_sqm, coordinates, state, tour_url) VALUES ('${unitId}', '${floorId}', '${unit.identifier || unit.id}', '${typeStr}', ${bedrooms}, ${bathrooms}, ${areaSqm}, ${coordsSql}, '${state}', ${tourUrl});\n`;
  }
}
sql += 'PRAGMA foreign_keys = ON;\n';

const outputDir = path.join(process.cwd(), 'src/lib/db');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'seed.sql'), sql);
console.log('src/lib/db/seed.sql generated!');
