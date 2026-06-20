const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../dist');
const destDir = path.join(__dirname, '../webview-dist');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = stats && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log(`Copying built assets from ${srcDir} to ${destDir}...`);
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory ${srcDir} does not exist. Make sure to run 'npx vite build' in the root project first.`);
    process.exit(1);
  }

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  copyRecursiveSync(srcDir, destDir);
  console.log('Built assets copied successfully.');
} catch (err) {
  console.error('Failed to copy built assets:', err);
  process.exit(1);
}
