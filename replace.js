const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(function(file) {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) { 
                results = results.concat(walk(file));
            } else { 
                if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                    results.push(file);
                }
            }
        });
    } catch(e) {}
    return results;
}

const files = [...walk(path.join(__dirname, 'frontend/src')), ...walk(path.join(__dirname, 'backend/src'))];
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('nomeNoivos')) {
        content = content.replace(/nomeNoivos/g, 'title');
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated ${file}`);
    }
});
console.log(`Done. Changed ${changed} files.`);
