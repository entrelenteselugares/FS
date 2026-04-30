# Log de Atualizações - Produção (30/04/2026)

Este documento resume as atualizações críticas, correções de segurança e novas funcionalidades implementadas hoje para a plataforma Foto Segundo.

## ✅ O Que Foi Corrigido e Melhorado

### 1. Eternize no Papel (Loja de Impressões)

- **Novo Módulo Marketplace**: Lançamento da lojinha in-app para venda de álbuns, quadros e revelações.
- **Seleção do Álbum**: Clientes logados que são donos do evento agora podem escolher fotos diretamente da galeria para compor seus produtos físicos.
- **Upload Híbrido**: Suporte para upload de novas fotos combinado com seleção de fotos existentes.
- **Integração de Pagamento**: Endpoint `/api/orders/print` criado para converter seleções da loja em pedidos reais integrados ao checkout do Mercado Pago.

### 2. Segurança e Controle de Acesso

- **Fix Acesso Global**: Corrigida falha onde álbuns privados pagos globalmente retornavam erro 403 para visitantes. O sistema agora reconhece o pagamento aprovado como prioridade sobre a flag de privacidade.
- **UX de Links Externos**: Links para Adobe Share e Lightroom foram transformados em cards interativos premium, melhorando a taxa de clique e a apresentação visual.
- **Type Safety**: Auditoria completa de tipos no frontend para evitar falhas de renderização em tempo de execução.

### 3. Backend e Infraestrutura

- **Criação Dinâmica de Pedidos**: Novo motor de criação de pedidos de impressão com persistência de seleções de fotos em notas internas para a produção.
- **Resiliência Prisma**: Auditoria de queries para garantir performance em ambientes serverless.

---

## 🧪 Roteiro de Testes (O Que Validar Agora)

1. **Loja de Impressões**:
   - Acesse um álbum (como dono ou visitante).
   - Clique em "ETERNIZE NO PAPEL".
   - Verifique se o catálogo carrega corretamente e se a seleção de quantidade funciona.
   - Teste o upload de fotos e a seleção do álbum (se logado como dono).
   - Simule o fechamento via WhatsApp e via Checkout.

2. **Acesso Pago**:
   - Verifique se um álbum marcado como privado mas pago globalmente abre sem pedir login/senha para usuários anônimos.

3. **Responsividade**:
   - Verifique a visualização dos novos cards de "Destaques da Galeria" em dispositivos móveis.

---

**Status**: Plataforma Estabilizada e Loja de Impressões Operacional.
