import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'; // Default frontend URL
const LIST_FILE = path.join(__dirname, '..', 'MANUAIS_DE_TELA', 'LISTA-DE-URLS.md');

// Test accounts
const ACCOUNTS = {
  CLIENT: { email: 'recomendonacidade@gmail.com', password: '123456', role: 'CLIENTE' },
  PRO: { email: 'matheuskurio@gmail.com', password: '123456', role: 'PROFISSIONAL' },
  ADMIN: { email: 'contatofotosegundo@gmail.com', password: '123456', role: 'ADMIN' },
  CARTORIO: { email: 'recomendonacozinha@gmail.com', password: '123456', role: 'CARTORIO' },
  FRANCHISEE: { email: 'matheuskurio@gmail.com', password: '123456', role: 'FRANCHISEE' } // matheuskurio has HasFranchiseProfile: true
};

const ROLES = Object.keys(ACCOUNTS);

// Dynamic parameter substitutions (from database queries)
const PARAMS = {
  slug: 'bday-kurio-mpmxwdgz',
  eventId: 'cmpmy7dq20000jo04306mhl5q',
  proId: 'cmpmxqow3000cl804br1kl3zb',
  orderId: 'cmpmy7e6z0004jo04ced409z4',
  vaultId: 'cmpmxw9s50001l804h92037nd',
  shortId: '1265F8E9',
  code: 'TESTCODE',
  matchId: 'g7'
};

