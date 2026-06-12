const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'frontend/src/pages/admin');

const pages = [
  { file: 'AdminLeadsPage.tsx', title: 'CRM & Leads', subtitle: 'Gerenciamento de conversões e carrinhos abandonados' },
  { file: 'AdminOverview.tsx', title: 'Visão Geral', subtitle: 'Métricas e performance da plataforma' },
  { file: 'AdminEvents.tsx', title: 'Eventos', subtitle: 'Gestão de sessões fotográficas e galerias' },
  { file: 'AdminFinance.tsx', title: 'Financeiro', subtitle: 'Gestão de saques, repasses e fluxo de caixa' },
  { file: 'AdminOrders.tsx', title: 'Pedidos', subtitle: 'Gerenciamento de vendas e faturamento' },
  { file: 'AdminUsers.tsx', title: 'Membros', subtitle: 'Gestão de profissionais, clientes e franquias' },
  { file: 'AdminInventory.tsx', title: 'Estoque', subtitle: 'Gestão de ativos físicos e suprimentos' },
  { file: 'AdminGrowth.tsx', title: 'Marketing', subtitle: 'Gestão de cupons, campanhas e parcerias' },
  { file: 'AdminContests.tsx', title: 'Concursos', subtitle: 'Gestão de premiações e gamificação' },
  { file: 'AdminAmbassadors.tsx', title: 'Embaixadores', subtitle: 'Gestão de afiliados e promotores' },
  { file: 'AdminPrintCatalog.tsx', title: 'Catálogo de Impressão', subtitle: 'Gestão de pacotes e preços de lab' },
  { file: 'AdminSuppliers.tsx', title: 'Fornecedores', subtitle: 'Gestão de parceiros e infraestrutura' },
  { file: 'AdminPhygitalQueue.tsx', title: 'Fila Phygital', subtitle: 'Monitoramento de impressões em tempo real' },
  { file: 'AdminApprovalHub.tsx', title: 'Aprovações', subtitle: 'Central de moderação de cadastros' },
  { file: 'AdminConfigs.tsx', title: 'Configurações de Negócio', subtitle: 'Parâmetros operacionais' },
  { file: 'AdminServices.tsx', title: 'Serviços', subtitle: 'Gestão de catálogo, portfólio de serviços e aprovações' },
  { file: 'AdminSettings.tsx', title: 'Configurações do Sistema', subtitle: 'Infraestrutura e Parâmetros de Protocolo' },
  { file: 'AdminFranchises.tsx', title: 'Rede', subtitle: 'Gestão de Franqueados e Multiplicadores' }
];

for (const page of pages) {
  const filePath = path.join(adminDir, page.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    const newHeader = `<h2 className="text-2xl md:text-4xl font-heading font-bold text-theme-text uppercase">${page.title}</h2>\n          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold">${page.subtitle}</p>`;

    // Case 1: Missing H1 entirely (only a P tag)
    // <div>
    //   <p className="...">...</p>
    // </div>
    content = content.replace(/<div>\s*<p className="text-theme-muted mt-2 text-[^>]*>[^<]*<\/p>\s*<\/div>/g, 
        `<div>\n          ${newHeader}\n        </div>`);
    
    content = content.replace(/<div>\s*<p className="text-theme-muted mt-2 text-sm uppercase tracking-widest font-bold">[^<]*<\/p>\s*<\/div>/g, 
        `<div>\n          ${newHeader}\n        </div>`);
    
    // Case 2: Has H1 and P
    content = content.replace(/<div>\s*<h1 className="[^"]*">[^<]*<\/h1>\s*<p className="[^"]*">[^<]*<\/p>\s*<\/div>/g,
        `<div>\n          ${newHeader}\n        </div>`);

    // Case 3: Has H2 and P (like AdminSettings)
    content = content.replace(/<div>\s*<h2 className="[^"]*">[^<]*<\/h2>\s*<p className="[^"]*">[^<]*<\/p>\s*<\/div>/g,
        `<div>\n          ${newHeader}\n        </div>`);

    // For AdminEvents and AdminFinance which might have just an H1
    content = content.replace(/<div>\s*<h1 className="[^"]*">[^<]*<\/h1>\s*<\/div>/g,
        `<div>\n          ${newHeader}\n        </div>`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${page.file}`);
  }
}
