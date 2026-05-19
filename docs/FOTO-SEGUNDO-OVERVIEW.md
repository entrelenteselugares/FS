# Documentação Estratégica e Técnica - Foto Segundo

Este documento foi gerado para fornecer um panorama arquitetural, estrutural e de negócios da plataforma Foto Segundo. O objetivo é permitir que engenheiros de software, IAs de análise (como o Claude) e stakeholders entendam a complexidade, os fluxos e o momento atual da aplicação.

---

## 1. Arquitetura Técnica

A plataforma opera com uma stack baseada em TypeScript de ponta a ponta, dividida tradicionalmente em Frontend (PWA) e Backend (API REST).

### Stack Completa

* **Frontend**: React.js com Vite, escrito em TypeScript.
  * **Estilização**: TailwindCSS + Componentes customizados (Design System tático), focando muito na responsividade e experiência *mobile-first*.
  * **Animações**: Framer Motion para transições fluidas e micro-interações.
  * **PWA**: Configurado com manifest e service workers para experiência *app-like* (instalação via navegador, navegação por Bottom Navigation).
* **Backend**: Node.js com Express e TypeScript.
  * **Arquitetura**: MVC-like com Controllers (`event.controller.ts`, etc.), Routes, Services e Libs.
* **Banco de Dados**: PostgreSQL gerenciado via **Prisma ORM**.
* **Hospedagem e CI/CD**: Deploy contínuo na Vercel (Frontend e Serverless API).
* **Serviços Terceiros e Integrações**:
  * **Armazenamento/Entrega de Mídia**: Adobe Lightroom (fotos) e Google Drive (vídeos brutais). O sistema atua como um *paywall* e gerenciador de acessos sobre estes links.
  * **Comunicações**: Notificações in-app e push, arquitetura desenhada para integração com WhatsApp (máquina de leads/vendas) e e-mail.
  * **Pagamentos**: Fluxo de carrinho (Cart) e checkout focado em PIX, com capacidade para Webhooks de confirmação.

### Fluxo de Dados e Pontos de Escalabilidade

1. **Frontend -> Backend**: A API é acessada de maneira *stateless* com tokens JWT (Bearer). O PWA cuida do cache local (sessionStorage, LocalStorage e Context API) para evitar requisições desnecessárias.
2. **Segurança/Paywall**: O core do backend atua bloqueando (HTTP 401/403) ou mascarando os links finais de mídias caso o cliente não tenha um "Order" com status `APROVADO`.
3. **Gargalos Potenciais**:
    * Sincronização assíncrona profunda para fotos unitárias (Marketplace) caso existam eventos com milhares de visitantes acessando simultaneamente.
    * Limite de execução de *Serverless Functions* na Vercel se processos longos (como geração de relatórios financeiros ou processamento de imagens) não forem convertidos em rotas Edge ou Workers de background.

---

## 2. Modelo de Dados (Schema)

A lógica central no Prisma roda ao redor de três pilares: **Usuários, Eventos e Pedidos.**

### Entidades e Relacionamentos Principais

* **User**: Possui um sistema de *Role-based Access Control (RBAC)*. Os papéis (roles) definem os painéis que o usuário acessa no PWA: `CLIENTE`, `ADMIN`, `CAPTACAO` (fotógrafo), `EDICAO`, `CARTORIO` (ponto parceiro/franqueado).
* **Event**: Entidade hiper-flexível. Pode ser:
  * `ALBUM_FULL`: Evento particular e fechado (Casamento, Aniversário).
  * `PHOTO_MARKETPLACE` / `FOTO_POINT` / `FLASH_EVENT`: Modelos onde várias pessoas podem entrar em uma vitrine e comprar fotos soltas (corridas, baladas, pontos turísticos).
  * *Relacionamentos*: Pertence a um cliente principal, tem N responsáveis (captador, editor), tem N mídias, e pode estar amarrado a um `CartorioUser` (Unidade Fixa geradora de leads).
* **Order & OrderItem**: Centralizam a conversão. Um pedido tem `status` (PENDENTE, PAGO, APROVADO, CANCELADO) e é composto por sub-itens (fotos específicas, álbuns completos ou prints phygitais). O acesso é destrancado pelo status.
* **Finance (Ledger)**: Tabelas como `FinanceTransaction` ou `Wallet` para mapear extratos de quanto a plataforma deve pagar para cada fotógrafo e qual é a comissão retida.

### Regras de Negócio Implementadas no BD

* **Proteção de Integridade Financeira (Soft Delete)**: O sistema é imune à deleção acidental e quebra de relatórios contábeis. Exclusões de `Event` e `User` possuem *guards* que bloqueiam o *Hard Delete* caso possuam transações pagas, ativando automaticamente o modo *Soft Delete* (ex: `active: false`). O mesmo se aplica a pedidos com estorno (coluna `deletedAt`), que preservam o *Ledger* intacto para todos os *splits* envolvidos.
* **Exclusividade Temporária (Booking)**: `CalendarSlot` trava horários de fotógrafos para evitar *overbooking*.
* **Cascata de Acesso**: Um usuário herda permissão a um evento se ele é o "Owner" (Admin/Fotógrafo/Cartório), se fez um pedido PAGO daquele evento, ou se possui um `guestToken` atrelado a um pedido VIP pago.

---

## 3. Fluxos de Produto

### Jornada do Cliente Final

1. **Vitrine/Descoberta**: O cliente entra no PWA (`/`) via tráfego orgânico ou QR Code físico no local do evento.
2. **Cadastro / Solicitação**:
    * *Se Evento Privado*: Preenche um funil de orçamento. O backend cria um Lead e já tenta localizar a agenda livre de fotógrafos.
    * *Se Evento Marketplace*: Busca seu rosto ou evento pelo filtro de cidades/datas.
