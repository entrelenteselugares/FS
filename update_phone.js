const fs = require('fs');
const path = require('path');

const NEW_PHONE = "5519981150440";
const targetDir = path.join(__dirname, 'frontend', 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace various hardcoded numbers and empty wa.me/ links
  content = content.replace(/wa\.me\/5511999999999/g, `wa.me/${NEW_PHONE}`);
  content = content.replace(/wa\.me\/5519984470420/g, `wa.me/${NEW_PHONE}`);
  content = content.replace(/wa\.me\/5519997843817/g, `wa.me/${NEW_PHONE}`);
  
  // Replace empty wa.me/ or wa.me/?text=
  content = content.replace(/wa\.me\/'/g, `wa.me/${NEW_PHONE}'`);
  content = content.replace(/wa\.me\/"/g, `wa.me/${NEW_PHONE}"`);
  content = content.replace(/wa\.me\/\?text=/g, `wa.me/${NEW_PHONE}?text=`);

  // Specific for QuotePage.tsx and EventPage.tsx where there might be empty wa.me links
  // But the above regexes cover it.

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walk(targetDir);
console.log("Done updating phone numbers.");
