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

const srcDir = path.join('c:', 'foto-segundo', 'frontend', 'src');
const files = getAllTsxFiles(srcDir);
const issues = [];

files.forEach(function(f) {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(srcDir, f);

  // Check for remaining bg-brand-tactical + text-theme-text
  const m1 = content.match(/bg-brand-tactical[\s\S]{0,150}?text-theme-text/g);
  if (m1) {
    issues.push({ file: rel, issue: 'bg-brand-tactical+text-theme-text', count: m1.length });
  }

  // Check bg-white + text-theme-text
  const m2 = content.match(/bg-white text-theme-text/g);
  if (m2) {
    issues.push({ file: rel, issue: 'bg-white+text-theme-text', count: m2.length });
  }
});

console.log('Remaining issues:');
issues.forEach(function(i) {
  console.log('  [' + i.count + 'x] ' + i.issue + ' | ' + i.file);
});
console.log('Total issue groups: ' + issues.length);
