const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove 'italic' from className strings
      let updatedContent = content.replace(/(className="[^"]*)\bitalic\b([^"]*")/g, (match, p1, p2) => {
        return (p1 + p2).replace(/\s{2,}/g, ' '); // Clean up extra spaces
      });

      // Replace font-black with font-bold
      updatedContent = updatedContent.replace(/(className="[^"]*)\bfont-black\b([^"]*")/g, (match, p1, p2) => {
        return (p1 + 'font-bold' + p2).replace(/\s{2,}/g, ' ');
      });

      // Replace font-light with font-normal
      updatedContent = updatedContent.replace(/(className="[^"]*)\bfont-light\b([^"]*")/g, (match, p1, p2) => {
        return (p1 + 'font-normal' + p2).replace(/\s{2,}/g, ' ');
      });

      // Replace tracking-tighter and tracking-tight with normal tracking (remove them)
      updatedContent = updatedContent.replace(/(className="[^"]*)\btracking-tight(er)?\b([^"]*")/g, (match, p1, p2, p3) => {
        return (p1 + p3).replace(/\s{2,}/g, ' ');
      });

      // Replace excessive tracking-[...] like tracking-[0.3em] with normal tracking (remove them)
      updatedContent = updatedContent.replace(/(className="[^"]*)\btracking-\[[^\]]+\]\b([^"]*")/g, (match, p1, p2) => {
        return (p1 + p2).replace(/\s{2,}/g, ' ');
      });

      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'frontend/src'));
console.log('Cleanup completed.');
