const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function deploy() {
  const distPath = path.join(__dirname, 'client', 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('Building client first...');
    execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
  }

  const tempDir = path.join(os.tmpdir(), 'gh-pages-deploy-' + Date.now());
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  console.log('Copying files from', distPath, 'to', tempDir);
  fs.cpSync(distPath, tempDir, { recursive: true });

  console.log('Initializing git repository in temp folder...');
  execSync('git init -b gh-pages', { cwd: tempDir, stdio: 'inherit' });
  execSync('git config user.name "VenuJinakala"', { cwd: tempDir, stdio: 'inherit' });
  execSync('git config user.email "venujinakala25@gmail.com"', { cwd: tempDir, stdio: 'inherit' });
  execSync('git add .', { cwd: tempDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { cwd: tempDir, stdio: 'inherit' });
  execSync('git remote add origin https://github.com/VenuJinakala/Student_Registration_Portal.git', { cwd: tempDir, stdio: 'inherit' });
  
  console.log('Pushing to origin gh-pages...');
  execSync('git push -f origin gh-pages', { cwd: tempDir, stdio: 'inherit' });

  console.log('Cleaning up temporary directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('SUCCESS! gh-pages branch deployed successfully.');
}

deploy();
