const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // 1. Run Vite build
  console.log('Building DrakoFlow editor application...');
  execSync('npx vite build', { stdio: 'inherit' });

  // 2. Prepare docs directory
  const docsDir = path.join(__dirname, '../docs');
  const drakoDir = path.join(docsDir, 'drako');

  console.log('Preparing target directories...');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Clear old drako files if they exist
  if (fs.existsSync(drakoDir)) {
    console.log('Cleaning old application assets...');
    fs.rmSync(drakoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(drakoDir, { recursive: true });

  // 3. Copy dist/ contents to docs/drako/
  const distDir = path.join(__dirname, '../dist');

  function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);

      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }

  console.log('Copying application assets to docs/drako/ directory...');
  copyFolderRecursiveSync(distDir, drakoDir);

  // 4. Inject tracking script into docs/drako/index.html (GitHub Pages version)
  const targetIndexHtml = path.join(drakoDir, 'index.html');
  if (fs.existsSync(targetIndexHtml)) {
    console.log('Injecting tracking script into docs/drako/index.html...');
    let htmlContent = fs.readFileSync(targetIndexHtml, 'utf8');
    const trackingScript = `
  <!-- 100% privacy-first analytics -->
  <script async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
  <noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt=""
      referrerpolicy="no-referrer-when-downgrade" /></noscript>
`;
    htmlContent = htmlContent.replace('</body>', `${trackingScript}</body>`);
    fs.writeFileSync(targetIndexHtml, htmlContent, 'utf8');
  }

  console.log('GitHub Pages build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
