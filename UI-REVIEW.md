# UI REVIEW — Central de Impressão Phygital

**Data:** 2026-06-05  
**Escopo:** NativePrintLayout · PrintMonitor · FullMonitor  
**Commit base:** f885f64

---

## Pontuação Geral: 20/24

| Pilar             | Nota | Avaliação |
| ----------------- | ---- | --------- |
| Copywriting       | 4/4  | ✓         |
| Visuais           | 3/4  | ⚠         |
| Cor               | 4/4  | ✓         |
| Tipografia        | 4/4  | ✓         |
| Espaçamento       | 3/4  | ⚠         |
| Experience Design | 2/4  | ⚠         |

---

## Pilar 1 — Copywriting: 4/4 ✓

- Labels das opções são claros e em PT-BR: "Preencher", "Encaixar", "Retrato", "Paisagem"
- Status do logo do cliente: "Logo Adicionado ✓" / "+ Add Logo Cliente" — feedback visual imediato
- Timestamp no rodapé: `#CODE • 05/06/2026 13:17` — formato local correto
- Nome em ALL CAPS com tracking-wider garante legibilidade impressa

---

## Pilar 2 — Visuais: 3/4 ⚠

**✓ Pontos fortes:**

- Cards com bordas arredondadas (2mm) e sombra sutil — estética polaroid
- `object-fit: cover` por padrão elimina o problema das fotos com bordas brancas
- Logo no rodapé com fallback via `ui-avatars.com`

**⚠ Melhoria sugerida:**

- A `border: none` no `.fs-print-card` entra em conflito com `border border-gray-100` do Tailwind — nas impressões a borda não aparece pois a classe CSS scoped tem `border: none !important`. Corrigir aplicando a borda diretamente no CSS de impressão.

---

## Pilar 3 — Cor: 4/4 ✓

- Barra de configurações: `bg-zinc-950/50` com `border-theme-border` — coerente com o sistema de design
- Botões ativos: `bg-brand-tactical text-zinc-950` — contraste adequado
- Botão "+ Add Logo Cliente": `bg-brand-tactical/10 border-brand-tactical` — destaque sem gritar
- Background de impressão: `#ffffff !important` forçado em todos os elementos — zero surpresas na impressão

---

## Pilar 4 — Tipografia: 4/4 ✓

- Fonte de impressão: `'Inter', sans-serif` para nome, `'Courier New'` para código de referência
- Hierarquia clara: `8pt bold uppercase` (nome) > `6pt monospace` (código + timestamp)
- Labels da UI: `text-[10px] font-black uppercase tracking-widest` — padrão consistente com o sistema
- `letter-spacing: 0.12em` no código — melhora escaneabilidade em impressão física

---

## Pilar 5 — Espaçamento: 3/4 ⚠

**✓ Pontos fortes:**

- Gap de `4mm` entre cards na grade — correto para impressão A4
- Padding de `4mm` na página — margem mínima adequada
- Footer com `padding: 1.5mm 3mm` — compacto mas legível

**⚠ Melhoria sugerida:**

- Com 25 fotos por folha (Mini 5x5), o espaçamento de `4mm` de gap cria overflow. Recomendar reduzir para `2mm` dinamicamente quando `photosPerPage >= 12`.

---

## Pilar 6 — Experience Design: 2/4 ⚠

**✓ Pontos fortes:**

- Barra de configurações sempre visível com `print:hidden` — não interfere na impressão
- Feedback imediato ao trocar logo: `URL.createObjectURL` — sem necessidade de upload
- Botão "Full Screen" agora está corretamente posicionado na barra de configurações

**⚠ Melhorias sugeridas:**

1. **Não há preview antes de imprimir** — o usuário não sabe como vai sair a impressão sem abrir o diálogo do browser. Um preview inline (simulação visual da folha A4) antes do `window.print()` melhoraria muito a confiança.
2. **Estado dos toggles não persiste** — ao recarregar a página, logo/timestamp/fit voltam ao padrão. Usar `localStorage` para persistir as preferências do operador.
3. **Logo do cliente se perde ao navegar** — `clientLogoUrl` é `createObjectURL` efêmero. Ideal fazer upload para storage ou ao menos salvar no `sessionStorage`.

---

## Fixes Prioritários

1. **[ALTA]** Persistir preferências de impressão em `localStorage` (`photosPerPage`, `orientation`, `printFit`, `showLogo`, `showTimestamp`)
2. **[MÉDIA]** Gap dinâmico para 25 fotos: `gap: photosPerPage >= 12 ? '2mm' : '4mm'`
3. **[MÉDIA]** Preview inline da folha antes de imprimir
4. **[BAIXA]** Corrigir conflito `border: none` no `.fs-print-card` vs Tailwind

---

## Commits desta sessão

| Hash      | Descrição                                                    |
| --------- | ------------------------------------------------------------ |
| `a926fa4` | feat(print): layout premium com logo, timestamp, fit e grade |
| `da1c67c` | fix(print): botão full-screen posicionado corretamente       |
| `f885f64` | fix(print): import React para CSSProperties                  |
