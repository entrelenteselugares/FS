const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminServices.tsx', 'utf-8');

// 1. Update tabs state to include "PACOTES"
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<\"CATALOGO\" \| \"PENDENTES\">\((\"CATALOGO\")\);/,
  'const [activeTab, setActiveTab] = useState<"CATALOGO" | "PENDENTES" | "PACOTES">("CATALOGO");'
);

// 2. Add Package Modals State
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState.*?;/,
  `$&
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Service | null>(null);`
);

// 3. Add Package Save Handler
code = code.replace(
  /const handleSave = useCallback.*?\n.*?setSaving\(true\);/,
  `$&`
);
// Wait, better to replace the 'const handleSave = useCallback' to add a handleSavePackage
code = code.replace(
  /const handleSave = useCallback/,
  `const handleSavePackage = useCallback(async (pkgData: Partial<Service>) => {
    setSaving(true);
    try {
      const payload = { ...pkgData, isPackage: true };
      if (editingPackage) {
        await API.patch(\`/admin/service-catalog/\${editingPackage.id}\`, payload);
        toast.success("Pacote atualizado!");
      } else {
        await API.post("/admin/service-catalog", payload);
        toast.success("Pacote criado!");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-service-catalog"] });
      setIsPackageModalOpen(false);
      setEditingPackage(null);
    } catch {
      toast.error("Erro ao salvar pacote.");
    } finally {
      setSaving(false);
    }
  }, [editingPackage, queryClient]);

  const handleSave = useCallback`
);

// 4. Update the "ADICIONAR SERVIÇO" header to also have "MONTAR PACOTE" when in PACOTES tab
code = code.replace(
  /<button onClick=\{\(\) => setIsModalOpen\(true\)\} className=\"px-8 py-4 bg-brand-tactical/,
  `{activeTab === "PACOTES" ? (
          <button onClick={() => { setEditingPackage(null); setIsPackageModalOpen(true); }} className="px-8 py-4 bg-amber-500 text-black text-[9px] font-black uppercase tracking-[0.4em] shadow-xl hover:brightness-110 transition-all flex items-center gap-3 italic">
            <Layers size={14} /> MONTAR PACOTE
          </button>
        ) : (
          <button onClick={() => { setEditingService(null); setIsModalOpen(true); }} className="px-8 py-4 bg-brand-tactical`
);
code = code.replace(
  /ADICIONAR SERVIÇO\n\s*<\/button>/,
  `ADICIONAR SERVIÇO\n        </button>\n        )}`
);

// 5. Update tabs buttons
code = code.replace(
  /<div className=\"flex gap-4 border-b border-theme-border pb-4\">[\s\S]*?<\/div>/,
  `<div className="flex gap-4 border-b border-theme-border pb-4 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab("CATALOGO")} className={\`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-all \${activeTab === "CATALOGO" ? "bg-brand-tactical text-[var(--brand-text)]" : "text-theme-muted hover:bg-theme-bg-muted"}\`}>
          Catálogo Global
        </button>
        <button onClick={() => setActiveTab("PACOTES")} className={\`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-all flex items-center gap-2 \${activeTab === "PACOTES" ? "bg-amber-500 text-black" : "text-theme-muted hover:bg-theme-bg-muted"}\`}>
          Pacotes (Combos)
        </button>
        <button onClick={() => setActiveTab("PENDENTES")} className={\`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-all flex items-center gap-2 \${activeTab === "PENDENTES" ? "bg-brand-tactical text-[var(--brand-text)]" : "text-theme-muted hover:bg-theme-bg-muted"}\`}>
          Aprovações Pendentes
          {pendingServices.length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{pendingServices.length}</span>}
        </button>
      </div>`
);

