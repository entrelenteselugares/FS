import { useState, useRef } from 'react';
import { X, Printer, ChevronDown, ChevronUp, Check, Save } from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface PrintSettings {
  // Border
  borderEnabled: boolean;
  borderWidth: number; // mm (0-20)
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'double' | 'none';

  // Logo / Watermark
  logoEnabled: boolean;
  logoUrl: string; // '' = usar tenantLogoUrl
  logoPosition: OverlayPosition;
  logoOpacity: number; // 0-100
  logoSize: 'sm' | 'md' | 'lg';

  // Date/Time
  dateEnabled: boolean;
  dateFormat: 'datetime' | 'date' | 'time';
  datePosition: OverlayPosition;
  dateColor: string;
  dateBg: boolean; // dark background behind text

  // Reference Code
  codeEnabled: boolean;
  codePosition: OverlayPosition;
  codeColor: string;

  // Layout
  photoSize: '9x13' | '10x15' | '13x18' | 'A4';
  copies: number;
  orientation: 'portrait' | 'landscape';
}

type OverlayPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'mid-left' | 'mid-center' | 'mid-right'
  | 'bot-left' | 'bot-center' | 'bot-right';

export interface PhygitalPrint {
  id: string;
  referenceCode: string;
  imageUrl: string;
  customerName: string;
  status: 'PENDING_PRINT' | 'PRINTED' | 'DISPATCHED_MAIL';
  createdAt: string;
}

