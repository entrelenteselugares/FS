const fs = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) r = r.concat(walk(p));
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) r.push(p);
  });
  return r;
}

const files = walk('frontend/src');

const grays = ['gray', 'slate', 'zinc', 'stone', 'neutral'];
const brands = ['teal', 'emerald', 'green'];

let replacedText = 0;
let replacedFont = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Replace font classes
  content = content.replace(/\bfont-(sans|serif|mono)\b/g, () => {
    replacedFont++;
    return ''; // just remove them
  });

  // Replace gray text classes
  grays.forEach(g => {
    content = content.replace(new RegExp(`\\btext-${g}-([1-9]00|50)\\b`, 'g'), (match, weight) => {
      replacedText++;
      let w = parseInt(weight, 10);
      if (w >= 700) return 'text-theme-text';
      if (w >= 400) return 'text-theme-muted';
      return 'text-theme-subtle';
    });
  });

  // Replace brand text classes
  brands.forEach(b => {
    content = content.replace(new RegExp(`\\btext-${b}-([1-9]00|50)\\b`, 'g'), (match, weight) => {
      let w = parseInt(weight, 10);
      if (w >= 500) {
        replacedText++;
        return 'text-theme-brand';
      }
      return match;
    });
  });

  // Safe cleanup of double spaces inside className only (approximate)
  content = content.replace(/className=(["'`])(.*?)(\1)/g, (match, p1, p2, p3) => {
    let cleaned = p2.replace(/\s{2,}/g, ' ').trim();
    return `className=${p1}${cleaned}${p3}`;
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
  }
});

console.log(`Refactor complete! Replaced ${replacedText} text classes and ${replacedFont} font classes.`);