// 6. Split activeTab logic
code = code.replace(
  /\{activeTab === \"CATALOGO\" \? \(/,
  `{activeTab === "CATALOGO" || activeTab === "PACOTES" ? (`
);

// 7. Filter logic update for "PACOTES"
code = code.replace(
  /const filteredServices = useMemo\(\(\) =>\n\s*services\.filter\(s =>/,
  `const filteredServices = useMemo(() =>
    services.filter(s => activeTab === "PACOTES" ? (s as any).isPackage : !(s as any).isPackage).filter(s =>`
);

// 8. Make sure Service model has isPackage and packageItems
code = code.replace(
  /category: string;\n\}/,
  `category: string;
  isPackage?: boolean;
  packageItems?: string[];
}`
);

// 9. Add simple PackageModal component at the top
const packageModal = `
// --- Package Modal Component ---
const PackageModal: React.FC<{ onClose: () => void, onSave: (data: any) => void, initialData: any, saving: boolean, services: Service[] }> = ({ onClose, onSave, initialData, saving, services }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [basePrice, setBasePrice] = useState(initialData?.basePrice || 0);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialData?.packageItems || []);

  const availableServices = services.filter(s => !s.isPackage);
  const comboPrice = selectedItems.reduce((acc, id) => {
    const s = availableServices.find(x => x.id === id);
    return acc + (s?.basePrice || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-card border border-theme-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading font-black text-theme-text uppercase italic">{initialData ? 'Editar Pacote' : 'Montar Novo Pacote'}</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-white"><Trash2 size={20}/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-theme-muted">Nome do Pacote</label>
            <input className="w-full bg-theme-bg p-3 rounded-lg text-white text-sm outline-none border border-theme-border focus:border-amber-500" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-muted">Descrição</label>
            <textarea className="w-full bg-theme-bg p-3 rounded-lg text-white text-sm outline-none border border-theme-border focus:border-amber-500 h-20" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-muted block mb-2">Serviços Inclusos no Pacote</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
              {availableServices.map(s => (
                <label key={s.id} className="flex items-center gap-2 p-3 border border-theme-border rounded-lg bg-theme-bg cursor-pointer hover:border-amber-500/50">
                  <input type="checkbox" className="accent-amber-500" checked={selectedItems.includes(s.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedItems(prev => [...prev, s.id]);
                    else setSelectedItems(prev => prev.filter(id => id !== s.id));
                  }}/>
                  <div>
                    <p className="text-[10px] font-bold text-theme-text uppercase">{s.name}</p>
                    <p className="text-[8px] text-theme-muted">{(s.basePrice).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-theme-bg/50 border border-theme-border rounded-lg">
                <p className="text-[9px] font-black uppercase text-theme-muted">Valor dos Itens Separados</p>
                <p className="text-lg font-black text-theme-text line-through opacity-50">{comboPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-theme-muted">Preço Final do Pacote</label>
                <input type="number" className="w-full bg-theme-bg p-3 rounded-lg text-amber-500 font-bold text-lg outline-none border border-theme-border focus:border-amber-500" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} />
             </div>
          </div>
          <button disabled={saving || !name || selectedItems.length === 0} onClick={() => onSave({ name, description, basePrice, packageItems: selectedItems, category: 'PACOTE' })} className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-lg mt-4 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Pacote'}
          </button>
        </div>
      </div>
    </div>
  );
};
`;

code = code.replace(
  /const formatCurrency = \(val: number\) =>/,
  packageModal + '\nconst formatCurrency = (val: number) =>'
);

// 10. Inject PackageModal in the render tree
code = code.replace(
  /\{isModalOpen && \(/,
  `{isPackageModalOpen && (
        <PackageModal
          onClose={() => { setIsPackageModalOpen(false); setEditingPackage(null); }}
          onSave={handleSavePackage}
          initialData={editingPackage}
          saving={saving}
          services={services}
        />
      )}
      {isModalOpen && (`
);

// 11. Replace "CATALOGO" string in empty state with "PACOTES" depending on activeTab
code = code.replace(
  /<p className=\"text-\[11px\] font-black text-brand-tactical uppercase tracking-\[0\.4em\] italic\">Tabela de Preços e Serviços<\/p>/g,
  `<p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">{activeTab === "PACOTES" ? "Catálogo de Pacotes" : "Tabela de Preços e Serviços"}</p>`
);

code = code.replace(
  /<p className=\"text-\[8px\] text-theme-muted\/60 uppercase tracking-widest\">Inicie o seu catálogo para habilitar o gerador de orçamentos\.<\/p>/g,
  `<p className="text-[8px] text-theme-muted/60 uppercase tracking-widest">{activeTab === "PACOTES" ? "Monte seu primeiro combo de serviços." : "Inicie o seu catálogo para habilitar o gerador de orçamentos."}</p>`
);

// 12. Fix the edit buttons inside the map to check if it is a package
code = code.replace(
  /<button onClick=\{\(\) => \{ setEditingService\(s\); setIsModalOpen\(true\); \}\} className=\"p-3 border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical transition-all\">/g,
  `<button onClick={() => { if ((s as any).isPackage) { setEditingPackage(s); setIsPackageModalOpen(true); } else { setEditingService(s); setIsModalOpen(true); } }} className="p-3 border border-theme-border text-theme-muted hover:text-brand-tactical hover:border-brand-tactical transition-all">`
);

fs.writeFileSync('src/pages/admin/AdminServices.tsx', code);
console.log('AdminServices updated with Packages support!');