function parseUrls() {
  const content = fs.readFileSync(LIST_FILE, 'utf-8');
  const lines = content.split('\n');
  const urls = [];
  
  for (const line of lines) {
    const match = line.match(/^\|\s*(\d+[a-zA-Z]?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (match) {
      urls.push({
        num: match[1],
        rawPath: match[2].trim(),
        description: match[3].trim(),
        access: match[4].trim()
      });
    }
  }
  return urls;
}

function resolvePath(rawPath) {
  let p = rawPath;
  p = p.replace(':slug', PARAMS.slug);
  p = p.replace(':orderId', PARAMS.orderId);
  p = p.replace(':vaultId', PARAMS.vaultId);
  p = p.replace(':shortId', PARAMS.shortId);
  p = p.replace(':code', PARAMS.code);
  p = p.replace(':matchId', PARAMS.matchId);
  
  if (p === '/delivery/:id') return `/delivery/${PARAMS.orderId}`;
  if (p === '/pro/:id') return `/pro/${PARAMS.proId}`;
  
  if (p.startsWith('/admin?s=')) {
    const sVal = p.split('=')[1];
    const adminMap = {
      'usuarios': 'users',
      'pedidos': 'orders',
      'eventos': 'events',
      'financeiro': 'finance',
      'profissionais': 'approvals',
      'servicos': 'services',
      'unidades': 'printers',
      'franquias': 'franchises',
      'growth': 'growth',
      'concursos': 'contests',
      'embaixadores': 'ambassadors',
      'catalogo-impressao': 'print-catalog',
      'fornecedores': 'printers',
      'estoque': 'inventory',
      'leads': 'crm',
      'configuracoes': 'settings',
      'analytics': 'analytics'
    };
    const mapped = adminMap[sVal] || sVal;
    return `/admin/${mapped}`;
  }
  
  p = p.replace(':eventId', PARAMS.eventId);
  p = p.replace(':id', PARAMS.eventId);
  
  return p;
}

// Generate authentication states before testing to save time
test.beforeAll(async ({ browser }) => {
  if (!fs.existsSync(path.join(__dirname, 'auth'))) {
    fs.mkdirSync(path.join(__dirname, 'auth'));
  }
  
  for (const roleKey of ROLES) {
    const stateFile = path.join(__dirname, 'auth', `${roleKey}-state.json`);
    // Re-generate auth states dynamically
    const context = await browser.newContext();
    const page = await context.newPage();
    const account = ACCOUNTS[roleKey];
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', account.email);
    await page.fill('input[type="password"]', account.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect indicating success
    await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 });
    
    // Force active role into local storage for the dashboard
    await page.evaluate((r) => {
      localStorage.setItem('fs_active_role', r);
      localStorage.setItem('fs_tour_v1_PROFISSIONAL', 'true');
      localStorage.setItem('fs_tour_v1_CARTORIO', 'true');
      localStorage.setItem('fs_tour_v1_ADMIN', 'true');
    }, account.role);
    
    await page.waitForTimeout(1000);
    await context.storageState({ path: stateFile });
    await context.close();
  }
});

const urls = parseUrls();

test.describe('Role-Based Access Control Matrix Validation', () => {
  for (const urlItem of urls) {
    const pathUrl = resolvePath(urlItem.rawPath);
    const targetUrl = `${BASE_URL}${pathUrl}`;

    for (const roleKey of ROLES) {
      
      // Determine if this role SHOULD have access
      let expectedAccess = false;
      const allowedAccessStr = urlItem.access;
      
      if (allowedAccessStr.includes('Todos') || allowedAccessStr.includes('Público')) {
        expectedAccess = true;
      } else if (allowedAccessStr.includes('Autenticado')) {
        expectedAccess = true; // Any authenticated role
      } else if (allowedAccessStr.includes('ADMIN') && roleKey === 'ADMIN') {
        expectedAccess = true;
      } else if (allowedAccessStr.includes('PROFISSIONAL') && roleKey === 'PRO') {
        expectedAccess = true;
      } else if (allowedAccessStr.includes('FRANCHISEE') && roleKey === 'FRANCHISEE') {
        expectedAccess = true;
      } else if ((allowedAccessStr.includes('CARTORIO') || allowedAccessStr.includes('UNIDADE')) && roleKey === 'CARTORIO') {
        expectedAccess = true;
      } else if (allowedAccessStr.includes('CLIENTE') && roleKey === 'CLIENT') {
        expectedAccess = true;
      }

      test(`Route ${pathUrl} as ${roleKey} (Expect: ${expectedAccess ? 'ALLOW' : 'DENY'})`, async ({ browser }) => {
        const stateFile = path.join(__dirname, 'auth', `${roleKey}-state.json`);
        const context = await browser.newContext({ storageState: stateFile });
        const page = await context.newPage();
        
        await page.goto(targetUrl, { waitUntil: 'commit' });
        
        // Let any redirects resolve
        await page.waitForTimeout(2000); 
        const currentUrl = new URL(page.url()).pathname;
        
        if (expectedAccess) {
          // If access is expected, we shouldn't be redirected away from the core route
          // Allow minor redirects (like to /admin/overview from /admin)
          if (pathUrl === '/admin' && currentUrl.startsWith('/admin')) {
             expect(currentUrl).toContain('/admin');
          } else if (pathUrl === '/dashboard') {
             // dashboard intelligently redirects based on role
             expect(currentUrl).not.toBe('/login');
          } else {
             // We should be closely matching the target (e.g. ignoring query params)
             expect(currentUrl.startsWith(pathUrl.split('?')[0])).toBeTruthy();
          }
          // The page should have loaded something (body present)
          await expect(page.locator('body')).toBeVisible();
        } else {
          // If access is NOT expected, we SHOULD be redirected
          // Usually redirected to /dashboard or /login, or see an "Acesso Negado" error state.
          const isRedirected = currentUrl !== pathUrl;
          
          if (!isRedirected) {
             // If not redirected, check if page contains "Acesso Restrito" or "Não autorizado"
             const bodyText = await page.textContent('body');
             const hasErrorMsg = bodyText.toLowerCase().includes('acesso restrito') || bodyText.toLowerCase().includes('não autorizado') || bodyText.toLowerCase().includes('não tem permissão');
             expect(hasErrorMsg).toBeTruthy();
          } else {
             // Redirected to safe fallback
             expect(currentUrl === '/dashboard' || currentUrl === '/login' || currentUrl === '/').toBeTruthy();
          }
        }
        
        await context.close();
      });
    }
  }
});
