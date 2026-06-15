const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');
const OUTPUT_FILE = path.join(__dirname, 'audit_results.json');

const findings = {
  routes: [],
  brokenLinks: [],
  hardcodedColors: [],
  genericColors: [],
  hiddenElements: [],
  duplicateRoutes: [],
};

// 1. Extract valid routes from App.tsx
function extractRoutes() {
  const appTsxPath = path.join(FRONTEND_DIR, 'App.tsx');
  if (fs.existsSync(appTsxPath)) {
    const content = fs.readFileSync(appTsxPath, 'utf8');
    const routeRegex = /<Route\s+path=["']([^"']+)["']/g;
    let match;
    const routesSet = new Set();
    while ((match = routeRegex.exec(content)) !== null) {
      const routePath = match[1];
      if (routesSet.has(routePath)) {
        findings.duplicateRoutes.push(routePath);
      }
      routesSet.add(routePath);
      findings.routes.push(routePath);
    }
  }
}

function isValidRoute(linkPath) {
  if (linkPath.startsWith('http') || linkPath.startsWith('mailto:') || linkPath.startsWith('tel:')) return true;
  if (linkPath === '#' || linkPath === '') return true;
  if (findings.routes.includes('*')) return true; // Catcher exists, but we want strict matching if possible.

  const baseLink = linkPath.split('?')[0].split('#')[0];
  
  // exact match
  if (findings.routes.includes(baseLink)) return true;
  
  // match dynamic routes
  for (const route of findings.routes) {
    // /e/:slug => regex /e/[^/]+
    let routeRegexStr = route.replace(/:[^\s/]+/g, '[^/]+').replace(/\*/g, '.*');
    let routeRegex = new RegExp(`^${routeRegexStr}$`);
    if (routeRegex.test(baseLink)) return true;
  }
  
  // Match dynamic template literals like /e/${slug}
  if (baseLink.includes('${')) {
    const staticPrefix = baseLink.split('${')[0];
    for (const route of findings.routes) {
      if (route.startsWith(staticPrefix)) return true;
    }
  }

  return false;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const colorRegex = /#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})\b/g;
const genericColorClassRegex = /\b(?:text|bg|border)-(?:red|blue|green|yellow|purple|pink|indigo|teal|orange)-(?:[1-9]00)\b/g;
const hiddenClassRegex = /\b(?:hidden|opacity-0|pointer-events-none)\b/g;

// Link extractors
const linkToRegex = /<Link[^>]+to=(?:["']([^"']+)["']|\{["'`]?([^"'`]+)["'`]?\})/g;
const hrefRegex = /<a[^>]+href=(?:["']([^"']+)["']|\{["'`]?([^"'`]+)["'`]?\})/g;
const navigateRegex = /navigate\((?:["']([^"']+)["']|`([^`]+)`)\)/g;


function analyzeFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx')) return;
  if (filePath.includes('node_modules')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(FRONTEND_DIR, filePath);

  // Check Colors
  let m;
  while ((m = colorRegex.exec(content)) !== null) {
    // Ignore #FFF/#000 as they are common and often acceptable
    if (!['fff', 'ffffff', '000', '000000'].includes(m[1].toLowerCase())) {
       findings.hardcodedColors.push({ file: relPath, match: m[0] });
    }
  }

  while ((m = genericColorClassRegex.exec(content)) !== null) {
    findings.genericColors.push({ file: relPath, match: m[0] });
  }

  // Check Hidden logic (just flagging them, too noisy otherwise, let's limit)
  let lines = content.split('\n');
  lines.forEach((line, index) => {
    if (hiddenClassRegex.test(line)) {
      // Very noisy, skip adding to report unless explicitly needed. Let's just count them.
    }
  });

  // Check Links
  const checkLink = (link) => {
    if (link && !isValidRoute(link)) {
      findings.brokenLinks.push({ file: relPath, link });
    }
  };

  while ((m = linkToRegex.exec(content)) !== null) { checkLink(m[1] || m[2]); }
  while ((m = hrefRegex.exec(content)) !== null) { checkLink(m[1] || m[2]); }
  while ((m = navigateRegex.exec(content)) !== null) { checkLink(m[1] || m[2]); }
}

extractRoutes();
walkDir(FRONTEND_DIR, analyzeFile);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(findings, null, 2));
console.log(`Auditoria completa. Resultados salvos em ${OUTPUT_FILE}`);
console.log(`Rotas cadastradas encontradas: ${findings.routes.length}`);
console.log(`Possíveis Links Quebrados: ${findings.brokenLinks.length}`);
console.log(`Cores Hardcoded Encontradas: ${findings.hardcodedColors.length}`);
console.log(`Classes de Cores Genéricas: ${findings.genericColors.length}`);
