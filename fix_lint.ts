import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  }
}

const targetDir = path.join(process.cwd(), 'frontend', 'src');
let changed = 0;

walk(targetDir, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;
  content = content.replace(/catch\s*\(\s*err\s*\)/g, 'catch (err: unknown)');
  content = content.replace(/catch\s*\(\s*error\s*\)/g, 'catch (error: unknown)');
  content = content.replace(/catch\s*\(\s*e\s*\)/g, 'catch (e: unknown)');
  content = content.replace(/catch\s*\(\s*_\s*\)/g, 'catch (_: unknown)');
  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Updated ${filepath}`);
    changed++;
  }
});

console.log(`Updated ${changed} files.`);
