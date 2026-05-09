const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../client/public/favicon.svg');
const publicDir = path.join(__dirname, '../client/public');

const sizes = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'favicon-192.png' },
  { size: 512, name: 'favicon-512.png' },
];

async function generateFavicons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  
  console.log('All favicons generated successfully!');
}

generateFavicons().catch(console.error);
