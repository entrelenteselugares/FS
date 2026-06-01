const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function test() {
  const logoPath = path.resolve(__dirname, 'assets', 'logo-fs.png');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoResized = await sharp(logoBuffer).resize({ width: 500 }).ensureAlpha().toBuffer();
  
  // Create a dummy image
  const dummy = await sharp({
    create: { width: 1000, height: 1000, channels: 3, background: { r: 200, g: 200, b: 200 } }
  }).jpeg().toBuffer();

  const rawPipeline = sharp(dummy).rotate();
  rawPipeline.composite([{ input: logoResized, gravity: 'center', blend: 'over' }]);
  
  const rawImageBuffer = await rawPipeline.jpeg({ quality: 90 }).toBuffer();
  
  fs.writeFileSync('test-output.jpg', rawImageBuffer);
  console.log('Done');
}
test().catch(console.error);
