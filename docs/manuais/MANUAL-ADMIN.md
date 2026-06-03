# Manual do Administrador (Matriz)

Controle total, segurança e supervisão da arquitetura do Foto Segundo.

## Fluxo: Operações Críticas de Suporte

1. **Gestão de Eventos:** Utilize a rota `/admin/events` para gerenciar, editar dados e auditar os eventos em andamento (CRUD).
   ![Passo 1](../../testes/admin/gestao-eventos/01-crud-eventos.png)
2. **Segurança de Deleção:** O sistema do banco de dados (Prisma) é configurado com a política "Restrict". Ele bloqueia fisicamente a exclusão (Hard Delete) de eventos que possuam transações pagas. Nesses casos, o botão muda automaticamente para Desativar Evento (Soft Delete via flag `active: false`).
   ![Passo 2](../../testes/admin/gestao-eventos/02-soft-delete.png)
3. **Aprovação Manual:** Caso o webhook do Mercado Pago falhe por erro de rede (Timeout), você pode acessar os detalhes do pedido no painel e forçar a "Aprovação Manual" para liberar o link do cofre para o cliente.
   ![Passo 3](../../testes/admin/gestao-eventos/03-aprovacao-manual.png)
4. **Ledger Financeiro:** Visualize o fluxo imutável na aba "Finanças". Lá estarão registrados todos os _splits_ estáticos (salvos em decimais, não em %) garantindo compliance nas prestações de contas entre os fotógrafos e a matriz.
   ![Passo 4](../../testes/admin/gestao-eventos/04-ledger.png)
