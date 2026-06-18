import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const bucketName = 'venecia-showroom';
const baseFreelance = '/Users/andrespluska/Documents/freelance/venecia-showroom';
const driveBase = path.join(baseFreelance, 'drive-information');
const processedDuplexBase = path.join(driveBase, 'duplex-processed');

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

// 1. Identity Logo
uploadQueue.push({
  localPath: path.join(baseFreelance, 'public/identity/logo_venecia_transparent.png'),
  r2Key: 'identity/logo_venecia_transparent.png'
});

// 2. Principal
const principalDir = findDir(driveBase, 'principal');
uploadQueue.push({
  localPath: findFile(principalDir, 'PRE CARGA.jpg'),
  r2Key: 'identity/portada_venecia.png'
});
uploadQueue.push({
  localPath: findFile(principalDir, 'VIDEO PORTADA.mp4'),
  r2Key: 'videos/walk.mp4'
});

// 3. Building photos & videos
const buildingDir = findDir(driveBase, 'El edificio');
uploadQueue.push({
  localPath: findFile(buildingDir, 'CÁMARA ESTÁTICA VIDEO EDIFICIO VENECIA DÍA VF.mp4'),
  r2Key: 'building/videos/face_0_daylight.mp4'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'CÁMARA ESTÁTICA VIDEO EDIFICIO VENECIA NOCHE VF.mp4'),
  r2Key: 'building/videos/face_0_nightlight.mp4'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'cara_central_dia.png'),
  r2Key: 'building/photos/face_0_daylight.png'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'cara_central_noche.png'),
  r2Key: 'building/photos/face_0_nightlight.png'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'cara_derecha_dia.png'),
  r2Key: 'building/photos/face_1_daylight.png'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'cara_derecha_noche.png'),
  r2Key: 'building/photos/face_1_nightlight.png'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'cara_izquierda_dia.png'),
  r2Key: 'building/photos/face_2_daylight.png'
});
uploadQueue.push({
  localPath: findFile(buildingDir, 'cara_izquierda_noche.png'),
  r2Key: 'building/photos/face_2_nightlight.png'
});

// 4. Building transitions
const transitionsDir = findDir(buildingDir, 'transiciones-el edificio');
const transitionMapping = {
  'MEDIO (DÍA-NOCHE) - VENECIA.mp4': 'building/transitions/trans_0_day_to_night.mp4',
  'MEDIO (NOCHE-DÍA) - VENECIA.mp4': 'building/transitions/trans_0_night_to_day.mp4',
  'MEDIO - DERECHA (DÍA) - VENECIA.mp4': 'building/transitions/trans_0_to_1_daylight.mp4',
  'MEDIO - DERECHA (NOCHE) - VENECIA.mp4': 'building/transitions/trans_0_to_1_nightlight.mp4',
  'MEDIO - IZQUIERDA (DÍA) - VENECIA.mp4': 'building/transitions/trans_0_to_2_daylight.mp4',
  'MEDIO - IZQUIERDA (NOCHE) - VENECIA.mp4': 'building/transitions/trans_0_to_2_nightlight.mp4',
  'DERECHA (DÍA-NOCHE) - VENECIA.mp4': 'building/transitions/trans_1_day_to_night.mp4',
  'DERECHA (NOCHE-DÍA) - VENECIA.mp4': 'building/transitions/trans_1_night_to_day.mp4',
  'DERECHA - MEDIO (DÍA) - VENECIA.mp4': 'building/transitions/trans_1_to_0_daylight.mp4',
  'DERECHA - MEDIO (NOCHE) - VENECIA.mp4': 'building/transitions/trans_1_to_0_nightlight.mp4',
  'IZQUIERDA (DÍA-NOCHE) - VENECIA.mp4': 'building/transitions/trans_2_day_to_night.mp4',
  'IZQUIERDA (NOCHE - DÍA) - VENECIA.mp4': 'building/transitions/trans_2_night_to_day.mp4',
  'IZQUIERDA - MEDIO (DÍA) - VENECIA.mp4': 'building/transitions/trans_2_to_0_daylight.mp4',
  'IZQUIERDA - MEDIO (NOCHE) - VENECIA.mp4': 'building/transitions/trans_2_to_0_nightlight.mp4',
  'GRAN GENERAL - MEDIO (DÍA) - VENECIA.mp4': 'videos/walks/trans_intro_to_0.mp4'
};

for (const [srcName, destPath] of Object.entries(transitionMapping)) {
  uploadQueue.push({
    localPath: findFile(transitionsDir, srcName),
    r2Key: destPath
  });
}

