const fs = require('fs');
const path = require('path');
const dir = 'c:/foto-segundo/frontend/src/pages/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
let changed = 0;
files.forEach(f => {
  const file = path.join(dir, f);
  let content = fs.readFileSync(file, 'utf8');
  
  const h1Index = content.indexOf('text-6xl font-heading font-black');
  if (h1Index !== -1) {
    // Find the starting <div className="space-y-4 min-w-0">
    const divStart = content.lastIndexOf('<div className="space-y-4 min-w-0">', h1Index);
    if (divStart !== -1) {
      // Find the closing </div> of this block
      // A naive approach since we know the exact structure
      // We look for the first </p> after the h1 and then its closing </div>
      const pEnd = content.indexOf('</p>', h1Index);
      if (pEnd !== -1) {
        const divEnd = content.indexOf('</div>', pEnd);
        if (divEnd !== -1) {
           const before = content.substring(0, divStart);
           const after = content.substring(divEnd + 6); // length of '</div>'
           fs.writeFileSync(file, before + after, 'utf8');
           changed++;
           console.log('Fixed ' + f);
        }
      }
    }
  }
});
console.log('Total files changed: ' + changed);
