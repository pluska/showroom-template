import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';
import crypto from 'crypto';

const bucketName = 'venecia-showroom';
const baseFreelance = '/Users/andrespluska/Documents/freelance/venecia-showroom';
const srcDir = path.join(baseFreelance, 'drive-information/amenidades');
const destDir = path.join(baseFreelance, 'drive-information/amenidades-processed');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.png'));

console.log(`Found ${files.length} files to process.`);

const dbInserts = [];

for (const file of files) {
  const inputPath = path.join(srcDir, file);
  const baseName = path.basename(file, '.png');
  const outFileName = `${baseName}.jpg`;
  const outputPath = path.join(destDir, outFileName);

  console.log(`Compressing ${file} to ${outFileName}...`);
  await sharp(inputPath)
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  const r2Key = `media/amenities/${outFileName}`;
  console.log(`Uploading ${r2Key} to R2...`);
  
  const uploadCmd = `npx wrangler r2 object put ${bucketName}/${r2Key} --file "${outputPath}" --remote`;
  execSync(uploadCmd, { stdio: 'inherit' });
  console.log(`Uploaded ${r2Key}`);

  // Generate DB insertion
  const id = crypto.randomUUID();
  const title = `Amenidad ${baseName}`;
  const url = r2Key;
  const type = 'image/jpeg';
  const category = 'amenities';
  const isActive = 1;

  dbInserts.push(`INSERT INTO media (id, title, url, type, category, is_active) VALUES ('${id}', '${title}', '${url}', '${type}', '${category}', ${isActive});`);
}

// Write the SQL to a temp file
const sqlFile = path.join(baseFreelance, 'src/lib/db/seed_amenities.sql');
// Add DELETE FROM media WHERE category = 'amenities' to make it idempotent
const sqlContent = `DELETE FROM media WHERE category = 'amenities';\n` + dbInserts.join('\n') + '\n';
fs.writeFileSync(sqlFile, sqlContent);
console.log(`SQL generated at: ${sqlFile}`);

console.log("Executing SQL on remote database...");
const dbCmd = `npx wrangler d1 execute venecia-showroom-db --remote --file="${sqlFile}"`;
execSync(dbCmd, { stdio: 'inherit' });
console.log("Database update completed!");
