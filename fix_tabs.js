const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'frontend/src/pages/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.tsx'));

let updated = 0;

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. AdminUsers & AdminInventory style tabs
  if (content.includes('className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto"')) {
    content = content.replace(
      'className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto"',
      'className="grid grid-cols-2 md:flex md:gap-2 pb-2 md:pb-0 w-full md:w-auto gap-2"'
    );
    changed = true;
  }

  // 2. AdminSuppliers & AdminConfigs style tabs
  if (content.includes('className="flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm italic"')) {
    content = content.replace(
      'className="flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm italic"',
      'className="grid grid-cols-3 md:flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm italic gap-1"'
    );
    changed = true;
  }
  if (content.includes('className="flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm max-w-fit"')) {
    content = content.replace(
      'className="flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm max-w-fit"',
      'className="grid grid-cols-2 sm:grid-cols-3 md:flex bg-theme-bg border border-theme-border/60 p-1.5 shadow-sm w-full md:w-auto md:max-w-fit gap-1"'
    );
    changed = true;
  }

  // 3. AdminOrders style tabs
  if (content.includes('className="flex items-center gap-3 border-b border-theme-border/30 pb-6 overflow-x-auto no-scrollbar"')) {
    content = content.replace(
      'className="flex items-center gap-3 border-b border-theme-border/30 pb-6 overflow-x-auto no-scrollbar"',
      'className="grid grid-cols-2 md:flex items-center gap-2 md:gap-3 border-b border-theme-border/30 pb-6"'
    );
    changed = true;
  }

  // 4. AdminEvents modal tabs
  if (content.includes('className="flex items-center gap-8 mr-12"')) {
    content = content.replace(
      'className="flex items-center gap-8 mr-12"',
      'className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8 mr-0 md:mr-12"'
    );
    changed = true;
  }

  // 5. AdminGrowth style tabs
  if (content.includes('className="flex border-b border-theme-border/40 overflow-x-auto hide-scrollbar"')) {
    content = content.replace(
      'className="flex border-b border-theme-border/40 overflow-x-auto hide-scrollbar"',
      'className="grid grid-cols-2 md:flex border-b border-theme-border/40 gap-1"'
    );
    changed = true;
  }

  // General button whitespace-nowrap fix
  if (content.match(/<button[^>]*whitespace-nowrap[^>]*>/)) {
    content = content.replace(/(<button[^>]*?)whitespace-nowrap([^>]*?>)/g, '$1text-center w-full break-words leading-tight$2');
    changed = true;
  }

  // Fix button sizes in forms/modals
  if (content.match(/text-\[9px\]\s+font-black\s+uppercase\s+tracking-widest/)) {
    content = content.replace(/text-\[9px\]\s+font-black\s+uppercase\s+tracking-widest/g, 'text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    updated++;
  }
}

console.log(`Updated tabs in ${updated} files.`);
