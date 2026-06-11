// rename_phases.js
const fs = require('fs');
const path = require('path');
const phasesDir = path.resolve('C:/foto-segundo/.planning/phases');
fs.readdirSync(phasesDir, { withFileTypes: true }).forEach(dirent => {
  if (dirent.isDirectory()) {
    const oldName = dirent.name;
    const match = oldName.match(/^0(\d{2})-(.+)$/);
    if (match) {
      const newName = `${match[1]}-${match[2]}`;
      const oldPath = path.join(phasesDir, oldName);
      const newPath = path.join(phasesDir, newName);
      if (!fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed ${oldName} -> ${newName}`);
      } else {
        console.warn(`Target name ${newName} already exists, skipping ${oldName}`);
      }
    }
  }
});
