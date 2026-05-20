const fs = require('fs');
const path = require('path');
const dir = 'c:/foto-segundo/frontend/src/pages/admin';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
        if (classes.includes('border-theme-border') && (classes.includes('bg-theme-bg') || classes.includes('bg-theme-bg-muted') || classes.includes('bg-theme-card'))) {
            if (!classes.includes('rounded-')) {
                return 'className=' + quote + classes + ' rounded-2xl' + quote;
            }
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + path.basename(filePath));
    }
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(dir, f)));
console.log('Done');
