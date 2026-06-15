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

const mappings = [
  // Red -> Danger
  { regex: /\b(text|bg|border|ring)-red-[0-9]{3}\b/g, replacement: '$1-brand-danger' },
  // Blue/Indigo/Cyan -> Info
  { regex: /\b(text|bg|border|ring)-(blue|indigo|cyan)-[0-9]{3}\b/g, replacement: '$1-brand-info' },
  // Yellow/Orange/Amber -> Warning
  { regex: /\b(text|bg|border|ring)-(yellow|orange|amber)-[0-9]{3}\b/g, replacement: '$1-brand-warning' },
  // Green/Teal/Emerald -> Tactical (Primary Brand)
  { regex: /\b(text|bg|border|ring)-(green|teal|emerald)-[0-9]{3}\b/g, replacement: '$1-brand-tactical' },
  // Slate/Gray/Zinc -> theme-muted or theme-subtle (but let's be careful not to break standard borders)
  // We'll skip gray mappings because gray is heavily used for structural elements and it's safer.
];

let filesModified = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  mappings.forEach(({ regex, replacement }) => {
    newContent = newContent.replace(regex, replacement);
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
  }
}

walkDir(FRONTEND_DIR, processFile);
console.log(`Refatoração de classes concluída! Arquivos modificados: ${filesModified}`);
