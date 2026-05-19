const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'frontend/src/pages/admin');
const files = fs.readdirSync(adminDir).filter(f => f.startsWith('Admin') && f.endsWith('.tsx'));

const titleMap = {
  'AdminOverview.tsx': { t1: 'Visão', t2: 'Geral', sub: 'Métricas e Indicadores da Operação' },
  'AdminEvents.tsx': { t1: 'Gestão de', t2: 'Eventos', sub: 'Administração de Coberturas Fotográficas' },
  'AdminUsers.tsx': { t1: 'Gestão de', t2: 'Membros', sub: 'Operação de Times, Unidades e Parceiros' },
  'AdminQuotes.tsx': { t1: 'Gestão de', t2: 'Orçamentos', sub: 'Propostas e Negociações Comerciais' },
  'AdminLeadsPage.tsx': { t1: 'CRM &', t2: 'Leads', sub: 'Funil de Vendas e Prospecção' },
  'AdminOrders.tsx': { t1: 'Gestão de', t2: 'Pedidos', sub: 'Controle de Vendas e Faturamento' },
  'AdminFinance.tsx': { t1: 'Painel', t2: 'Financeiro', sub: 'Fluxo de Caixa e Liquidações' },
  'AdminSuppliers.tsx': { t1: 'Operação de', t2: 'Impressão', sub: 'Logística, Amortização e Fila' },
  'AdminFranchises.tsx': { t1: 'Rede de', t2: 'Franquias', sub: 'Controle de Licenças e Royalties' },
  'AdminInventory.tsx': { t1: 'Estoque', t2: 'Central', sub: 'Gestão de Ativos e Logística' },
  'AdminPrintCatalog.tsx': { t1: 'Catálogo de', t2: 'Impressão', sub: 'Precificação e Portfólio de Impressão' },
  'AdminServices.tsx': { t1: 'Gestão de', t2: 'Serviços', sub: 'Tabela de Preços e Serviços Fotográficos' },
  'AdminGrowth.tsx': { t1: 'Motor de', t2: 'Growth', sub: 'Expansão e Inteligência de Mercado' },
  'AdminApprovalHub.tsx': { t1: 'Central de', t2: 'Aprovações', sub: 'Auditoria de Cadastros e Saques' },
  'AdminContests.tsx': { t1: 'Gestão de', t2: 'Concursos', sub: 'Gamificação e Engajamento da Rede' },
  'AdminConfigs.tsx': { t1: 'Ajustes &', t2: 'Configurações', sub: 'Parâmetros Globais do Sistema' },
  'AdminAmbassadors.tsx': { t1: 'Rede de', t2: 'Embaixadores', sub: 'Marketing de Afiliados e Influência' },
};

let updated = 0;

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace h1 container
  content = content.replace(/<div className="space-y-4">\s*<h1/g, '<div className="space-y-4 min-w-0">\n          <h1');
  
  // Replace h1
  content = content.replace(/<h1 className="[^"]+"( style=\{[^}]+\})?>([\s\S]*?)<\/h1>/g, (match, style, inner) => {
    let mapData = titleMap[file];
    let newInner = inner;
    if (mapData && match.includes('text-theme-text')) {
      newInner = `\n            ${mapData.t1} <span className="text-brand-tactical">${mapData.t2}</span>\n          `;
    }
    return `<h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap"${style||''}>${newInner}</h1>`;
  });

  // Replace subtitle p
  content = content.replace(/<p className="([^"]*tracking-\[0\.4em\][^"]*|[^"]*italic[^"]*)">([\s\S]*?)<\/p>/g, (match, cls, inner) => {
    if (cls.includes('tracking') && cls.includes('italic') && cls.includes('uppercase') && cls.includes('font-black')) {
       let mapData = titleMap[file];
       let newInner = inner.trim();
       if (mapData && (newInner.length > 5 && newInner.length < 80)) {
           newInner = mapData.sub;
       }
       return `<p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">${newInner}</p>`;
    }
    return match;
  });

  fs.writeFileSync(filePath, content);
  updated++;
}

console.log(`Updated ${updated} files.`);
