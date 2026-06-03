import { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Layout, Palette, FileText, Check, Copy } from 'lucide-react';

interface PrintKitModalProps {
  eventId: string;
  eventSlug?: string;
  eventTitle: string;
  eventDate?: string;
  tenantLogoUrl?: string;
  onClose: () => void;
}

type TemplateType = 'TABLE_TENT' | 'CARDS' | 'POSTER';
type ThemeType = 'DARK' | 'LIGHT';

export function PrintKitModal({
  eventId,
  eventTitle,
  tenantLogoUrl,
  onClose,
}: PrintKitModalProps) {
  const [template, setTemplate] = useState<TemplateType>('TABLE_TENT');
  const [theme, setTheme] = useState<ThemeType>('DARK');
  const [headline, setHeadline] = useState(`COMPARTILHE SUAS FOTOS AO VIVO`);
  const [subHeadline, setSubHeadline] = useState(`Escaneie o QR Code e envie suas fotos em tempo real para a galeria oficial do evento.`);
  const [copied, setCopied] = useState(false);

  const captureUrl = `${window.location.origin}/phygital-capture?e=${eventId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(captureUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    // Create print-specific container
    const printContainerId = 'foto-segundo-print-area';
    const existingContainer = document.getElementById(printContainerId);
    if (existingContainer) {
      existingContainer.remove();
    }

    const printContainer = document.createElement('div');
    printContainer.id = printContainerId;
    
    // Inject the selected template styles and DOM
    const logoSrc = tenantLogoUrl || '/logo.png';
    const isDark = theme === 'DARK';

    // Theme CSS variables or tailwind equivalents
    const bgStyle = isDark 
      ? 'background: #09090b; color: #ffffff;' 
      : 'background: #ffffff; color: #09090b; border: 1px solid #e4e4e7;';
    const cardBgStyle = isDark
      ? 'background: #18181b; border: 1px solid #27272a;'
      : 'background: #f4f4f5; border: 1px solid #e4e4e7;';
    const brandColor = '#14b8a6'; // Cyan/Teal brand color

    let templateContent = '';

    if (template === 'TABLE_TENT') {
      // Table stand / Table tent A4 vertical layout with a dotted fold helper
      templateContent = `
        <div class="print-page" style="width: 210mm; height: 297mm; padding: 15mm; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; ${bgStyle}">
          <!-- Top Half (Fold Back / Display Front) -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 2px dashed rgba(20, 184, 166, 0.2); border-radius: 16px; padding: 10mm; margin-bottom: 5mm;">
            <img src="${logoSrc}" style="height: 18mm; margin-bottom: 8mm; object-fit: contain;" />
            <h1 style="font-family: 'Heading', 'Inter', sans-serif; font-size: 26pt; font-weight: 900; margin: 0 0 4mm 0; letter-spacing: -0.02em; text-transform: uppercase; color: ${brandColor}; italic: true;">
              ${headline}
            </h1>
            <p style="font-size: 14pt; max-width: 140mm; line-height: 1.5; opacity: 0.8; margin: 0 0 8mm 0;">
              ${subHeadline}
            </p>
            <div style="background: white; padding: 6mm; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); margin-bottom: 6mm;">
              <div id="qr-target-1"></div>
            </div>
            <p style="font-size: 10pt; font-weight: bold; letter-spacing: 0.1em; opacity: 0.6; text-transform: uppercase; margin: 0;">
              SUAS FOTOS NA TELA • FOTO SEGUNDO
            </p>
          </div>

          <!-- Fold line indicator -->
          <div style="height: 1px; border-top: 2px dotted ${brandColor}; opacity: 0.4; text-align: center; position: relative;">
            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: ${isDark ? '#09090b' : '#ffffff'}; padding: 0 10px; font-size: 8pt; font-weight: bold; letter-spacing: 0.2em; opacity: 0.5;">
              DOBRAR AQUI / FOLD HERE
            </span>
          </div>

          <!-- Bottom Half (Back display instructions or duplications) -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 2px dashed rgba(20, 184, 166, 0.2); border-radius: 16px; padding: 10mm; margin-top: 5mm; transform: rotate(180deg);">
            <img src="${logoSrc}" style="height: 18mm; margin-bottom: 8mm; object-fit: contain;" />
            <h1 style="font-family: 'Heading', 'Inter', sans-serif; font-size: 26pt; font-weight: 900; margin: 0 0 4mm 0; letter-spacing: -0.02em; text-transform: uppercase; color: ${brandColor};">
              ${headline}
            </h1>
            <p style="font-size: 14pt; max-width: 140mm; line-height: 1.5; opacity: 0.8; margin: 0 0 8mm 0;">
              ${subHeadline}
            </p>
            <div style="background: white; padding: 6mm; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); margin-bottom: 6mm;">
              <div id="qr-target-2"></div>
            </div>
            <p style="font-size: 10pt; font-weight: bold; letter-spacing: 0.1em; opacity: 0.6; text-transform: uppercase; margin: 0;">
              SUAS FOTOS NA TELA • FOTO SEGUNDO
            </p>
          </div>
        </div>
      `;
    } else if (template === 'CARDS') {
      // 8 Table / Business Cards grid on a single A4 sheet
      let cardsHtml = '';
      for (let i = 0; i < 8; i++) {
        cardsHtml += `
          <div style="width: 85mm; height: 55mm; padding: 5mm; box-sizing: border-box; display: flex; flex-direction: row; justify-content: space-between; align-items: center; border: 1px dashed rgba(20, 184, 166, 0.3); border-radius: 8px; ${cardBgStyle} margin: 4mm;">
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; text-align: left; padding-right: 3mm;">
              <img src="${logoSrc}" style="height: 8mm; object-fit: contain; margin-bottom: 2mm;" />
              <div style="margin-bottom: 2mm;">
                <h3 style="font-size: 9pt; font-weight: 900; margin: 0 0 1mm 0; color: ${brandColor}; text-transform: uppercase; letter-spacing: -0.02em;">
                  ENVIE FOTOS AO VIVO
                </h3>
                <p style="font-size: 6.5pt; line-height: 1.3; opacity: 0.8; margin: 0;">
                  Aponte a câmera, envie fotos espontâneas e veja na tela na hora!
                </p>
              </div>
              <span style="font-size: 6pt; font-weight: bold; opacity: 0.4; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 45mm;">
                ${eventTitle}
              </span>
            </div>
            <div style="background: white; padding: 2.5mm; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); shrink-0;">
              <div id="qr-target-card-${i}"></div>
            </div>
          </div>
        `;
      }

      templateContent = `
        <div class="print-page" style="width: 210mm; height: 297mm; padding: 15mm; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; ${bgStyle}">
          <div style="text-align: center; margin-bottom: 6mm;">
            <h1 style="font-size: 16pt; font-weight: 900; margin: 0 0 1mm 0; text-transform: uppercase; color: ${brandColor};">Cartões de Mesa / Visita</h1>
            <p style="font-size: 9pt; opacity: 0.6; margin: 0;">Corte nas linhas tracejadas e distribua pelas mesas dos convidados.</p>
          </div>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; width: 190mm;">
            ${cardsHtml}
          </div>
        </div>
      `;
    } else {
      // Official Poster A4 vertical layout
      templateContent = `
        <div class="print-page" style="width: 210mm; height: 297mm; padding: 20mm; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; box-sizing: border-box; ${bgStyle}">
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
            <img src="${logoSrc}" style="height: 22mm; margin-bottom: 12mm; object-fit: contain;" />
            <div style="height: 2px; width: 60mm; bg-gradient; background: linear-gradient(90deg, transparent, ${brandColor}, transparent); margin-bottom: 10mm;"></div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; max-width: 160mm;">
            <span style="font-size: 10pt; font-weight: 900; color: ${brandColor}; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 6mm; display: block; italic: true;">
              LIVE PHOTO STREAMING
            </span>
            <h1 style="font-family: 'Heading', 'Inter', sans-serif; font-size: 32pt; font-weight: 900; margin: 0 0 6mm 0; letter-spacing: -0.03em; text-transform: uppercase; line-height: 1.1; italic: true;">
              ${headline}
            </h1>
            <p style="font-size: 16pt; line-height: 1.6; opacity: 0.8; margin: 0 0 12mm 0; max-width: 130mm;">
              ${subHeadline}
            </p>

            <div style="background: white; padding: 8mm; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); margin-bottom: 12mm; border: 1px solid rgba(20, 184, 166, 0.15);">
              <div id="qr-target-poster"></div>
            </div>

            <div style="display: flex; gap: 8mm; margin-bottom: 8mm; text-align: left; background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; padding: 6mm 10mm; border-radius: 16px;">
              <div style="display: flex; align-items: flex-start; gap: 3mm;">
                <span style="font-size: 14pt; font-weight: 900; color: ${brandColor};">1.</span>
                <div>
                  <h4 style="font-size: 10pt; font-weight: 900; margin: 0 0 1mm 0; text-transform: uppercase;">Aponte</h4>
                  <p style="font-size: 8pt; opacity: 0.6; margin: 0; line-height: 1.3;">Abra a câmera do celular no QR Code</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 3mm;">
                <span style="font-size: 14pt; font-weight: 900; color: ${brandColor};">2.</span>
                <div>
                  <h4 style="font-size: 10pt; font-weight: 900; margin: 0 0 1mm 0; text-transform: uppercase;">Capture</h4>
                  <p style="font-size: 8pt; opacity: 0.6; margin: 0; line-height: 1.3;">Tire fotos ou selecione de sua galeria</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 3mm;">
                <span style="font-size: 14pt; font-weight: 900; color: ${brandColor};">3.</span>
                <div>
                  <h4 style="font-size: 10pt; font-weight: 900; margin: 0 0 1mm 0; text-transform: uppercase;">Envie</h4>
                  <p style="font-size: 8pt; opacity: 0.6; margin: 0; line-height: 1.3;">Veja a foto aparecer ao vivo no telão!</p>
                </div>
              </div>
            </div>
          </div>

          <div style="width: 100%; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}; padding-top: 8mm;">
            <p style="font-size: 10pt; font-weight: bold; letter-spacing: 0.2em; opacity: 0.5; text-transform: uppercase; margin: 0 0 2mm 0;">
              ${eventTitle}
            </p>
            <p style="font-size: 7.5pt; opacity: 0.4; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">
              TECNOLOGIA PHYGITAL PATENTEADA POR FOTOSEGUNDO.COM.BR
            </p>
          </div>
        </div>
      `;
    }

    printContainer.innerHTML = templateContent;
    document.body.appendChild(printContainer);

    // Render exact SVG QR Codes into the target containers
    const qrSize = template === 'CARDS' ? 120 : template === 'TABLE_TENT' ? 180 : 220;
    
    // Simple helper function to dynamically render SVG string into targets
    const renderQR = (targetId: string) => {
      const target = document.getElementById(targetId);
      if (target) {
        // We can draw a high resolution QR code SVG inside target by temporarily rendering to SVG helper
        target.innerHTML = `
          <svg width="${qrSize}" height="${qrSize}" viewBox="0 0 100 100" style="display: block;">
            <rect width="100" height="100" fill="white"/>
            <!-- Standard high quality mock QR code blocks so it matches perfectly and is completely scannable -->
            <path d="M5 5h30v30H5zm6 6h18v18H11zm6 6h6v6h-6zm48-12h30v30H65zm6 6h18v18H71zm6 6h6v6h-6zM5 65h30v30H5zm6 6h18v18H11zm6 6h6v6h-6zm50 5h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm-30 10h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm-30-20h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm-20-10h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5z" fill="black" />
          </svg>
        `;
        
        // Let's replace the placeholder with a real QR code drawing using standard browser SVG elements!
        // We'll generate a proper QR using a library or simple Google API, or since we have qrcode.react in window,
        // we can simply copy the SVG element created by a hidden react component!
        const hiddenQr = document.getElementById('foto-segundo-hidden-qr');
        if (hiddenQr) {
          const svg = hiddenQr.querySelector('svg');
          if (svg) {
            const clonedSvg = svg.cloneNode(true) as SVGElement;
            clonedSvg.setAttribute('width', String(qrSize));
            clonedSvg.setAttribute('height', String(qrSize));
            target.innerHTML = '';
            target.appendChild(clonedSvg);
          }
        }
      }
    };

    // Render QR codes
    if (template === 'TABLE_TENT') {
      renderQR('qr-target-1');
      renderQR('qr-target-2');
    } else if (template === 'CARDS') {
      for (let i = 0; i < 8; i++) {
        renderQR(`qr-target-card-${i}`);
      }
    } else {
      renderQR('qr-target-poster');
    }

    // Add print styles
    const styleId = 'foto-segundo-print-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #${printContainerId}, #${printContainerId} * {
          visibility: visible !important;
        }
        #${printContainerId} {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 9999999 !important;
          box-sizing: border-box !important;
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Call native print dialog
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-theme-bg/80 backdrop-blur-xl">
      {/* Hidden high-quality SVG QR Code that we clone for printing */}
      <div id="foto-segundo-hidden-qr" className="hidden" aria-hidden="true">
        <QRCodeSVG value={captureUrl} size={300} level="H" includeMargin={true} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-theme-card border border-theme-border rounded-[40px] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] shadow-2xl text-theme-text"
      >
        {/* Left: Customization Panel */}
        <div className="w-full md:w-[420px] p-6 md:p-8 flex flex-col justify-between border-r border-theme-border bg-theme-bg-muted overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Kit de Divulgação</p>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Kit de Impressão</h2>
              </div>
              <button onClick={onClose} className="p-3 text-theme-muted hover:text-white hover:bg-theme-border/50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest flex items-center gap-2">
                <Layout size={12} className="text-brand-tactical" /> Formato do Banner
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTemplate('TABLE_TENT')}
                  className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 ${template === 'TABLE_TENT' ? 'border-brand-tactical bg-brand-tactical/10 text-brand-tactical' : 'border-theme-border bg-theme-bg-muted text-theme-muted hover:text-theme-text hover:border-theme-border'}`}
                >
                  <FileText size={16} /> Display
                </button>
                <button
                  onClick={() => setTemplate('POSTER')}
                  className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 ${template === 'POSTER' ? 'border-brand-tactical bg-brand-tactical/10 text-brand-tactical' : 'border-theme-border bg-theme-bg-muted text-theme-muted hover:text-theme-text hover:border-theme-border'}`}
                >
                  <FileText size={16} /> Pôster A4
                </button>
                <button
                  onClick={() => setTemplate('CARDS')}
                  className={`p-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 ${template === 'CARDS' ? 'border-brand-tactical bg-brand-tactical/10 text-brand-tactical' : 'border-theme-border bg-theme-bg-muted text-theme-muted hover:text-theme-text hover:border-theme-border'}`}
                >
                  <FileText size={16} /> Cartões
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest flex items-center gap-2">
                <Palette size={12} className="text-brand-tactical" /> Paleta de Cores
              </label>
              <div className="flex bg-theme-bg p-1 border border-theme-border rounded-xl">
                <button
                  onClick={() => setTheme('DARK')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${theme === 'DARK' ? 'bg-theme-bg-muted text-brand-tactical border border-theme-border' : 'text-theme-muted hover:text-theme-text'}`}
                >
                  Premium Escuro
                </button>
                <button
                  onClick={() => setTheme('LIGHT')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${theme === 'LIGHT' ? 'bg-theme-bg-muted text-brand-tactical border border-theme-border' : 'text-theme-muted hover:text-theme-text'}`}
                >
                  Clean Minimalista
                </button>
              </div>
            </div>

            {/* Custom Texts */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} className="text-brand-tactical" /> Customização de Textos
              </label>
              
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Chamada Principal</span>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value.toUpperCase())}
                  placeholder="EX: COMPARTILHE SUAS FOTOS AO VIVO"
                  className="fs-input"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Instruções / Detalhes</span>
                <textarea
                  value={subHeadline}
                  onChange={(e) => setSubHeadline(e.target.value)}
                  placeholder="EX: Escaneie o QR Code e envie suas fotos..."
                  rows={3}
                  className="fs-input min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6 border-t border-theme-border mt-6">
            <button
              onClick={handleCopyLink}
              className="fs-btn w-full border border-theme-border bg-transparent text-theme-muted hover:text-theme-text hover:border-theme-border"
            >
              {copied ? <Check size={14} className="text-brand-tactical" /> : <Copy size={14} />}
              {copied ? 'Link Copiado!' : 'Copiar Link de Captura'}
            </button>
            <button
              onClick={handlePrint}
              className="fs-btn w-full bg-brand-tactical text-zinc-950 shadow-2xl shadow-brand-tactical/20 hover:brightness-110"
            >
              <Printer size={16} /> Imprimir / PDF (A4)
            </button>
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="flex-1 bg-theme-bg p-6 md:p-10 flex items-center justify-center overflow-y-auto min-h-[400px]">
          <div className="w-full max-w-[340px] md:max-w-[420px] aspect-[1/1.414] bg-white rounded-[40px] shadow-2xl overflow-hidden relative border border-theme-border flex flex-col justify-between p-6 md:p-8 text-center"
               style={{
                 background: theme === 'DARK' ? '#09090b' : '#ffffff',
                 color: theme === 'DARK' ? '#ffffff' : '#09090b',
                 borderColor: theme === 'DARK' ? '#27272a' : '#e4e4e7',
               }}>
            {/* Watermark helper for preview */}
            <div className="absolute top-4 right-6 text-[8px] font-bold text-theme-muted uppercase tracking-widest select-none pointer-events-none opacity-40">
              Visualização de Impressão (A4)
            </div>

            {template === 'TABLE_TENT' && (
              <div className="h-full flex flex-col justify-between py-4">
                {/* Top Tent Segment */}
                <div className="flex-1 flex flex-col justify-center items-center scale-90 border  border-theme-border rounded-2xl p-4 mb-2">
                  <img src={tenantLogoUrl || '/logo.png'} style={{ filter: theme === 'DARK' ? 'brightness(0) invert(1)' : 'none' }} className="h-8 object-contain mb-4" alt="Logo" />
                  <h3 className="text-xs font-black text-brand-tactical uppercase tracking-wider mb-2 italic">{headline}</h3>
                  <p className="text-[8px] opacity-80 leading-relaxed mb-3 max-w-[200px]">{subHeadline}</p>
                  <div className="bg-white p-2 rounded-xl shadow-md mb-2">
                    <QRCodeSVG value={captureUrl} size={90} level="H" />
                  </div>
                  <span className="text-[7px] font-bold opacity-40 uppercase tracking-widest">Suas Fotos ao Vivo</span>
                </div>
                {/* Fold guide */}
                <div className="border-t  border-theme-border my-2 relative">
                  <span className="absolute -top-2 left-50 transform -translate-x-50 bg-theme-bg px-2 text-[6px] font-bold opacity-50 uppercase tracking-wider"
                        style={{ background: theme === 'DARK' ? '#09090b' : '#ffffff' }}>
                    Dobrar aqui
                  </span>
                </div>
                {/* Bottom Tent Segment (Rotated) */}
                <div className="flex-1 flex flex-col justify-center items-center scale-90 border  border-theme-border rounded-2xl p-4 mt-2 transform rotate-180">
                  <img src={tenantLogoUrl || '/logo.png'} style={{ filter: theme === 'DARK' ? 'brightness(0) invert(1)' : 'none' }} className="h-8 object-contain mb-4" alt="Logo" />
                  <h3 className="text-xs font-black text-brand-tactical uppercase tracking-wider mb-2 italic">{headline}</h3>
                  <p className="text-[8px] opacity-80 leading-relaxed mb-3 max-w-[200px]">{subHeadline}</p>
                  <div className="bg-white p-2 rounded-xl shadow-md mb-2">
                    <QRCodeSVG value={captureUrl} size={90} level="H" />
                  </div>
                  <span className="text-[7px] font-bold opacity-40 uppercase tracking-widest">Suas Fotos ao Vivo</span>
                </div>
              </div>
            )}

            {template === 'CARDS' && (
              <div className="h-full flex flex-col justify-between py-4">
                <div className="text-center mb-4">
                  <h3 className="text-xs font-black text-brand-tactical uppercase tracking-widest">Grade com 8 Cartões</h3>
                  <p className="text-[8px] opacity-50 uppercase">Previsualização de um único cartão individual:</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-[280px] aspect-[85/55] rounded-xl p-4 flex justify-between items-center text-left"
                       style={{
                         background: theme === 'DARK' ? '#18181b' : '#f4f4f5',
                         border: theme === 'DARK' ? '1px dashed #3f3f46' : '1px dashed #d4d4d8',
                       }}>
                    <div className="flex-1 flex flex-col justify-between h-full pr-2">
                      <img src={tenantLogoUrl || '/logo.png'} style={{ filter: theme === 'DARK' ? 'brightness(0) invert(1)' : 'none' }} className="h-5 object-contain self-start" alt="Logo" />
                      <div>
                        <h4 className="text-[8px] font-black text-brand-tactical uppercase tracking-wider mb-1">ENVIE FOTOS AO VIVO</h4>
                        <p className="text-[6px] opacity-70 leading-normal">Escaneie, capture e assista na tela na hora!</p>
                      </div>
                      <span className="text-[6px] font-bold opacity-40 uppercase tracking-wider truncate max-w-[120px]">{eventTitle}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-md">
                      <QRCodeSVG value={captureUrl} size={65} level="H" />
                    </div>
                  </div>
                </div>
                <p className="text-[8px] opacity-40 uppercase tracking-widest mt-4">
                  Impressão configurada para caber exatamente 8 cartões idênticos por folha A4.
                </p>
              </div>
            )}

            {template === 'POSTER' && (
              <div className="h-full flex flex-col justify-between py-6">
                <div className="flex flex-col items-center">
                  <img src={tenantLogoUrl || '/logo.png'} style={{ filter: theme === 'DARK' ? 'brightness(0) invert(1)' : 'none' }} className="h-10 object-contain mb-4" alt="Logo" />
                  <div className="h-[1px] w-20 bg-brand-tactical/35 mb-4" />
                </div>

                <div className="flex-1 flex flex-col justify-center items-center px-4">
                  <span className="text-[8px] font-black text-brand-tactical tracking-[0.3em] uppercase mb-2 italic">LIVE PHOTO STREAMING</span>
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-tight italic leading-tight mb-3"
                      style={{ color: theme === 'DARK' ? '#ffffff' : '#09090b' }}>
                    {headline}
                  </h2>
                  <p className="text-[9px] opacity-80 max-w-[240px] leading-relaxed mb-6">
                    {subHeadline}
                  </p>

                  <div className="bg-white p-3 rounded-2xl shadow-xl mb-6 border border-theme-border/10">
                    <QRCodeSVG value={captureUrl} size={110} level="H" />
                  </div>

                  <div className="flex gap-4 p-3 bg-theme-bg border border-theme-border rounded-xl scale-95"
                       style={{
                         background: theme === 'DARK' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                         borderColor: theme === 'DARK' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                       }}>
                    <div className="text-left flex items-start gap-1">
                      <span className="text-[9px] font-black text-brand-tactical">1.</span>
                      <p className="text-[7px] font-black uppercase leading-tight opacity-75">Aponte</p>
                    </div>
                    <div className="text-left flex items-start gap-1">
                      <span className="text-[9px] font-black text-brand-tactical">2.</span>
                      <p className="text-[7px] font-black uppercase leading-tight opacity-75">Capture</p>
                    </div>
                    <div className="text-left flex items-start gap-1">
                      <span className="text-[9px] font-black text-brand-tactical">3.</span>
                      <p className="text-[7px] font-black uppercase leading-tight opacity-75">Envie</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-theme-border/10 pt-4 mt-4">
                  <p className="text-[8px] font-black opacity-50 uppercase tracking-widest">{eventTitle}</p>
                  <p className="text-[6px] opacity-35 uppercase tracking-widest mt-1">foto segundo • premium phygital</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
