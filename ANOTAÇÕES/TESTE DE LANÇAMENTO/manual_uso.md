# Manual de Uso da Plataforma — Foto Segundo

Este documento serve como o guia mestre para todos os usuários da rede Foto Segundo. Aqui detalhamos o fluxo operacional de cada perfil dentro da estética *Midnight Luxury*.

---

## 1. Perfil: ADMINISTRADOR (Master)
O Admin é o centro de comando global. Sua função é garantir a saúde da rede e a conformidade dos repasses.

### Processos Principais:
1. **Gestão de Pedidos:** Acompanhar a listagem global em `/admin`. Validar se os pedidos estão como `APROVADO`.
2. **Liquidação de Repasses:** No menu Financeiro, confirmar os pagamentos PIX para os parceiros (Captação, Edição, Unidade) e marcar como `LIQUIDADO`.
3. **Catálogo de Impressão:** Ajustar margens de lucro e ativar/desativar produtos físicos em `/admin/print-catalog`.
4. **Auditoria de Eventos:** Monitorar eventos ativos e garantir que a privacidade está configurada corretamente.

---

## 2. Perfil: PROFISSIONAL DA REDE (Fotógrafo)
O profissional é o motor de geração de conteúdo. Ele cria os eventos e sobe as fotos.

### Processos Principais:
1. **Criação de Eventos:** Definir se o evento é um "Flash Event" (entrega rápida via PIN) ou um evento tradicional.
2. **Upload de Mídia:** Subir fotos diretamente para o evento. O sistema aplica o carimbo de referência automaticamente.
3. **Gestão de Créditos:** Acompanhar o saldo de vendas e solicitar saques.
4. **Venda Expressa:** Utilizar o link do QR Code para oferecer fotos impressas na hora para os convidados.

---

## 3. Perfil: UNIDADE FIXA (Ponto Fixo)
A unidade fixa é o braço logístico local, responsável pela materialização física (impressão).

### Processos Principais:
1. **Monitor de Impressão:** Manter a tela `/unidade-fixa` aberta. Os pedidos aprovados aparecem na fila instantaneamente.
2. **Printer Agent:** Garantir que o agente de software esteja rodando no PC da unidade para pescar as fotos e enviar para a impressora física.
3. **Venda de Balcão:** Realizar vendas diretas para clientes que visitam o ponto físico usando o QR Code da unidade.

---

## 4. Perfil: FRANQUEADO (B2B Hub)
O franqueado gere uma região e múltiplos profissionais/unidades, focando na expansão.

### Processos Principais:
1. **Dashboard Regional:** Acompanhar o faturamento de todos os eventos da sua área.
2. **Suporte Tático:** Auxiliar profissionais na configuração de eventos complexos.
3. **Expansão:** Cadastrar novos profissionais sob sua árvore de hierarquia.

---

## 5. Perfil: CLIENTE PRIVADO (Consumidor)
O cliente é o usuário final que resgata e compra as fotos.

### Processos Principais:
1. **Resgate via PIN:** Na página do evento, inserir o código de 6 dígitos recebido no evento para visualizar sua foto.
2. **Checkout:** Escolher entre fotos digitais ou produtos físicos (álbuns, quadros) e realizar o pagamento via PIX/Cartão.
3. **Cofre de Memórias:** Manter uma assinatura ativa para receber fotos impressas em casa todo mês de forma automática.
4. **Votação:** Participar da curadoria de fotos nos cofres compartilhados com amigos e família.

---

**Nota Técnica:** Todas as operações seguem o protocolo de segurança JWT e são auditadas em tempo real pela Matriz.
