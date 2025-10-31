#!/usr/bin/env node

/**
 * Create placeholder SVG images for local assets
 * This generates simple placeholder images that can be used instead of external Builder.io URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../public/assets/images');

// Create assets directory
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✅ Created assets directory:', assetsDir);
}

const placeholders = [
  {
    filename: 'logo-or-icon.png',
    width: 592,
    height: 592,
    text: 'Logo'
  },
  {
    filename: 'default-avatar.png',
    width: 596,
    height: 596,
    text: 'Avatar'
  },
  {
    filename: 'login-background.png',
    width: 1920,
    height: 1080,
    text: 'Background'
  },
  {
    filename: 'login-illustration.png',
    width: 532,
    height: 532,
    text: 'Illustration'
  },
  {
    filename: 'hero-image.png',
    width: 1594,
    height: 600,
    text: 'Hero'
  },
  {
    filename: 'feature-1.png',
    width: 522,
    height: 400,
    text: 'Feature 1'
  },
  {
    filename: 'feature-2.png',
    width: 582,
    height: 400,
    text: 'Feature 2'
  },
  {
    filename: 'feature-3.png',
    width: 680,
    height: 400,
    text: 'Feature 3'
  }
];

const createSVGPlaceholder = (width, height, text) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8BC34A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7CB342;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Plus Jakarta Sans, Arial" font-size="${Math.max(24, width / 10)}" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
</svg>`;
};

let created = 0;

placeholders.forEach(img => {
  const filePath = path.join(assetsDir, img.filename);
  const svg = createSVGPlaceholder(img.width, img.height, img.text);

  try {
    fs.writeFileSync(filePath, svg, 'utf8');
    console.log(`✅ Created: ${img.filename} (${img.width}x${img.height})`);
    created++;
  } catch (err) {
    console.error(`❌ Failed to create ${img.filename}:`, err.message);
  }
});

console.log(`\n✨ Created ${created}/${placeholders.length} placeholder images\n`);

console.log('📝 Update these URLs in your code:');
console.log('   OLD: https://api.builder.io/api/v1/image/assets/TEMP/...');
console.log('   NEW: /assets/images/[filename]\n');

console.log('🔄 Files to update:');
console.log('   - src/app/page.js');
console.log('   - src/app/login/page.js');
console.log('   - src/app/profile/page.js');
console.log('   - src/app/dashboard/page.js');
console.log('   - src/app/schedule/[scheduleId]/page.js\n');
