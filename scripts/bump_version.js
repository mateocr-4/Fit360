/**
 * Fit360 — Version & Build Number Bumper
 * 
 * Actualiza de forma atómica:
 * 1. Build Number (CURRENT_PROJECT_VERSION en project.pbxproj)
 * 2. Version String (MARKETING_VERSION en project.pbxproj, package.json y js/config.js)
 * 
 * Uso:
 * - node scripts/bump_version.js            -> Incrementa el Build Number (ej. 1 -> 2)
 * - node scripts/bump_version.js 1.1.1      -> Establece versión 1.1.1 e incrementa build
 * - node scripts/bump_version.js 1.1.1 5    -> Establece versión 1.1.1 y build 5
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const configPath = path.join(rootDir, 'js', 'config.js');
const pbxprojPath = path.join(rootDir, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const args = process.argv.slice(2);
const targetVersion = args[0] && !/^\d+$/.test(args[0]) ? args[0] : null;
const explicitBuild = args.find(a => /^\d+$/.test(a)) || null;

// 1. Leer package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version || '1.1.0';
const newVersion = targetVersion || currentVersion;

// 2. Leer y actualizar project.pbxproj
let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

// Extraer CURRENT_PROJECT_VERSION actual
const buildMatch = pbxproj.match(/CURRENT_PROJECT_VERSION = (\d+);/);
const currentBuild = buildMatch ? parseInt(buildMatch[1], 10) : 1;
const newBuild = explicitBuild ? parseInt(explicitBuild, 10) : currentBuild + 1;

console.log(`📦 Fit360 Release Versioning:`);
console.log(`   Versión Comercial: ${currentVersion} -> ${newVersion}`);
console.log(`   Número de Build:   ${currentBuild} -> ${newBuild}`);

// Reemplazar en project.pbxproj
pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${newBuild};`);
pbxproj = pbxproj.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${newVersion};`);
fs.writeFileSync(pbxprojPath, pbxproj, 'utf8');
console.log('✅ project.pbxproj actualizado.');

// 3. Actualizar package.json
if (targetVersion) {
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log('✅ package.json actualizado.');
}

// 4. Actualizar js/config.js si cambió la versión
if (fs.existsSync(configPath) && targetVersion) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  configContent = configContent.replace(/version:\s*['"][^'"]+['"]/, `version: '${newVersion}'`);
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ js/config.js actualizado.');
}

console.log(`🎉 Listo para TestFlight: Versión ${newVersion} (Build ${newBuild})`);
