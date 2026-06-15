const fs = require('fs');
const path = require('path');

const filePaths = [
  path.join(__dirname, '../frontend/src/components/worldcup/AlbumMissionsTab.tsx'),
  path.join(__dirname, '../frontend/src/components/worldcup/WorldCupLiveBanner.tsx')
];

for (const filePath of filePaths) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // The main brand color used
  content = content.replace(/#85b9ac/gi, 'var(--brand)');
  content = content.replace(/rgba\(133,\s*185,\s*172/g, 'rgba(var(--brand-rgb, 133, 185, 172)');

  // The dark green backgrounds
  content = content.replace(/#050e08/gi, 'var(--bg)');
  content = content.replace(/#022c22/gi, 'var(--bg-card)');
  content = content.replace(/#064e3b/gi, 'var(--bg-field)');
  content = content.replace(/#065f46/gi, 'var(--brand-active)');

  // Text colors
  content = content.replace(/#fbbf24/gi, '#F59E0B'); // Standardize yellow to amber
  content = content.replace(/#4b5563/gi, 'var(--text-disabled)');
  content = content.replace(/#9ca3af/gi, 'var(--text-muted)');
  content = content.replace(/#6b7280/gi, 'var(--text-muted)');
  content = content.replace(/#374151/gi, 'var(--border)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refatoração de cores concluída em ${path.basename(filePath)}`);
}
