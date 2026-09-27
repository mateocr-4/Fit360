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
  // Directories excluded from production build
  const EXCLUDED_DIRS = ['node_modules', 'www', '.git', 'ios', 'docs', '.github', '.agents'];
  // File patterns excluded from production build (secrets, configs)
  const EXCLUDED_FILES = ['.env', '.env.local', '.env.production', '.gitignore'];

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        copyDir(srcPath, destPath);
      }
    } else {
      // Skip sensitive files
      if (EXCLUDED_FILES.includes(entry.name) || entry.name.startsWith('.env')) {
        continue;
      }
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
