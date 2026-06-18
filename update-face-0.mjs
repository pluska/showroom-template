import sharp from 'sharp';
import { execSync } from 'child_process';
import fs from 'fs';

const input = '/Users/andrespluska/Documents/freelance/venecia-showroom/drive-information/El edificio/cara_central_dia.png';
const output = '/Users/andrespluska/Documents/freelance/venecia-showroom/public/building/photos/face_0_daylight.png';

console.log('Compressing new face_0_daylight (resized to 2560px width)...');
if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

if (fs.existsSync(output)) {
  fs.unlinkSync(output);
}

await sharp(input)
  .resize({ width: 2560 })
  .png({ palette: true, quality: 75, compressionLevel: 9 })
  .toFile(output);

console.log('Compressed size:', fs.statSync(output).size);

console.log('Uploading to R2...');
const uploadCmd = `npx wrangler r2 object put venecia-showroom/building/photos/face_0_daylight.png --file "${output}" --remote`;
execSync(uploadCmd, { stdio: 'inherit' });
console.log('Upload completed successfully!');

// Clean up test file if it exists
if (fs.existsSync('test-comp.png')) {
  fs.unlinkSync('test-comp.png');
}
