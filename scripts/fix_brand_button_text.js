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
let totalReplacements = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace bg-brand-tactical text-theme-text → bg-brand-tactical text-brand-text
  // (--brand-text is #042F2E in dark, #FFFFFF in light — always contrasts with brand)
  const before = (content.match(/bg-brand-tactical[^"]*?text-theme-text/g) || []).length;
  content = content.replace(/(bg-brand-tactical[^"]{0,200}?)text-theme-text/g, '$1text-brand-text');
  content = content.replace(/text-theme-text([^"]{0,200}?bg-brand-tactical)/g, 'text-brand-text$1');
  const after = (content.match(/bg-brand-tactical[^"]*?text-theme-text/g) || []).length;

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    const rel = path.relative(srcDir, filePath);
    const count = before - after;
    console.log(`Fixed ${count}x: ${rel}`);
    totalFixed++;
    totalReplacements += count;
  }
});

console.log('\nTotal files fixed: ' + totalFixed);
console.log('Total replacements: ' + totalReplacements);
