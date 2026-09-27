/**
 * Fit360 — Native Assets Generator Pre-processor
 * 
 * Genera imágenes de origen de ultra alta resolución a partir del vector brand icon.svg
 * para alimentar @capacitor/assets:
 * - assets/icon-only.png (1024x1024, sin canal alfa para App Store)
 * - assets/icon.png (1024x1024)
 * - assets/logo.png (1024x1024, con canal alfa)
 * - assets/splash.png (2732x2732, fondo Dark Luxury #0a0c14 con logo centrado)
 * - assets/splash-dark.png (2732x2732, fondo Dark Luxury #0a0c14 con logo centrado)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateSourceAssets() {
  const rootDir = path.resolve(__dirname, '..');
  const svgPath = path.join(rootDir, 'icons', 'icon.svg');
  const assetsDir = path.join(rootDir, 'assets');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('🎨 Procesando vectores de Fit360 desde:', svgPath);

  // 1. App Icon principal (1024x1024 sin transparencia alfa para iOS App Store)
  await sharp(svgPath, { density: 300 })
    .resize(1024, 1024)
    .removeAlpha()
    .toFile(path.join(assetsDir, 'icon-only.png'));

  await sharp(svgPath, { density: 300 })
    .resize(1024, 1024)
    .removeAlpha()
    .toFile(path.join(assetsDir, 'icon.png'));

  // 2. Logo con canal alfa para splash y composición
  await sharp(svgPath, { density: 300 })
    .resize(1024, 1024)
    .toFile(path.join(assetsDir, 'logo.png'));

  // 3. Logo centrado para Splash Screen (620x620)
  const splashLogoBuffer = await sharp(svgPath, { density: 300 })
    .resize(620, 620)
    .toBuffer();

  // 4. Splash Screen Universal (2732x2732) - Modo Claro y Oscuro unificados en Dark Luxury
  const darkBgColor = { r: 10, g: 12, b: 20, alpha: 1 }; // #0a0c14

  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: darkBgColor
    }
  })
  .composite([{ input: splashLogoBuffer, gravity: 'center' }])
  .toFile(path.join(assetsDir, 'splash.png'));

  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: darkBgColor
    }
  })
  .composite([{ input: splashLogoBuffer, gravity: 'center' }])
  .toFile(path.join(assetsDir, 'splash-dark.png'));

  console.log('✅ Archivos base generados en /assets listos para @capacitor/assets');
}

generateSourceAssets().catch(err => {
  console.error('❌ Error generando assets de origen:', err);
  process.exit(1);
});
