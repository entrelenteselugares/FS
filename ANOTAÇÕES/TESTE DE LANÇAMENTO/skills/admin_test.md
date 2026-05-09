# Skill: Teste de Lançamento - ADMINISTRADOR (ADMIN)

Esta skill define o protocolo de validação para o perfil de Administrador Master da plataforma Foto Segundo.

## Descrição

Validação completa do centro de comando, auditoria financeira e integridade do catálogo de produtos.

## Requisitos de Verificação (UAT)

1. **Login & Segurança:** Acesso restrito via JWT e middleware `requireRole("ADMIN")`.
2. **Dashboard de Pedidos:** Visualização correta de todos os pedidos da rede, incluindo filtragem por status.
3. **Módulo Financeiro:** Capacidade de liquidar repasses para parceiros e verificar conciliação bancária.
4. **Catálogo de Impressão:** Edição de preços, margens e status (Ativo/Inativo) de produtos físicos.
5. **Gestão de Usuários:** Capacidade de visualizar e editar perfis de profissionais e unidades.

## Instruções de Execução

1. Acesse `/login` e autentique-se com uma conta de nível ADMIN.
2. Navegue até `/admin` e verifique se os KPIs de faturamento estão sendo carregados.
3. Acesse a aba de Pedidos e tente filtrar por um pedido específico.
4. Tente alterar a margem de um produto no catálogo e verifique se o valor final é recalculado.
5. Verifique se o middleware de segurança bloqueia o acesso a rotas admin se o usuário for deslogado.
