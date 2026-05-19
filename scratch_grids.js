const fs = require('fs');
const path = require('path');

const directories = [
  'c:/foto-segundo/frontend/src/pages',
  'c:/foto-segundo/frontend/src/pages/admin',
  'c:/foto-segundo/frontend/src/pages/franchise',
  'c:/foto-segundo/frontend/src/pages/profissional'
];

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
    files.forEach(file => {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Update grid-cols-1 to grid-cols-2 when it has sm, md, lg, xl modifiers for 2, 3 or 4
      const regex = /className="([^"]*)grid grid-cols-1 (sm|md|lg|xl):grid-cols-(2|3|4)([^"]*)"/g;
      
      if (regex.test(content)) {
        const newContent = content.replace(regex, 'className="$1grid grid-cols-2 $2:grid-cols-$3$4"');
        fs.writeFileSync(filePath, newContent);
        console.log('Updated grid layout in ' + filePath);
      }
    });
  }
});
