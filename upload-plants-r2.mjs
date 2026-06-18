import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const bucketName = 'venecia-showroom';
const baseFreelance = '/Users/andrespluska/Documents/freelance/venecia-showroom';
const driveBase = path.join(baseFreelance, 'drive-information');
const plantsDir = path.join(driveBase, '3. PLANTAS EL EDIFICIO');

// Helper to find a file in a directory regardless of unicode normalization of the query
function findFile(dir, targetName) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }
  const files = fs.readdirSync(dir);
  const normalizedTarget = targetName.normalize('NFD').toLowerCase();
  for (const file of files) {
    if (file.normalize('NFD').toLowerCase() === normalizedTarget) {
      return path.join(dir, file);
    }
  }
  for (const file of files) {
    if (file.normalize('NFC').toLowerCase() === targetName.normalize('NFC').toLowerCase()) {
      return path.join(dir, file);
    }
  }
  throw new Error(`File "${targetName}" not found in directory "${dir}"`);
}

// Helper to find a directory in a parent directory
function findDir(parentDir, targetName) {
  if (!fs.existsSync(parentDir)) {
    throw new Error(`Parent directory does not exist: ${parentDir}`);
  }
  const items = fs.readdirSync(parentDir, { withFileTypes: true });
  const normalizedTarget = targetName.normalize('NFD').toLowerCase();
  for (const item of items) {
    if (item.isDirectory() && item.name.normalize('NFD').toLowerCase() === normalizedTarget) {
      return path.join(parentDir, item.name);
    }
  }
  for (const item of items) {
    if (item.isDirectory() && item.name.normalize('NFC').toLowerCase() === targetName.normalize('NFC').toLowerCase()) {
      return path.join(parentDir, item.name);
    }
  }
  throw new Error(`Directory "${targetName}" not found in "${parentDir}"`);
}

const uploadQueue = [];

// Floor plans
for (let i = 1; i <= 9; i++) {
  const fileName = `PISO ${i} - DIFUMINADO.jpg`;
  uploadQueue.push({
    localPath: findFile(plantsDir, fileName),
    r2Key: `plants/floor_${i}.jpg`
  });
}

// Animations
const animationsDir = findDir(plantsDir, 'ANIMACIONES');
const animationMapping = {
  'CENTRAL (DÍA) - PLANTA 9.mp4': 'videos/walks/walk_center_daylight.mp4',
  'CENTRAL (NOCHE) - PLANTA 9.mp4': 'videos/walks/walk_center_nightlight.mp4',
  'DERECHA (DÍA) - PLANTA 9.mp4': 'videos/walks/walk_right_daylight.mp4',
  'DERECHA (NOCHE) - PLANTA 9.mp4': 'videos/walks/walk_right_nightlight.mp4',
  'IZQUIERDA (DÍA) - PLANTA 9.mp4': 'videos/walks/walk_left_daylight.mp4',
  'IZQUIERDA (NOCHE) - PLANTA 9.mp4': 'videos/walks/walk_left_nightlight.mp4'
};

for (const [srcName, destPath] of Object.entries(animationMapping)) {
  uploadQueue.push({
    localPath: findFile(animationsDir, srcName),
    r2Key: destPath
  });
}

console.log(`Starting sequential upload of ${uploadQueue.length} files to Cloudflare R2 bucket "${bucketName}"...`);

for (let i = 0; i < uploadQueue.length; i++) {
  const item = uploadQueue[i];
  console.log(`[${i + 1}/${uploadQueue.length}] Uploading ${item.r2Key}...`);
  if (!fs.existsSync(item.localPath)) {
    throw new Error(`File not found: ${item.localPath}`);
  }
  const cmd = `npx wrangler r2 object put ${bucketName}/${item.r2Key} --file "${item.localPath}" --remote`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[OK] Mapped ${item.r2Key}`);
  } catch (error) {
    console.error(`[ERROR] Failed uploading ${item.r2Key}:`, error);
    process.exit(1);
  }
}

console.log("All plants R2 uploads completed successfully!");
