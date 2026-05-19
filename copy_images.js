const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\foto-segundo\\ANOTAÇÕES\\exemplo para celular\\auditoria pontual em 13 imagens';
const artifactsDir = 'C:\\Users\\Kurio\\.gemini\\antigravity\\brain\\51a06284-3a2d-4f6b-9082-f7dd7b72ef3a\\artifacts';

if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, {recursive: true});
}

const files = fs.readdirSync(srcDir);
let mdContent = '# Audit Images\n\n';

files.forEach((f, i) => {
  const newName = 'audit_img_' + i + '.jpeg';
  fs.copyFileSync(path.join(srcDir, f), path.join(artifactsDir, newName));
  const artifactPath = artifactsDir.replace(/\\/g, '/');
  mdContent += `![${f}](file:///${artifactPath}/${newName})\n\n`;
});

fs.writeFileSync(path.join(artifactsDir, 'audit_report.md'), mdContent);
console.log('Images copied and audit_report.md created.');
