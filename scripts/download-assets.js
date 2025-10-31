#!/usr/bin/env node

/**
 * Download assets from Builder.io and save locally
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../public/assets/images');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✅ Created assets directory:', assetsDir);
}

// Unique image URLs from the codebase
const images = [
  {
    id: '152290938133b46f59604e8cf4419542cb66556d',
    filename: 'logo-or-icon.png',
    width: 592
  },
  {
    id: '680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6',
    filename: 'default-avatar.png',
    width: 596
  },
  {
    id: '064bbd9f6db011ffd5c822938c930fa2370a9b77',
    filename: 'login-background.png',
    width: 5170
  },
  {
    id: '0ab06d5c74e85b8f2137cf321b9d07d9b7c27912',
    filename: 'login-illustration.png',
    width: 532
  },
  {
    id: '98ffc2bac3f2b04d98eef7d0401e4531df775981',
    filename: 'hero-image.png',
    width: 1594
  },
  {
    id: '3aba81778dc8d1c8c5675e6bc79feb8019bb3a95',
    filename: 'feature-1.png',
    width: 522
  },
  {
    id: '2e05f22aebfd912d7072b4bd4fde237bf44fd34a',
    filename: 'feature-2.png',
    width: 582
  },
  {
    id: '6b3222f455c7a96aef7ad995d1f455ed6784192a',
    filename: 'feature-3.png',
    width: 680
  }
];

let downloaded = 0;
let failed = 0;

const downloadImage = (imageData) => {
  const url = `https://api.builder.io/api/v1/image/assets/TEMP/${imageData.id}?width=${imageData.width}`;
  const filePath = path.join(assetsDir, imageData.filename);

  console.log(`📥 Downloading: ${imageData.filename} from Builder.io...`);

  https.get(url, (response) => {
    if (response.statusCode === 200) {
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded: ${imageData.filename}`);
        downloaded++;
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        console.error(`❌ Failed to write: ${imageData.filename}`, err.message);
        failed++;
      });
    } else {
      console.error(`❌ Failed to fetch ${imageData.filename}: HTTP ${response.statusCode}`);
      failed++;
    }
  }).on('error', (err) => {
    console.error(`❌ Failed to download ${imageData.filename}:`, err.message);
    failed++;
  });
};

console.log('🚀 Starting asset download from Builder.io...\n');

// Download all images
images.forEach(downloadImage);

// Summary after a delay
setTimeout(() => {
  console.log(`\n📊 Download Summary:`);
  console.log(`   ✅ Downloaded: ${downloaded}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n📝 Next steps:`);
  console.log('   1. Update all Builder.io URLs in your code to use /assets/images/[filename]');
  console.log('   2. Run: npm run build');
  console.log('   3. Test the application\n');
}, 3000);
