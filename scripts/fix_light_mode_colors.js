const fs = require('fs');
const path = require('path');

function getAllTsxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = path.join(__dirname, '..', 'frontend', 'src');
const files = getAllTsxFiles(srcDir);
let totalFixed = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: bg-white text-theme-text → bg-white text-gray-800 (white bg always needs dark text)
  content = content.replace(/bg-white text-theme-text/g, 'bg-white text-gray-800');

  // Fix: hover:bg-white transition-all → hover:bg-brand-hover transition-all (white hover + dynamic text = invisible)
  // But be careful - only on elements that already have bg-brand-tactical (primary buttons)
  content = content.replace(/(bg-brand-tactical[^"]*?)hover:bg-white transition-all/g, '$1hover:bg-brand-hover transition-all');
  content = content.replace(/hover:bg-white transition-all([^"]*?bg-brand-tactical)/g, 'hover:bg-brand-hover transition-all$1');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    const rel = path.relative(srcDir, filePath);
    console.log('Fixed: ' + rel);
    totalFixed++;
  }
});

console.log('\nTotal files fixed: ' + totalFixed);
