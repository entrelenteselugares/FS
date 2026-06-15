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

// Map of bg color -> what text color to use (all these backgrounds are vibrant/dark enough to need white text)
// bg-brand-danger = red (#F87171 light, darker in dark) => text-white
// bg-brand-warning = amber (#FBBF24) => text-zinc-900 (dark text on yellow)
// bg-brand-info = blue (#60A5FA / #3B82F6) => text-white

files.forEach(function(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix className strings containing bg-brand-danger or bg-brand-info: replace text-theme-text with text-white
  content = content.replace(/className="([^"]*)"/g, function(match, inner) {
    if ((inner.indexOf('bg-brand-danger') !== -1 || inner.indexOf('bg-brand-info') !== -1) 
        && inner.indexOf('text-theme-text') !== -1) {
      return 'className="' + inner.replace(/text-theme-text/g, 'text-white') + '"';
    }
    return match;
  });

  // Fix className strings containing bg-brand-warning: replace text-theme-text with text-zinc-900
  content = content.replace(/className="([^"]*)"/g, function(match, inner) {
    if (inner.indexOf('bg-brand-warning') !== -1 && inner.indexOf('text-theme-text') !== -1) {
      return 'className="' + inner.replace(/text-theme-text/g, 'text-zinc-900') + '"';
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    const rel = path.relative(srcDir, filePath);
    console.log('Fixed: ' + rel);
    totalFixed++;
  }
});

console.log('\nTotal files fixed: ' + totalFixed);
