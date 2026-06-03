const fs = require('fs');
let code = fs.readFileSync('src/pages/ClienteArea.tsx', 'utf-8');

// 1. Update PedidoDetalhe usage in Drawer
code = code.replace(
  /onChangePrivacy=\{\(\) => setIsPrivacyModalOpen\(true\)\}\n\s*onRefresh=\{fetchPedidos\}\n\s*\/>/g,
  'onChangePrivacy={() => setIsPrivacyModalOpen(true)}\n          onRefresh={fetchPedidos}\n          isPrimaryClient={!!user && (selected.event.ownerId === user.id || (!!selected.event.clientEmail && user.email === selected.event.clientEmail))}\n        />'
);

// 2. Update AccessTypeModal usage
code = code.replace(
  /eventTitle=\{selected\.event\.title\}\n\s*onConfirmed=\{async \(\) => \{/g,
  'eventTitle={selected.event.title}\n        isPrimaryClient={!!user && (selected.event.ownerId === user.id || (!!selected.event.clientEmail && user.email === selected.event.clientEmail))}\n        onConfirmed={async () => {'
);

// 3. Update PedidoDetalhe definition
code = code.replace(
  /function PedidoDetalhe\(\{\s*pedido,\s*loading,\s*onGoToEvent,\s*onChangePrivacy,\s*onRefresh\s*\}\s*:\s*\{[\s\S]*?onRefresh:\s*\(\)\s*=>\s*void;\s*\}\)\s*\{/g,
  'function PedidoDetalhe({ pedido, loading, onGoToEvent, onChangePrivacy, onRefresh, isPrimaryClient }: {\n  pedido: Pedido;\n  loading: boolean;\n  onGoToEvent: () => void;\n  onChangePrivacy: () => void;\n  onRefresh: () => void;\n  isPrimaryClient?: boolean;\n}) {'
);

// 4. Update the Privacy button rendering
code = code.replace(
  /<button onClick=\{onChangePrivacy\} disabled=\{\!pedido\.hasPaid\} className=\"w-full md:w-auto px-6 py-2\.5 bg-white\/5 hover:bg-white\/10 border border-white\/10 rounded-lg text-\[10px\] font-black uppercase tracking-widest text-theme-text transition-colors disabled:opacity-50\">Privacidade<\/button>/g,
  '{isPrimaryClient && (\n                 <button onClick={onChangePrivacy} disabled={!pedido.hasPaid} className=\"w-full md:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-theme-text transition-colors disabled:opacity-50\">Privacidade</button>\n               )}'
);

// 5. Update the MediaActionCards checking logic
const oldGrid = /<div className=\"flex flex-col gap-3\">\s*\{pedido\.event\.temFoto && <MediaActionCard[\s\S]*?<\/div>\s*\)\s*\}/g;

const newGrid = `<div className="flex flex-col gap-3">
              {(() => {
                const isFull = pedido.event.type === 'ALBUM_FULL' || pedido.manualType === 'COFRE';
                const hasDigital = isFull || (pedido.items && pedido.items.length > 0);
                const hasVideo = isFull ? pedido.event.temVideo : !!pedido.manualType?.toLowerCase().includes('vídeo');
                const hasPrinted = isFull ? pedido.event.temFotoImpressa : (pedido.items && pedido.items.some(i => i.printProductId)) || !!pedido.manualType?.toLowerCase().includes('impressa');

                return (
                  <>
                    {hasDigital && <MediaActionCard icon={<Camera size={20} />} title="Fotografia Digital" subtitle="Galeria de Fotos do Evento" url="/meus-albuns" actionText="Acessar Álbum" />}
                    {isFull && pedido.event.temFotoEditada && <MediaActionCard icon={<Sparkles size={20} />} title="Fotos Editadas" subtitle="Galeria Premium Editada" url="/meus-albuns" actionText="Acessar Álbum" />}
                    {hasVideo && <MediaActionCard icon={<Play size={20} />} title="Vídeo de Cinema" subtitle="Filme Completo do Evento" url={pedido.event.driveUrl} actionText="Assistir Vídeo" />}
                    {isFull && pedido.event.temVideoEditado && <MediaActionCard icon={<Zap size={20} />} title="Vídeo Premium" subtitle="Corte Especial e Edição" url={pedido.event.driveUrl} actionText="Assistir Vídeo" />}
                    {hasPrinted && <MediaActionCard icon={<Printer size={20} />} title="Fotos Impressas" subtitle="Fotos Reveladas Premium" actionText="Em Produção" disabled />}
                  </>
                );
              })()}
            </div>
          )}`;

code = code.replace(oldGrid, newGrid);

fs.writeFileSync('src/pages/ClienteArea.tsx', code);
console.log('ClienteArea updated');
