const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ClienteArea.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Find the start of the corruption: right before "Acesso Restrito" block 
// and replace everything from there to just before "function MediaActionCard"
const corruptStart = `) : (
  <div className="p-6 text-center border border-theme-border bg-brand-tactical/10 flex items-center justify-between gap-4">`;

const goodEnd = `\r\nfunction MediaActionCard`;

const idxStart = code.indexOf(corruptStart);
const idxEnd = code.indexOf(goodEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Could not find markers. idxStart:', idxStart, 'idxEnd:', idxEnd);
  process.exit(1);
}

const replacement = `) : (
  <div className="p-6 text-center border border-theme-border bg-brand-tactical/10 flex items-center justify-between gap-4">
  <div className="text-left space-y-1">
  <p className="text-[10px] font-black text-theme-text uppercase tracking-widest ">Acesso Restrito</p>
  <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest">Aguardando pagamento</p>
  </div>
  <button
  onClick={() => navigate(\`/checkout?orderId=\${pedido.id}\`)}
  className="px-6 py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all"
  >
  Pagar
  </button>
  </div>
  )}
  </div>

  {/* Bottom Actions */}
  <div className="pt-6 border-t border-theme-border flex flex-col gap-3">
    {pedido.items && pedido.items.length > 0 ? (
      <div className="grid grid-cols-4 gap-2 h-20 md:h-24">
        {pedido.items.slice(0, 3).map((item, idx) => (
          <div key={item.id || idx} className="h-full bg-theme-bg border border-theme-border rounded-lg overflow-hidden">
            {item.media?.url ? (
              <img src={item.media.url} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="Miniatura" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-theme-muted"><ImageIcon size={16} /></div>
            )}
          </div>
        ))}
        <button
          onClick={() => {
            const slug = pedido.event.slug?.startsWith('vault-') ? pedido.event.slug.replace('vault-', '') : pedido.event.id;
            navigate(\`/meus-albuns/\${slug}\`);
          }}
          className="h-full flex flex-col items-center justify-center gap-1 bg-brand-tactical/10 hover:bg-brand-tactical/20 border border-brand-tactical/30 rounded-lg text-brand-tactical transition-colors"
        >
          <ArrowRight size={16} />
          <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">Ver Álbum</span>
        </button>
      </div>
    ) : (
      <div className="flex gap-2">
        <button
          onClick={onGoToEvent}
          className="flex-1 py-3 border border-theme-border text-[9px] font-black uppercase tracking-[0.2em] text-theme-text hover:border-brand-tactical hover:text-brand-tactical transition-colors"
        >
          Acessar Mural
        </button>
        {(pedido.event.temFoto || pedido.event.temFotoEditada) && pedido.hasPaid && (
          <button
            onClick={() => {
              const slug = pedido.event.slug?.startsWith('vault-') ? pedido.event.slug.replace('vault-', '') : pedido.event.id;
              navigate(\`/meus-albuns/\${slug}\`);
            }}
            className="flex-1 py-3 bg-brand-tactical/10 border border-brand-tactical text-[9px] font-black uppercase tracking-[0.2em] text-brand-tactical hover:bg-brand-tactical hover:text-black transition-colors"
          >
            Acessar Álbum
          </button>
        )}
      </div>
    )}

    {isPrimaryClient && (
      <button
        onClick={onChangePrivacy}
        disabled={!pedido.hasPaid}
        className="w-full py-3 border border-theme-border text-[9px] font-black uppercase tracking-[0.2em] text-theme-text hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Privacidade
      </button>
    )}
  </div>
  </div>
  </div>
  );
}

`;

const before = code.substring(0, idxStart);
const after = code.substring(idxEnd);

const fixed = before + replacement + after;

// Backup original
fs.writeFileSync(filePath + '.bak', code, 'utf8');

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Done! Replaced chars', idxStart, 'to', idxEnd);
console.log('New length:', fixed.length, 'vs original:', code.length);
