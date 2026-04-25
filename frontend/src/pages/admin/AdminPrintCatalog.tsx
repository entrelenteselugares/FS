import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import { T, BtnPrimary, BtnSecondary, BtnGhost, Card, FieldInput, FieldLabel } from "../../lib/theme";
import {
  ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  Percent, Database, Eye, EyeOff, Plus, X, Tag, Upload, RefreshCw
} from "lucide-react";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface PrintProduct {
  id: string;
  category: string;
  name: string;
  sku: string;
  supplierCost: number;
  supplier: string;
  active: boolean;
  marginPct: number;
  sellingPrice: number | null;
  calculatedPrice: number;
  finalPrice: number;
  description: string | null;
  unit: string;
  minQty: number | null;
  maxQty: number | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ALBUM:      { label: "Álbuns Encadernados", color: "#85B9AC" },
  ALBUM_30X40:{ label: "Álbuns 30×40",        color: "#a78bfa" },
  ACESSORIOS: { label: "Acabamentos e Acessórios", color: "#f59e0b" },
  QUADROS:    { label: "Quadros e Cadernos",   color: "#60a5fa" },
  REVELACAO:  { label: "Revelação de Fotos",   color: "#f87171" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Subcomponente: Modal Novo Produto ───────────────────────────────────────

interface NewProductModalProps {
  onClose: () => void;
  onSave: (data: Partial<PrintProduct>) => Promise<void>;
}

const NewProductModal: React.FC<NewProductModalProps> = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    supplier: "CK",
    category: "ALBUM",
    name: "",
    sku: "",
    supplierCost: "",
    unit: "un",
    marginPct: "30",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...form,
        supplierCost: parseFloat(form.supplierCost),
        marginPct: parseFloat(form.marginPct)
      } as Partial<PrintProduct>);
      onClose();
    } catch {
      alert("Erro ao criar produto. Verifique se o SKU já existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: T.overlay, display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)"
    }}>
      <div style={{ ...Card, width: 500, padding: 24, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: T.text3, cursor: "pointer" }}>
          <X size={20} />
        </button>
        
        <h2 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 18, color: T.text, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>
          Novo Item no Catálogo
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={FieldLabel}>Fornecedor</label>
              <select 
                value={form.supplier} 
                onChange={e => setForm({...form, supplier: e.target.value})}
                style={FieldInput}
              >
                <option value="CK">Encadernadora CK</option>
                <option value="OUTRO">Outro Fornecedor</option>
              </select>
            </div>
            <div>
              <label style={FieldLabel}>Categoria</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
                style={FieldInput}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={FieldLabel}>Nome do Produto</label>
            <input 
              required
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Ex: Álbum 15x21 - Capa Linho"
              style={FieldInput}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={FieldLabel}>SKU / Código</label>
              <input 
                required
                value={form.sku} 
                onChange={e => setForm({...form, sku: e.target.value})}
                placeholder="SKU-UNIQ-001"
                style={FieldInput}
              />
            </div>
            <div>
              <label style={FieldLabel}>Unidade</label>
              <input 
                value={form.unit} 
                onChange={e => setForm({...form, unit: e.target.value})}
                placeholder="un, cópia, lâmina..."
                style={FieldInput}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={FieldLabel}>Custo Fornecedor (R$)</label>
              <input 
                required
                type="number" step="0.01"
                value={form.supplierCost} 
                onChange={e => setForm({...form, supplierCost: e.target.value})}
                placeholder="0,00"
                style={FieldInput}
              />
            </div>
            <div>
              <label style={FieldLabel}>Margem Sugerida (%)</label>
              <input 
                type="number"
                value={form.marginPct} 
                onChange={e => setForm({...form, marginPct: e.target.value})}
                style={FieldInput}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={{ ...BtnSecondary, flex: 1 }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ ...BtnPrimary, flex: 1 }}>
              {loading ? "Salvando..." : "Cadastrar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Subcomponente: Linha de Produto ──────────────────────────────────────────

interface ProductRowProps {
  product: PrintProduct;
  onToggle: (id: string, active: boolean) => void;
  onMarginChange: (id: string, margin: number) => void;
  onPriceOverride: (id: string, price: number | null) => void;
  saving: string | null;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, onToggle, onMarginChange, onPriceOverride, saving }) => {
  const [localMargin, setLocalMargin] = useState(String(product.marginPct));
  const [localPrice, setLocalPrice] = useState(
    product.sellingPrice !== null ? String(product.sellingPrice) : ""
  );
  const [editing, setEditing] = useState(false);
  const isSaving = saving === product.id;

  const handleMarginBlur = () => {
    const val = parseFloat(localMargin);
    if (!isNaN(val) && val !== product.marginPct) {
      onMarginChange(product.id, val);
    }
  };

  const handlePriceBlur = () => {
    const trimmed = localPrice.trim();
    if (trimmed === "" && product.sellingPrice !== null) {
      onPriceOverride(product.id, null);
    } else {
      const val = parseFloat(trimmed.replace(",", "."));
      if (!isNaN(val) && val !== product.sellingPrice) {
        onPriceOverride(product.id, val);
      }
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 90px 90px 90px 110px 110px 80px 42px",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderBottom: `1px solid ${T.border}`,
        opacity: product.active ? 1 : 0.45,
        transition: "opacity 0.2s",
        background: editing ? "rgba(133,185,172,0.04)" : "transparent",
      }}
      onMouseEnter={() => setEditing(true)}
      onMouseLeave={() => setEditing(false)}
    >
      <button
        id={`toggle-${product.id}`}
        onClick={() => onToggle(product.id, !product.active)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: product.active ? T.brand : T.text3 }}
      >
        {product.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
      </button>

      <div>
        <div style={{ fontSize: 12, color: T.text, fontFamily: T.fontB, fontWeight: 400, lineHeight: 1.3 }}>
          {product.name}
        </div>
        <div style={{ fontSize: 10, color: T.text3, fontFamily: T.fontB, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <Tag size={10} /> {product.supplier} | {product.sku}
          {product.minQty !== null && (
            <span style={{ marginLeft: 6, color: T.brand }}>
              {product.minQty}{product.maxQty ? `–${product.maxQty}` : "+"} {product.unit}
            </span>
          )}
        </div>
      </div>

      {/* Fornecedor */}
      <div style={{ fontSize: 10, color: T.text3, fontFamily: T.fontB, textAlign: "right", textTransform: "uppercase" }}>
        {product.supplier}
      </div>

      <div style={{ fontSize: 12, color: T.text2, fontFamily: T.fontB, textAlign: "right" }}>
        {fmt(product.supplierCost)}
        <div style={{ fontSize: 9, color: T.text3 }}>custo</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <label style={{ ...FieldLabel, fontSize: 9 }}>Margem</label>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            value={localMargin}
            onChange={e => setLocalMargin(e.target.value)}
            onBlur={handleMarginBlur}
            style={{ ...FieldInput, width: "100%", padding: "5px 6px", fontSize: 12, textAlign: "right" }}
          />
          <Percent size={10} color={T.text3} />
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, color: T.brand, fontFamily: T.fontB, fontWeight: 500 }}>
          {fmt(product.calculatedPrice)}
        </div>
        <div style={{ fontSize: 9, color: T.text3 }}>auto</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <label style={{ ...FieldLabel, fontSize: 9 }}>Manual</label>
        <input
          placeholder="—"
          value={localPrice}
          onChange={e => setLocalPrice(e.target.value)}
          onBlur={handlePriceBlur}
          style={{ ...FieldInput, width: "100%", padding: "5px 6px", fontSize: 12, textAlign: "right", color: localPrice ? T.brand : T.text3 }}
        />
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, color: T.text, fontFamily: T.fontD, fontWeight: 900 }}>
          {fmt(product.finalPrice)}
        </div>
        <div style={{ fontSize: 9, color: T.text3 }}>/{product.unit}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        {isSaving && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.brand }} className="animate-ping" />}
      </div>
    </div>
  );
};

