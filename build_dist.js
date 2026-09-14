const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const outDir = path.join(__dirname, 'www');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'www' && entry.name !== '.git' && entry.name !== 'ios') {
        copyDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy top files
const topFiles = ['index.html', 'manifest.json', 'sw.js'];
for (const file of topFiles) {
  const p = path.join(srcDir, file);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(outDir, file));
  }
}

// Copy directories
copyDir(path.join(srcDir, 'css'), path.join(outDir, 'css'));
copyDir(path.join(srcDir, 'js'), path.join(outDir, 'js'));
copyDir(path.join(srcDir, 'icons'), path.join(outDir, 'icons'));

console.log('✅ Archivos web copiados con éxito a /www para Capacitor iOS.');
