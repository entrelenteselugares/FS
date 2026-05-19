# 📚 Índice Geral de Manuais de Usuário - Foto Segundo

Abaixo estão listados todos os manuais oficiais da plataforma, elaborados sob os pilares da usabilidade de cada perfil e gerados após uma rigorosa bateria de testes ponta-a-ponta (E2E) simulando o uso real nos fluxos críticos.

## 🔗 Manuais Disponíveis

* [Manual do Cliente (Dono da Festa)](./MANUAL-CLIENTE.md)
* [Manual do Convidado](./MANUAL-CONVIDADO.md)
* [Manual do Fotógrafo / Captador](./MANUAL-FOTOGRAFO.md)
* [Manual do Parceiro Institucional (Cartório)](./MANUAL-CARTORIO.md)
* [Manual do Administrador (Matriz)](./MANUAL-ADMIN.md)

---

## 🚦 Relatório de Testes E2E (Fluxos Críticos)

| Perfil | Jornada Simulada (Fluxo Testado) | Status | Observação Técnica |
|---|---|---|---|
| **Cliente** | Cadastro → Vault → Materializar → Checkout PIX | ✅ **Passou** | O fluxo de pagamento e desbloqueio do cofre funcionou via Webhook mockado perfeitamente. |
| **Convidado** | Acesso via Link → Compressão Client-Side → Votação | ⚠️ **Passou com ressalva** | Foi detectada a ausência de um Toast estilizado. O sistema usa `alert()` nativo do navegador para informar o usuário sobre falhas por excesso de peso (>4.5MB). Registrado como débito visual. |
| **Fotógrafo** | Kanban de Leads → Flash Event → Entrega URL → Wallet | ✅ **Passou** | A injeção da URL de terceiros (Lightroom) liberou automaticamente a visualização pro cliente; saldo refletiu na carteira. |
| **Cartório** | Login B2B → Tabela de Preços Ativa → Visualização de Split | ✅ **Passou** | Repasse da taxa passiva calculado corretamente usando base dinâmica, provando a robustez da *residual claimant* da Matriz. |
| **Admin** | CRUD de Eventos → Teste de Soft Delete → Ledger | ✅ **Passou** | A integridade referencial `Restrict` lançou exceção na tentativa de Hard Delete em evento pago. Deleção estrita impedida com sucesso. |
