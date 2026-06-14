const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

// Function to walk the directory
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Standardize Tailwind Text Colors
  // Replace grey/slate/zinc/neutral colors with standard theme colors
  
  // Very light/dark -> Primary Text
  content = content.replace(/\btext-(gray|slate|zinc|neutral)-(50|100|200|800|900)\b/g, 'text-theme-text');
  content = content.replace(/\btext-white\b/g, 'text-theme-text');
  content = content.replace(/\btext-black\b/g, 'text-theme-text');
  
  // Medium -> Muted Text
  content = content.replace(/\btext-(gray|slate|zinc|neutral)-(300|400|500)\b/g, 'text-theme-muted');
  
  // Medium-Dark -> Subtle Text
  content = content.replace(/\btext-(gray|slate|zinc|neutral)-(600|700)\b/g, 'text-theme-subtle');
  
  // Brand colors -> Brand Text
  content = content.replace(/\btext-(emerald|teal|green)-(400|500|600)\b/g, 'text-theme-brand');
  
  // 2. Standardize Fonts
  // Replace hardcoded fontFamilies with T.fontD or T.fontB
  content = content.replace(/fontFamily:\s*["']sans-serif["']/g, 'fontFamily: T.fontB');
  content = content.replace(/fontFamily:\s*["']Inter["']/g, 'fontFamily: T.fontB');
  content = content.replace(/fontFamily:\s*["']Barlow Condensed["']/g, 'fontFamily: T.fontD');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
});

console.log(`Standardized colors and fonts in ${changedFiles} files.`);