// 5. Units assets
const driveDownloadDir = findDir(driveBase, 'drive-download-20260612T210737Z-3-001');
const tipologiasDir = findDir(driveDownloadDir, '4. TIPOLOGÍAS COMPLETO');

const unitFolders = [
  { dirName: '1. DEP 201 - 301 - 401 - 501 - 701', targetId: 'tipo_201', fileId: '201', processed: false },
  { dirName: '2. DEPARTAMENTO 202', targetId: 'tipo_202', fileId: '202', processed: false },
  { dirName: '3. DEP 302-402-502-602-702', targetId: 'tipo_302', fileId: '302', processed: false },
  { dirName: 'tipo_801', targetId: 'tipo_801', fileId: '801', processed: true, originalDirName: '4. DÚPLEX 801', levelSubdir: '801.1' },
  { dirName: 'tipo_802', targetId: 'tipo_802', fileId: '802', processed: true, originalDirName: '5. DÚPLEX 802', levelSubdir: '802.1' }
];

const animationMapping = {
  'CAD A CON.mp4': 'plans_to_furnished.mp4',
  'CAD A SIN.mp4': 'plans_to_unfurnished.mp4',
  'CON A CAD.mp4': 'furnished_to_plans.mp4',
  'CON A SIN.mp4': 'furnished_to_unfurnished.mp4',
  'SIN A CAD.mp4': 'unfurnished_to_plans.mp4',
  'SIN A CON.mp4': 'unfurnished_to_furnished.mp4'
};

for (const folder of unitFolders) {
  const targetPrefix = `plants/details/${folder.targetId}`;
  
  if (folder.processed) {
    const duplexProcessedDir = findDir(processedDuplexBase, folder.dirName);
    uploadQueue.push({
      localPath: findFile(duplexProcessedDir, 'furnished.jpg'),
      r2Key: `${targetPrefix}/furnished.jpg`
    });
    uploadQueue.push({
      localPath: findFile(duplexProcessedDir, 'unfurnished.jpg'),
      r2Key: `${targetPrefix}/unfurnished.jpg`
    });
    uploadQueue.push({
      localPath: findFile(duplexProcessedDir, 'plans.jpg'),
      r2Key: `${targetPrefix}/plans.jpg`
    });
    
    const origDuplexDir = findDir(tipologiasDir, folder.originalDirName);
    const animationsDir = findDir(origDuplexDir, 'ANIMACIONES');
    const levelDir = findDir(animationsDir, folder.levelSubdir);
    for (const [srcAnim, destAnim] of Object.entries(animationMapping)) {
      uploadQueue.push({
        localPath: findFile(levelDir, srcAnim),
        r2Key: `${targetPrefix}/transitions/${destAnim}`
      });
    }
  } else {
    const unitDir = findDir(tipologiasDir, folder.dirName);
    uploadQueue.push({
      localPath: findFile(unitDir, `AMOB.${folder.fileId}.jpg`),
      r2Key: `${targetPrefix}/furnished.jpg`
    });
    uploadQueue.push({
      localPath: findFile(unitDir, `SIN.${folder.fileId}.jpg`),
      r2Key: `${targetPrefix}/unfurnished.jpg`
    });
    uploadQueue.push({
      localPath: findFile(unitDir, `CAD.${folder.fileId}.jpg`),
      r2Key: `${targetPrefix}/plans.jpg`
    });
    
    const animationsDir = findDir(unitDir, 'ANIMACIONES');
    for (const [srcAnim, destAnim] of Object.entries(animationMapping)) {
      uploadQueue.push({
        localPath: findFile(animationsDir, srcAnim),
        r2Key: `${targetPrefix}/transitions/${destAnim}`
      });
    }
  }
}

console.log(`Starting sequential upload of ${uploadQueue.length} files to Cloudflare R2 bucket "${bucketName}"...`);

for (let i = 0; i < uploadQueue.length; i++) {
  const item = uploadQueue[i];
  console.log(`[${i + 1}/${uploadQueue.length}] Uploading ${item.r2Key}...`);
  if (!fs.existsSync(item.localPath)) {
    throw new Error(`File not found: ${item.localPath}`);
  }
  // Execute sequential command with wrangler
  const cmd = `npx wrangler r2 object put ${bucketName}/${item.r2Key} --file "${item.localPath}" --remote`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[OK] Mapped ${item.r2Key}`);
  } catch (error) {
    console.error(`[ERROR] Failed uploading ${item.r2Key}:`, error);
    process.exit(1);
  }
}

console.log("All R2 uploads completed successfully!");
