const fs = require('fs');
const dir = 'c:/foto-segundo/frontend/src/pages/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let remaining = 0;
files.forEach(f => {
    const content = fs.readFileSync(dir + '/' + f, 'utf8');
    // Find class strings with bg-theme-bg or bg-theme-bg-muted + border-theme-border but no rounded
    const re = /className=["']([^"']*bg-theme-bg[^"']*border[^"']*border-theme-border[^"']*)["']/g;
    let m;
    while ((m = re.exec(content)) !== null) {
        if (!m[1].includes('rounded')) {
            console.log(f + ': ' + m[1].substring(0, 100));
            remaining++;
        }
    }
});
console.log('Total remaining square:', remaining);