interface Props {
  print: PhygitalPrint;
  eventId: string;
  tenantLogoUrl?: string;
  onClose: () => void;
  onPrinted: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = (eventId: string) => `fs_print_settings_${eventId}`;

const DEFAULTS: PrintSettings = {
  borderEnabled: false,
  borderWidth: 5,
  borderColor: '#ffffff',
  borderStyle: 'solid',
  logoEnabled: true,
  logoUrl: '',
  logoPosition: 'bot-right',
  logoOpacity: 70,
  logoSize: 'sm',
  dateEnabled: true,
  dateFormat: 'datetime',
  datePosition: 'bot-left',
  dateColor: '#ffffff',
  dateBg: true,
  codeEnabled: true,
  codePosition: 'top-right',
  codeColor: '#14b8a6',
  photoSize: '10x15',
  copies: 1,
  orientation: 'portrait',
};

// mm sizes on A4 (210x297mm)
const PHOTO_SIZES: Record<PrintSettings['photoSize'], { w: number; h: number; label: string }> = {
  '9x13': { w: 90, h: 130, label: '9×13 cm' },
  '10x15': { w: 100, h: 150, label: '10×15 cm' },
  '13x18': { w: 130, h: 180, label: '13×18 cm' },
  'A4': { w: 210, h: 297, label: 'A4 Inteiro' },
};

function photosPerSheet(size: PrintSettings['photoSize'], orientation: PrintSettings['orientation']): number {
  if (size === 'A4') return 1;
  const page = orientation === 'portrait' ? { w: 210, h: 297 } : { w: 297, h: 210 };
  const { w, h } = PHOTO_SIZES[size];
  const cols = Math.floor(page.w / w);
  const rows = Math.floor(page.h / h);
  return cols * rows;
}

function positionStyle(pos: OverlayPosition): React.CSSProperties {
  const map: Record<OverlayPosition, React.CSSProperties> = {
    'top-left':    { top: 6, left: 6 },
    'top-center':  { top: 6, left: '50%', transform: 'translateX(-50%)' },
    'top-right':   { top: 6, right: 6 },
    'mid-left':    { top: '50%', left: 6, transform: 'translateY(-50%)' },
    'mid-center':  { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
    'mid-right':   { top: '50%', right: 6, transform: 'translateY(-50%)' },
    'bot-left':    { bottom: 6, left: 6 },
    'bot-center':  { bottom: 6, left: '50%', transform: 'translateX(-50%)' },
    'bot-right':   { bottom: 6, right: 6 },
  };
  return map[pos];
}

function logoSizePx(s: PrintSettings['logoSize']): number {
  return s === 'sm' ? 32 : s === 'md' ? 48 : 64;
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function Section({ title, children, open, onToggle }: { title: string; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/40 transition-all">
        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5 pt-2 space-y-4 border-t border-zinc-800">{children}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-brand-tactical' : 'bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function PositionGrid({ value, onChange }: { value: OverlayPosition; onChange: (v: OverlayPosition) => void }) {
  const positions: OverlayPosition[] = [
    'top-left', 'top-center', 'top-right',
    'mid-left', 'mid-center', 'mid-right',
    'bot-left', 'bot-center', 'bot-right',
  ];
  return (
    <div className="grid grid-cols-3 gap-1 w-24">
      {positions.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-7 h-7 rounded-md border transition-all ${value === p ? 'bg-brand-tactical border-brand-tactical' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'}`}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────

export function PrintSettingsPanel({ print, eventId, tenantLogoUrl, onClose, onPrinted }: Props) {
  const [settings, setSettings] = useState<PrintSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(eventId));
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  const [openSections, setOpenSections] = useState({
    border: false, logo: true, date: true, code: true, layout: true,
  });

  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const set = (partial: Partial<PrintSettings>) =>
    setSettings(prev => ({ ...prev, ...partial }));

  const toggleSection = (k: keyof typeof openSections) =>
    setOpenSections(prev => ({ ...prev, [k]: !prev[k] }));

  const saveAsDefault = () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY(eventId), JSON.stringify(settings));
    setTimeout(() => setSaving(false), 1500);
  };

  const effectiveLogo = settings.logoUrl || tenantLogoUrl || '/logo.png';
  const perSheet = photosPerSheet(settings.photoSize, settings.orientation);
  const pSize = PHOTO_SIZES[settings.photoSize];
  const nowStr = new Date(print.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const dateStr =
    settings.dateFormat === 'datetime' ? nowStr :
    settings.dateFormat === 'date' ? nowStr.split(' ')[0] :
    nowStr.split(' ')[1];

  // ── Print Engine ──────────────────────────────────────────────────────────
  const executePrint = () => {
    setPrinting(true);

    const isDark = true;
    const pageBg = isDark ? '#09090b' : '#ffffff';
    const pageW = settings.orientation === 'portrait' ? 210 : 297;
    const pageH = settings.orientation === 'portrait' ? 297 : 210;

    const logoSizeMm = settings.logoSize === 'sm' ? 15 : settings.logoSize === 'md' ? 22 : 30;

    // Build a single photo cell HTML
    const buildCell = (width: number, height: number) => {
      const borderOuter = settings.borderEnabled
        ? `border: ${settings.borderWidth}mm ${settings.borderStyle} ${settings.borderColor}; box-sizing: border-box;`
        : '';

      const logoOverlay = settings.logoEnabled ? `
        <img src="${effectiveLogo}"
          style="
            position:absolute;
            ${positionCssString(settings.logoPosition, '3mm', '3mm')};
            height:${logoSizeMm}mm;
            object-fit:contain;
            opacity:${settings.logoOpacity / 100};
            max-width:${logoSizeMm * 2}mm;
          "
        />
      ` : '';

      const dateBg = settings.dateBg ? 'background:rgba(0,0,0,0.55);padding:1mm 2mm;border-radius:2mm;' : '';
      const dateOverlay = settings.dateEnabled ? `
        <span style="
          position:absolute;
          ${positionCssString(settings.datePosition, '3mm', '3mm')};
          color:${settings.dateColor};
          font-size:8pt;
          font-weight:900;
          font-family:'Inter',sans-serif;
          letter-spacing:0.05em;
          ${dateBg}
          white-space:nowrap;
        ">${dateStr}</span>
      ` : '';

      const codeOverlay = settings.codeEnabled ? `
        <span style="
          position:absolute;
          ${positionCssString(settings.codePosition, '3mm', '3mm')};
          color:${settings.codeColor};
          font-size:9pt;
          font-weight:900;
          font-family:'Inter',sans-serif;
          letter-spacing:0.15em;
          background:rgba(0,0,0,0.6);
          padding:1mm 2.5mm;
          border-radius:2mm;
          text-transform:uppercase;
          white-space:nowrap;
        ">${print.referenceCode}</span>
      ` : '';

      return `
        <div style="
          width:${width}mm;
          height:${height}mm;
          position:relative;
          overflow:hidden;
          flex-shrink:0;
          ${borderOuter}
        ">
          <img src="${print.imageUrl}"
            crossorigin="anonymous"
            style="width:100%;height:100%;object-fit:cover;display:block;" />
          ${logoOverlay}
          ${dateOverlay}
          ${codeOverlay}
        </div>
      `;
    };

    // Total cells = copies × perSheet
    const totalCells = settings.copies * (settings.photoSize === 'A4' ? 1 : perSheet);
    const cells = Array.from({ length: totalCells }, () => buildCell(pSize.w, pSize.h)).join('');

    const gapMm = 2;

    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    @page {
      size: ${pageW}mm ${pageH}mm;
      margin: 0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: ${settings.photoSize === 'A4' ? '0' : '4mm'};
      background: ${pageBg};
      font-family: 'Inter', sans-serif;
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: ${settings.photoSize === 'A4' ? '0' : gapMm + 'mm'};
      width: 100%;
      justify-content: flex-start;
      align-content: flex-start;
    }
  </style>
</head>
<body>
  <div class="grid">${cells}</div>
</body>
</html>`;

    // Write into hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = `${pageW}mm`;
    iframe.style.height = `${pageH}mm`;
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iDoc) {
      iDoc.open();
      iDoc.write(htmlDoc);
      iDoc.close();

      // Wait for images to load before printing
      const imgs = iDoc.querySelectorAll('img');
      let loaded = 0;
      const total = imgs.length;

      const tryPrint = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          setPrinting(false);
          onPrinted();
        }, 800);
      };

      if (total === 0) {
        setTimeout(tryPrint, 300);
      } else {
        imgs.forEach(img => {
          const done = () => {
            loaded++;
            if (loaded >= total) tryPrint();
          };
          if (img.complete) done();
          else { img.onload = done; img.onerror = done; }
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col md:flex-row h-[92vh] shadow-2xl text-white">

        {/* ── Left: Settings Panel ───────────────────────────────── */}
        <div className="w-full md:w-[400px] flex flex-col border-r border-zinc-800 bg-zinc-900/80">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
            <div>
              <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Impressão Profissional</p>
              <h2 className="text-xl font-heading font-black uppercase italic tracking-tighter mt-0.5">
                Configurar &amp; Imprimir
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable settings */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-hide">

            {/* BORDER */}
            <Section title="Borda" open={openSections.border} onToggle={() => toggleSection('border')}>
              <Row label="Ativar Borda"><Toggle value={settings.borderEnabled} onChange={v => set({ borderEnabled: v })} /></Row>
              {settings.borderEnabled && (<>
                <Row label="Largura (mm)">
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={20} value={settings.borderWidth} onChange={e => set({ borderWidth: +e.target.value })} className="w-24 accent-teal-400" />
                    <span className="text-[10px] font-black w-6 text-zinc-300">{settings.borderWidth}</span>
                  </div>
                </Row>
                <Row label="Cor">
                  <div className="flex items-center gap-2">
                    {['#ffffff', '#09090b', '#f2c12e', '#14b8a6', '#ef4444'].map(c => (
                      <button key={c} onClick={() => set({ borderColor: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${settings.borderColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={settings.borderColor} onChange={e => set({ borderColor: e.target.value })} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" />
                  </div>
                </Row>
                <Row label="Tipo">
                  <div className="flex gap-1">
                    {(['solid', 'dashed', 'double'] as const).map(s => (
                      <button key={s} onClick={() => set({ borderStyle: s })}
                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.borderStyle === s ? 'bg-brand-tactical text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                        {s === 'solid' ? 'Sólida' : s === 'dashed' ? 'Tracejada' : 'Dupla'}
                      </button>
                    ))}
                  </div>
                </Row>
              </>)}
            </Section>

            {/* LOGO */}
            <Section title="Logo / Marca D'água" open={openSections.logo} onToggle={() => toggleSection('logo')}>
              <Row label="Exibir Logo"><Toggle value={settings.logoEnabled} onChange={v => set({ logoEnabled: v })} /></Row>
              {settings.logoEnabled && (<>
                <Row label="Posição"><PositionGrid value={settings.logoPosition} onChange={v => set({ logoPosition: v })} /></Row>
                <Row label="Opacidade">
                  <div className="flex items-center gap-2">
                    <input type="range" min={10} max={100} value={settings.logoOpacity} onChange={e => set({ logoOpacity: +e.target.value })} className="w-24 accent-teal-400" />
                    <span className="text-[10px] font-black w-8 text-zinc-300">{settings.logoOpacity}%</span>
                  </div>
                </Row>
                <Row label="Tamanho">
                  <div className="flex gap-1">
                    {(['sm', 'md', 'lg'] as const).map(s => (
                      <button key={s} onClick={() => set({ logoSize: s })}
                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.logoSize === s ? 'bg-brand-tactical text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                        {s === 'sm' ? 'P' : s === 'md' ? 'M' : 'G'}
                      </button>
                    ))}
                  </div>
                </Row>
              </>)}
            </Section>

            {/* DATE */}
            <Section title="Data e Hora" open={openSections.date} onToggle={() => toggleSection('date')}>
              <Row label="Exibir Data/Hora"><Toggle value={settings.dateEnabled} onChange={v => set({ dateEnabled: v })} /></Row>
              {settings.dateEnabled && (<>
                <Row label="Formato">
                  <div className="flex gap-1 flex-wrap justify-end">
                    {([['datetime', 'Data+Hora'], ['date', 'Só Data'], ['time', 'Só Hora']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => set({ dateFormat: v })}
                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.dateFormat === v ? 'bg-brand-tactical text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="Posição"><PositionGrid value={settings.datePosition} onChange={v => set({ datePosition: v })} /></Row>
                <Row label="Cor">
                  <div className="flex items-center gap-2">
                    {['#ffffff', '#09090b', '#14b8a6', '#f2c12e'].map(c => (
                      <button key={c} onClick={() => set({ dateColor: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${settings.dateColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={settings.dateColor} onChange={e => set({ dateColor: e.target.value })} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" />
                  </div>
                </Row>
                <Row label="Fundo Escuro"><Toggle value={settings.dateBg} onChange={v => set({ dateBg: v })} /></Row>
              </>)}
            </Section>

            {/* CODE */}
            <Section title="Código da Foto" open={openSections.code} onToggle={() => toggleSection('code')}>
              <Row label="Exibir Código"><Toggle value={settings.codeEnabled} onChange={v => set({ codeEnabled: v })} /></Row>
              {settings.codeEnabled && (<>
                <Row label="Posição"><PositionGrid value={settings.codePosition} onChange={v => set({ codePosition: v })} /></Row>
                <Row label="Cor">
                  <div className="flex items-center gap-2">
                    {['#ffffff', '#09090b', '#14b8a6'].map(c => (
                      <button key={c} onClick={() => set({ codeColor: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${settings.codeColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </Row>
              </>)}
            </Section>

            {/* LAYOUT */}
            <Section title="Tamanho e Cópias" open={openSections.layout} onToggle={() => toggleSection('layout')}>
              <Row label="Tamanho da Foto">
                <div className="flex flex-wrap gap-1 justify-end">
                  {(Object.entries(PHOTO_SIZES) as [PrintSettings['photoSize'], { label: string }][]).map(([k, v]) => (
                    <button key={k} onClick={() => set({ photoSize: k })}
                      className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.photoSize === k ? 'bg-brand-tactical text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Orientação">
                <div className="flex gap-1">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button key={o} onClick={() => set({ orientation: o })}
                      className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${settings.orientation === o ? 'bg-brand-tactical text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                      {o === 'portrait' ? 'Retrato' : 'Paisagem'}
                    </button>
                  ))}
                </div>
              </Row>
              {settings.photoSize !== 'A4' && (
                <div className="px-3 py-2 bg-brand-tactical/10 border border-brand-tactical/20 rounded-xl">
                  <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest">
                    {perSheet} foto{perSheet !== 1 ? 's' : ''} por folha A4
                  </p>
                </div>
              )}
              <Row label="Cópias">
                <div className="flex items-center gap-2">
                  <button onClick={() => set({ copies: Math.max(1, settings.copies - 1) })} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-black flex items-center justify-center transition-all">−</button>
                  <span className="w-8 text-center font-black text-lg">{settings.copies}</span>
                  <button onClick={() => set({ copies: Math.min(10, settings.copies + 1) })} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-black flex items-center justify-center transition-all">+</button>
                </div>
              </Row>
            </Section>

          </div>{/* end scroll */}

          {/* Bottom Actions */}
          <div className="px-5 py-5 border-t border-zinc-800 space-y-3">
            <button onClick={saveAsDefault}
              className="w-full py-3 border border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
              {saving ? <><Check size={14} className="text-green-500" /> Salvo!</> : <><Save size={14} /> Salvar como Padrão do Evento</>}
            </button>
            <button
              onClick={executePrint}
              disabled={printing}
              className="w-full py-4 bg-brand-tactical hover:brightness-110 disabled:opacity-60 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(20,184,166,0.3)]"
            >
              <Printer size={16} />
              {printing ? 'Preparando...' : `Imprimir ${settings.copies > 1 ? `(${settings.copies}×)` : 'Agora'}`}
            </button>
          </div>
        </div>

        {/* ── Right: Live Preview ────────────────────────────────── */}
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-8 overflow-auto">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-6 italic">
            Pré-visualização em Tempo Real — {PHOTO_SIZES[settings.photoSize].label} • {settings.orientation === 'portrait' ? 'Retrato' : 'Paisagem'}
          </p>

          {/* A4 miniature in preview aspect ratio */}
          <div className="relative shadow-2xl overflow-hidden rounded-lg"
            style={{
              width: settings.orientation === 'portrait' ? 240 : 340,
              height: settings.orientation === 'portrait' ? 340 : 240,
              background: '#1a1a1a',
              border: '1px solid #27272a',
            }}>

            {/* Photo preview cell */}
            <div className="absolute inset-4 overflow-hidden"
              style={{
                outline: settings.borderEnabled ? `${(settings.borderWidth / 20) * 12}px ${settings.borderStyle} ${settings.borderColor}` : 'none',
              }}>
              <img
                src={print.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />

              {/* Logo overlay */}
              {settings.logoEnabled && (
                <img
                  src={effectiveLogo}
                  alt=""
                  style={{
                    position: 'absolute',
                    height: logoSizePx(settings.logoSize),
                    objectFit: 'contain',
                    opacity: settings.logoOpacity / 100,
                    maxWidth: logoSizePx(settings.logoSize) * 2,
                    ...positionStyle(settings.logoPosition),
                  }}
                />
              )}

              {/* Date overlay */}
              {settings.dateEnabled && (
                <span style={{
                  position: 'absolute',
                  color: settings.dateColor,
                  fontSize: 9,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  background: settings.dateBg ? 'rgba(0,0,0,0.6)' : 'transparent',
                  padding: '2px 5px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  ...positionStyle(settings.datePosition),
                }}>{dateStr}</span>
              )}

              {/* Code overlay */}
              {settings.codeEnabled && (
                <span style={{
                  position: 'absolute',
                  color: settings.codeColor,
                  fontSize: 8,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  background: 'rgba(0,0,0,0.65)',
                  padding: '2px 5px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  ...positionStyle(settings.codePosition),
                }}>{print.referenceCode}</span>
              )}
            </div>

            {/* Watermark label */}
            <div className="absolute bottom-1 right-2 text-[7px] text-zinc-700 font-bold uppercase tracking-widest select-none">
              preview
            </div>
          </div>

          {/* Info card */}
          <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-sm">
            {[
              { label: 'Tamanho', value: PHOTO_SIZES[settings.photoSize].label },
              { label: 'Cópias', value: `${settings.copies}×` },
              { label: 'Por Folha', value: settings.photoSize === 'A4' ? '1' : String(perSheet) },
            ].map(item => (
              <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-center">
                <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">{item.label}</p>
                <p className="text-sm font-black text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[9px] text-zinc-700 text-center max-w-xs leading-relaxed">
            A impressão será enviada diretamente à sua impressora. Selecione <strong className="text-zinc-500">Tamanho A4</strong> e <strong className="text-zinc-500">Sem margem</strong> no diálogo de impressão do sistema para melhor resultado.
          </p>
        </div>

      </div>

      {/* Hidden iframe for printing */}
      <iframe ref={iframeRef} style={{ display: 'none' }} title="print-frame" />
    </div>
  );
}

// Helper for CSS string generation (for html doc, not React style)
function positionCssString(pos: OverlayPosition, offset = '3mm', _offset2 = '3mm'): string {
  const v = offset;
  const map: Record<OverlayPosition, string> = {
    'top-left':   `top:${v};left:${v};`,
    'top-center': `top:${v};left:50%;transform:translateX(-50%);`,
    'top-right':  `top:${v};right:${v};`,
    'mid-left':   `top:50%;left:${v};transform:translateY(-50%);`,
    'mid-center': `top:50%;left:50%;transform:translate(-50%,-50%);`,
    'mid-right':  `top:50%;right:${v};transform:translateY(-50%);`,
    'bot-left':   `bottom:${v};left:${v};`,
    'bot-center': `bottom:${v};left:50%;transform:translateX(-50%);`,
    'bot-right':  `bottom:${v};right:${v};`,
  };
  return `position:absolute;${map[pos]}`;
}
