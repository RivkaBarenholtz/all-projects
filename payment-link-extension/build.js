const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { build } = require('vite');

console.log('Building Chrome Extension...\n');

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Skipping ${src} (doesn't exist)`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${entry.name}`);
    }
  }
}

// Step 1: Clean dist
console.log('Cleaning dist folder...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });
console.log('Cleaned\n');

// Step 2: Build with Vite (both scripts separately)
async function buildViteScripts() {
  console.log('Building content script...');
  await build({
    configFile: 'vite.content.config.js'
  });
  console.log('Content script built\n');

  console.log('Building payment script...');
  await build({
    configFile: 'vite.payment.config.js'
  });
  console.log(' Payment script built\n');
}

// Run the build
(async () => {
  try {
    await buildViteScripts();

    // Step 3: Compile background script
    console.log('Compiling background script...');
    try {
      execSync('npx tsc src/background.ts --outDir dist --target es2020 --module es2020 --moduleResolution node --skipLibCheck', { stdio: 'inherit' });
      console.log('Compiled\n');
    } catch (error) {
      console.error('TypeScript compilation failed');
      //process.exit(1);
    }

    // Step 4: Copy manifest
    console.log('Copying manifest.json...');
    fs.copyFileSync('public/manifest.json', 'dist/manifest.json');
    console.log('Copied\n');

     // Step 4: Copy manifest
    console.log('Copying ifiels.min.js...');
    fs.copyFileSync('src/ifields.min.js', 'dist/ifields.min.js');
    console.log('Copied\n');


    // Step 5: Copy images
    console.log('Copying images...');
    if (fs.existsSync('images')) {
      copyDirectory('images', 'dist/images');
      console.log();
    } else {
      console.log(' No images folder found\n');
    }

    // Step 6: Copy fonts
    console.log('Copying fonts...');
    if (fs.existsSync('fonts')) {
      copyDirectory('fonts', 'dist/fonts');
      console.log();
    } else {
      console.log(' No fonts folder found\n');
    }

    // Step 7: Copy webfonts
    console.log('Copying webfonts...');
    if (fs.existsSync('webfonts')) {
      copyDirectory('webfonts', 'dist/webfonts');
      console.log();
    } else {
      console.log('No webfonts folder found\n');
    }
    
    // Step 8: Copy styles folder
    console.log('Copying Styles...');
    if (fs.existsSync('styles')) {
      copyDirectory('styles', 'dist/styles');
      console.log();
    } else {
      console.log('No styles folder found\n');
    }

    // Step 9: Copy styles to styles subfolder
    console.log('Copying styles...');
    if (fs.existsSync('dist/styles.css')) {
      if (!fs.existsSync('dist/styles')) {
        fs.mkdirSync('dist/styles');
      }
      fs.copyFileSync('dist/styles.css', 'dist/styles/styles.css');
      console.log('  ✓ Copied to styles/styles.css\n');
    }

      console.log('Copying popup folder...');
    if (fs.existsSync('popup')) {
      copyDirectory('popup', 'dist/popup');
      console.log();
    } else {
      console.log('No popup folder found\n');
    }

    // Step 10: Verify build
    console.log('Verifying build...');
    const requiredFiles = [
      'dist/content.js',
      'dist/background.js',
      'dist/manifest.json',
      'dist/styles.css', 
      'dist/payment.js',
    ];

    let allPresent = true;
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`${file}`);
      } else {
        console.log(` ${file} MISSING`);
        allPresent = false;
      }
    }

    console.log('\n Contents of dist/:');
    const distContents = fs.readdirSync('dist');
    distContents.forEach(item => {
      const itemPath = path.join('dist', item);
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        console.log(`  ${item}/`);
        const subItems = fs.readdirSync(itemPath);
        subItems.forEach(subItem => {
          console.log(`    - ${subItem}`);
        });
      } else {
        const sizeMB = (stats.size / 1024).toFixed(2);
        console.log(`  📄 ${item} (${sizeMB} KB)`);
      }
    });

    console.log('\n Build complete!\n');

    if (allPresent) {
      console.log(' Ready to load in Chrome:');
      console.log('   1. Open chrome://extensions/');
      console.log('   2. Enable Developer mode');
      console.log('   3. Remove old extension');
      console.log('   4. Click "Load unpacked"');
      console.log('   5. Select the dist/ folder');
    } else {
      console.log(' Some required files are missing - check build output above');
    }
  } catch (error) {
    console.error(' Build failed:', error);
    process.exit(1);
  }
})();