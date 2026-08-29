const fs = require('fs');
const path = require('path');

const iconsDir = path.resolve(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy source icon
const srcIcon = path.resolve(__dirname, '../../vscode-extension/icon.png');
if (fs.existsSync(srcIcon)) {
  fs.copyFileSync(srcIcon, path.join(iconsDir, 'icon-128.png'));
  fs.copyFileSync(srcIcon, path.join(iconsDir, 'icon-48.png'));
  fs.copyFileSync(srcIcon, path.join(iconsDir, 'icon-16.png'));
  fs.copyFileSync(srcIcon, path.resolve(__dirname, '../icon.png'));
  console.log('Icons copied successfully to chrome-extension/icons');
} else {
  console.warn('Source icon not found at', srcIcon);
}