3. **Checkout**: Adiciona produtos ao carrinho (álbum, fotos avulsas, reels) e prossegue para pagamento seguro.
4. **Desbloqueio (Materialização)**: Assim que o webhook do gateway (ou admin) aprova o pedido, o *Paywall* é derrubado. O cliente acessa seu Dashboard (`/minha-conta`) e pode clicar no link "Acessar Álbum" que o redirecionará nativamente para o álbum Lightroom protegido daquele evento.

### Jornada C2C (Cofres Colaborativos / Vaults)

A plataforma possui nativamente uma feature avançada de álbuns colaborativos (C2C) que permite que usuários criem cofres privados e convidem amigos.

1. **Criação e Convite**: O usuário "Owner" cria um Álbum/Cofre (Vault) na sua área de cliente. Ele pode gerar um link de convite que é enviado pelo WhatsApp para a rede de amigos.
2. **Onboarding do Convidado**: O convidado acessa o link, se autentica e aceita o convite.
3. **Upload e Gamificação (Votos)**: Convidados fazem o upload direto de fotos da galeria do celular. As fotos são exibidas em tempo real no mural do álbum. Todos os membros do cofre podem "votar" (favoritar) nas melhores poses.
4. **Monetização e Assinatura**: O dono do álbum pode, a qualquer momento, "Materializar" o cofre, realizando um checkout pontual ou ativando uma Assinatura Premium. Se ativada, a plataforma cobra R$ 49,90/mês e imprime/entrega periodicamente (ex: 36 fotos) as mídias mais votadas pelos convidados.

### Jornada do Profissional (Fotógrafo / Captador)

1. **Kanban / Painel**: Acessa `/painel-profissional`, visualiza leads ou jobs atribuídos a ele.
2. **Operação (Flash Events)**: Se estiver em um ponto turístico, pode criar um "Foto Point" ou "Flash Event" na hora, gerando um link para o cliente comprar em tempo real.
3. **Entrega**: Sobe as fotos no Adobe Lightroom, copia a URL de compartilhamento, vai ao painel do Foto Segundo e cola no campo do evento.
4. **Financeiro**: Visualiza na sua *Wallet* dentro do app o saldo acumulado de eventos fechados.

### Fluxo de Parceiros (Cartórios / Unidades Fixas)

* Atuam como afiliados/franquias orgânicas. Têm seu painel `/painel-unidade`.
* O sistema vincula vendas feitas a partir dos eventos de sua base (ex: Noivos fechando no balcão do cartório). O Cartório possui tabelas de preços personalizadas e gera receita passiva via Split.

---

## 4. Modelo de Negócio

### Fontes de Receita

1. **Transacional / Direto**: Contratação pontual de cobertura fotográfica (orçamentos fechados B2C/B2B).
2. **Marketplace Unitário**: Venda micro-transacional de R$10 a R$30 por foto em coberturas coletivas (esportes, formaturas, praias).
3. **Print (Live Print)**: Venda de produtos físicos/instantâneos gerados e impressos nos pontos de evento.

### Split de Pagamento (Comissões)

* Ao fechar um pagamento de R$100,00, a lógica de Split do sistema distribui:
  * **X% Cartório / Parceiro Fixo** (Taxa de indicação/ponto).
  * **Y% Captador/Editor** (Remuneração do *gig economy*).
  * **Z% Plataforma** (Foto Segundo - Margem Bruta).

---

## 5. Status Atual

### O que está funcionando maravilhosamente em produção (Aprovado e Deployado)

* Interface do PWA mobile completíssima e dinâmica.
* Autenticação com persistência local.
* Rotas de Dashboard modulares e hierárquicas (Painel do Cliente vs Profissional vs Cartório).
* Geração e captação de Leads automáticos para Cartórios Parceiros com bloqueio de calendário.
* Filtragem de Vitrine Pública (buscas textuais e por Cidades com relacionamento transversal no DB recém refinado).
* Estrutura unificada e tipagem estrita no TypeScript (zero bugs críticos de compilação em Build).

### Débitos Técnicos e Riscos Conhecidos (Escalabilidade)

Para fins de transparência técnica, listamos três fragilidades arquiteturais assumidas conscientemente para permitir agilidade neste estágio da startup:

1. **Riscos de Infraestrutura (Vercel Serverless)**: Funções serverless têm timeout de 10s (Plano Free) a 60s (Pro). Processamento de webhooks pesados, upload C2C longo sem *chunking* ou processamento em *batch* de comissões podem sofrer *timeouts* em horários de pico.
2. **Storage Terceirizado e Dependência Externa**: O uso de Adobe Lightroom e Google Drive para abrigar a mídia e rodar por trás do nosso Paywall economiza custos iniciais, mas não garante auditoria de integridade do arquivo. É um débito que forçará migração futura para um S3/R2 nativo assim que o volume compensar o custo.
3. **Entrega Manual do Fotógrafo**: A dependência de um fotógrafo humano colar a URL do Lightroom após capturar o evento gera um *gap* (fricção) no fluxo logístico. Falta um SLA de rastreabilidade sistêmica que automatize essa cobrança operacional se o profissional esquecer de subir o material no tempo estipulado.

### Próximos Passos (Roadmap de Escala)

* Finalizar e validar as etapas de auditoria descritas no plano `AUDIT-PLAN.md` focado no lançamento prático.
* Automatizar conciliações e integrações diretas do Financeiro com o gateway.
* Escalabilidade de busca facial (IA biométrica) integrada diretamente ao Marketplace para substituir a dependência manual.
* Finalizar as integrações do `Printer Agent` (Impressão IOT local em eventos Flash).
