const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

let filesModified = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Check if line has opacity-0
    if (line.includes('opacity-0') && !line.includes('pointer-events-none')) {
      // Very naive injection: just replace opacity-0 with opacity-0 pointer-events-none
      // This is safe for standard class strings
      lines[i] = line.replace(/\bopacity-0\b/g, 'opacity-0 pointer-events-none');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    filesModified++;
  }
}

walkDir(FRONTEND_DIR, processFile);
console.log(`Correção de ghost buttons concluída! Arquivos modificados: ${filesModified}`);
