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
let totalFixed = 0;
let totalReplacements = 0;

files.forEach(function(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Strategy: find className strings that contain BOTH bg-brand-tactical AND text-theme-text
  // Replace text-theme-text -> text-brand-text within those className strings
  // A className string is bounded by either " or `
  
  // For double-quoted classNames
  content = content.replace(/className="([^"]*)"/g, function(match, inner) {
    if (inner.indexOf('bg-brand-tactical') !== -1 && inner.indexOf('text-theme-text') !== -1) {
      return 'className="' + inner.replace(/text-theme-text/g, 'text-brand-text') + '"';
    }
    return match;
  });

  // For template literal classNames (backtick)
  content = content.replace(/className={`([^`]*)`}/g, function(match, inner) {
    if (inner.indexOf('bg-brand-tactical') !== -1 && inner.indexOf('text-theme-text') !== -1) {
      return 'className={`' + inner.replace(/text-theme-text/g, 'text-brand-text') + '`}';
    }
    return match;
  });

  // Also handle bg-white text-theme-text → bg-white text-gray-800
  content = content.replace(/className="([^"]*)"/g, function(match, inner) {
    if (inner.indexOf('bg-white') !== -1 && inner.indexOf('text-theme-text') !== -1) {
      return 'className="' + inner.replace(/text-theme-text/g, 'text-gray-800') + '"';
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    const rel = path.relative(srcDir, filePath);
    console.log('Fixed: ' + rel);
    totalFixed++;
    totalReplacements++;
  }
});

console.log('\nTotal files fixed: ' + totalFixed);
