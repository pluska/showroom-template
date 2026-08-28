// Sube la versión de assets que usa getAssetUrl() para romper la caché del
// navegador. Se corre DESPUÉS de reemplazar en R2 el contenido de una clave
// que ya existía; si solo se suben claves nuevas, no hace falta.
//
//   npm run assets:bump
//
// Formato: <AAAAMMDD>-<n>. Si ya se subió hoy, incrementa el contador en vez
// de repetir la fecha, para que dos entregas del mismo día no colisionen.
import fs from 'fs';

const FILE = 'src/utils/assets.ts';
const PATTERN = /const DEFAULT_ASSET_VERSION = '(\d{8})-(\d+)';/;

const source = fs.readFileSync(FILE, 'utf8');
const match = source.match(PATTERN);

if (!match) {
  console.error(`No encontré DEFAULT_ASSET_VERSION en ${FILE}.`);
  console.error('Si se renombró la constante, actualiza también este script.');
  process.exit(1);
}

const [, currentDate, currentCounter] = match;
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const next = currentDate === today ? `${today}-${Number(currentCounter) + 1}` : `${today}-1`;

fs.writeFileSync(FILE, source.replace(PATTERN, `const DEFAULT_ASSET_VERSION = '${next}';`));
console.log(`Versión de assets: ${currentDate}-${currentCounter} -> ${next}`);
console.log('Los visitantes volverán a descargar el media en el próximo despliegue.');
