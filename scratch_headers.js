const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const headerRegex = /<div className="relative border-b border-theme-border\/60 pb-8 md:pb-12 space-y-4 md:space-y-6">[\s\S]*?<h1 className="text-.*? font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none whitespace-.*?">([\s\S]*?)<\/h1>[\s\S]*?<div className="h-1 w-12 bg-brand-tactical" \/>[\s\S]*?<p className="text-\[.*?\] font-black text-brand-tactical uppercase tracking-\[.*?\] italic">([\s\S]*?)<\/p>[\s\S]*?<\/div>[\s\S]*?(?:<\/div>|<\/div>\s*<\/div>)(?=\n\s*(?:<!--|\{?\/\*|}))/g;

// A regex um pouco mais flexível:
const regexFlexible = /<div className="relative border-b border-theme-border\/60 pb-8 md:pb-12 space-y-4 md:space-y-6">[\s\S]*?<h1 className="[^"]*font-heading[^"]*">([\s\S]*?)<\/h1>[\s\S]*?<div className="h-1 w-12 bg-brand-tactical" \/>\s*<p className="[^"]*text-brand-tactical[^"]*">([\s\S]*?)<\/p>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;

// The one in AdminOverview is:
//       <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
//         <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
//         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
//           <div className="space-y-4">
//             <h1 className="text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none whitespace-nowrap">
//               Visão <span className="text-brand-tactical">Geral</span>
//             </h1>
//             <div className="flex items-center gap-4">
//               <div className="h-1 w-12 bg-brand-tactical" />
//               <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
//                 Consolidado da Operação Nacional
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('bg-brand-tactical/5 blur-3xl rounded-full')) return;

  const replaceRegex = /<div className="relative border-b border-theme-border\/60 pb-8 md:pb-12 space-y-4 md:space-y-6">\s*<div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical\/5 blur-3xl rounded-full" \/>\s*<div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">\s*<div className="space-y-4">\s*<h1 className="[^"]*">([\s\S]*?)<\/h1>\s*<div className="flex items-center gap-4">\s*<div className="h-1 w-12 bg-brand-tactical" \/>\s*<p className="[^"]*">([\s\S]*?)<\/p>\s*<\/div>\s*<\/div>(\s*<div className="flex flex-wrap items-center gap-\d+ w-full xl:w-auto">[\s\S]*?<\/div>)?\s*<\/div>\s*<\/div>/g;

  if (replaceRegex.test(content)) {
    console.log("Matched exactly in " + filePath);
    const newContent = content.replace(replaceRegex, (match, h1Content, pContent, rightActions) => {
      // Remove any italic classes from the text inside if there's any span but the h1 shouldn't have italic
      return `<div className="relative pb-8 pt-4 md:pt-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-tactical/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter leading-none">
            ${h1Content.trim().replace(/italic\s?/g, '')}
          </h1>
          <p className="text-[12px] md:text-[14px] font-black text-brand-tactical uppercase tracking-[0.2em] italic">
            ${pContent.trim()}
          </p>
          ${rightActions ? `<div className="mt-4 flex justify-center w-full">${rightActions.trim()}</div>` : ''}
        </div>
      </div>`;
    });
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
      // Just check what failed
      const genericMatch = /<div className="relative border-b border-theme-border\/60 pb-8 md:pb-12/g;
      if (genericMatch.test(content)) {
          console.log(`Missed regex but has header in: ${filePath}`);
      }
  }
}

walkDir('c:/foto-segundo/frontend/src/pages', processFile);