// ─── Subcomponente: Grupo de Categoria ────────────────────────────────────────

interface CategoryGroupProps {
  category: string;
  products: PrintProduct[];
  onToggle: (id: string, active: boolean) => void;
  onMarginChange: (id: string, margin: number) => void;
  onPriceOverride: (id: string, price: number | null) => void;
  onBulkMargin: (category: string, margin: number) => void;
  saving: string | null;
  showInactive: boolean;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category, products, onToggle, onMarginChange, onPriceOverride, onBulkMargin, saving, showInactive
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [bulkMargin, setBulkMargin] = useState("");
  const meta = CATEGORY_LABELS[category] ?? { label: category, color: T.text2 };
  const visible = showInactive ? products : products.filter(p => p.active);
  const activeCount = products.filter(p => p.active).length;

  return (
    <div style={{ marginBottom: 4, border: `1px solid ${T.border}`, background: T.bgCard }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: collapsed ? "none" : `1px solid ${T.border}`, cursor: "pointer" }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ color: T.text3 }}>{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
        <div style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 13, color: T.text, textTransform: "uppercase", letterSpacing: 1.5, flex: 1 }}>{meta.label}</div>
        <div style={{ fontSize: 10, color: T.text3 }}>{activeCount}/{products.length} ativos</div>

        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
            <input
              placeholder="Margem %"
              value={bulkMargin}
              onChange={e => setBulkMargin(e.target.value)}
              style={{ ...FieldInput, width: 60, padding: "4px 8px", fontSize: 11, textAlign: "right" }}
            />
            <button onClick={() => { const v = parseFloat(bulkMargin); if (!isNaN(v)) onBulkMargin(category, v); }} style={{ ...BtnGhost, padding: "4px 10px", fontSize: 10 }}>Aplicar</button>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 90px 90px 90px 110px 110px 80px 42px", gap: 8, padding: "6px 16px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${T.border}` }}>
            {["", "Produto", "Fornec.", "Custo", "Margem", "Calculado", "Manual", "Final", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 9, color: T.text3, fontFamily: T.fontB, textTransform: "uppercase", letterSpacing: 1, textAlign: i >= 2 ? "right" : "left" }}>{h}</div>
            ))}
          </div>
          {visible.map(p => <ProductRow key={p.id} product={p} onToggle={onToggle} onMarginChange={onMarginChange} onPriceOverride={onPriceOverride} saving={saving} />)}
        </>
      )}
    </div>
  );
};

// ─── Página Principal ──────────────────────────────────────────────────────────

export const AdminPrintCatalog: React.FC = () => {
  const [products, setProducts] = useState<PrintProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/print-catalog");
      setProducts(data.products);
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (formData: Partial<PrintProduct>) => {
    const { data } = await API.post("/admin/print-catalog", formData);
    setProducts(ps => [...ps, data]);
  };

  const handleToggle = async (id: string, active: boolean) => {
    setSaving(id);
    setProducts(ps => ps.map(p => p.id === id ? { ...p, active } : p));
    try { await API.patch(`/admin/print-catalog/${id}`, { active }); } catch { load(); } finally { setSaving(null); }
  };

  const handleMarginChange = async (id: string, marginPct: number) => {
    setSaving(id);
    try {
      const { data } = await API.patch(`/admin/print-catalog/${id}`, { marginPct });
      setProducts(ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
    } finally { setSaving(null); }
  };

  const handlePriceOverride = async (id: string, sellingPrice: number | null) => {
    setSaving(id);
    try {
      const { data } = await API.patch(`/admin/print-catalog/${id}`, { sellingPrice });
      setProducts(ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
    } finally { setSaving(null); }
  };

  const handleBulkMargin = async (category: string, marginPct: number) => {
    await API.patch("/admin/print-catalog/bulk-margin", { category, marginPct });
    load();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSeeding(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const productsToImport = Array.isArray(json) ? json : json.products;
        
        if (!productsToImport) throw new Error("Formato inválido");

        const { data } = await API.post("/admin/print-catalog/import", { products: productsToImport });
        alert(`Importação concluída!\nCriados: ${data.created}\nAtualizados: ${data.updated}\nErros: ${data.errors}`);
        load();
      } catch (err) {
        alert("Erro ao ler arquivo. Certifique-se de que é um JSON válido.");
      } finally {
        setSeeding(false);
        e.target.value = ""; // limpa o input
      }
    };
    reader.readAsText(file);
  };

  const handleSeedCK = async () => {
    if (!confirm("Isso irá importar/restaurar as tabelas de referência padrão (CK). Continuar?")) return;
    setSeeding(true);
    try { await API.post("/admin/print-catalog/seed", {}); load(); } finally { setSeeding(false); }
  };

  const categories = Object.keys(CATEGORY_LABELS);
  const grouped = categories.reduce<Record<string, PrintProduct[]>>((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat && (filterCategory === "" || p.category === filterCategory));
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: T.fontB }}>
      {isModalOpen && <NewProductModal onClose={() => setIsModalOpen(false)} onSave={handleCreate} />}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px 16px", background: T.bgCard, border: `1px solid ${T.border}` }}>
        <div style={{ flex: 1, display: "flex", gap: 24 }}>
          <div><div style={{ fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: T.brand }}>{products.filter(p=>p.active).length}</div><div style={{ fontSize: 9, color: T.text3, textTransform: "uppercase" }}>Ativos</div></div>
          <div><div style={{ fontSize: 22, fontFamily: T.fontD, fontWeight: 900, color: T.text }}>{products.length}</div><div style={{ fontSize: 9, color: T.text3, textTransform: "uppercase" }}>Total</div></div>
        </div>

        <button onClick={() => setIsModalOpen(true)} style={{ ...BtnGhost, color: T.brand, border: `1px solid ${T.brand}` }}>
          <Plus size={14} /> Novo Item
        </button>

        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...FieldInput, width: 200 }}>
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c].label}</option>)}
        </select>

        <button onClick={() => setShowInactive(!showInactive)} style={{ ...BtnSecondary, fontSize: 11 }}>
          {showInactive ? <Eye size={13} /> : <EyeOff size={13} />} {showInactive ? "Ocultar Inativos" : "Exibir Inativos"}
        </button>

        <div style={{ position: "relative" }}>
          <input 
            type="file" 
            id="import-file" 
            accept=".json" 
            onChange={handleImportFile} 
            style={{ display: "none" }} 
          />
          <button 
            onClick={() => document.getElementById("import-file")?.click()} 
            style={{ ...BtnPrimary, fontSize: 11 }} 
            disabled={seeding}
          >
            <Upload size={13} /> {seeding ? "Processando..." : "Importar Arquivo"}
          </button>
        </div>

        <button onClick={handleSeedCK} style={{ ...BtnGhost, fontSize: 9, opacity: 0.5 }} title="Restaurar Padrão CK">
          <RefreshCw size={10} />
        </button>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: T.text3 }}>Carregando catálogo...</div> : (
        <>
          <h1 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 24, color: T.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            CATÁLOGO DE IMPRESSÃO
          </h1>
          <div style={{ fontSize: 10, color: T.text3, marginBottom: 20, fontStyle: "italic" }}>
            Gerenciamento global de produtos de impressão. Fornecedor padrão: CK Encadernadora.
          </div>
          {categories.filter(cat => grouped[cat]?.length > 0).map(cat => (
            <CategoryGroup key={cat} category={cat} products={grouped[cat]} onToggle={handleToggle} onMarginChange={handleMarginChange} onPriceOverride={handlePriceOverride} onBulkMargin={handleBulkMargin} saving={saving} showInactive={showInactive} />
          ))}
        </>
      )}
    </div>
  );
};

export default AdminPrintCatalog;
