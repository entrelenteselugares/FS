# 🛡️ PLANO DE AUDITORIA FINAL PRÉ-LANÇAMENTO (V1.0)

Este documento centraliza todas as verificações, testes e simulações de stress que devem ser executadas antes de abrirmos a plataforma para o público geral. O objetivo é assegurar 100% de confiabilidade nos fluxos críticos (Zero Bugs Financeiros e Zero Bloqueios de Acesso).

---

## PARTE 1: BATERIA DE TESTES AUTOMATIZADOS (PLAYWRIGHT)

*Esta seção garante que a infraestrutura base não sofreu regressões.*

- [ ] **E2E Auth**: Rodar testes de Login, Registro e Reset de Senha (`npx playwright test auth`).
- [ ] **E2E Pagamentos**: Rodar simulações de Checkout via Pix (Webhook Mock) para Album Full e Foto Point.
- [ ] **E2E IoT**: Testar a resposta do WebSocket e Fallback Polling quando um evento Phygital é concluído.
- [ ] **Vercel Build Check**: Garantir que o `server-v2.js` está respondendo `200 OK` nas rotas de `HealthCheck` após o deploy com `--minify`.

---

## PARTE 2: AUDITORIA MANUAL DE CÓDIGO (CRITICAL PATHS)

*Inspeção detalhada de "pontos de falha silenciosa" no código fonte.*

- [ ] **Race Conditions no Checkout**: Verificar se dois clientes comprando a última foto ao mesmo tempo causam duplicidade de pagamento no Mercado Pago.
- [ ] **Vazamento de Memória no Motor Phygital**: Avaliar o uso do `sharp` no backend para garantir que as manipulações de imagem (aplicação de marca d'água) não estão travando o servidor após 100 requisições simultâneas.
- [ ] **Sincronização do Google Calendar**: Validar o comportamento do sistema quando o Token de acesso (OAuth) do Google expira (o Refresh Token está funcionando 100%?).
- [ ] **Rate Limiting**: Checar se os limites de taxa nas rotas de login (anti-brute-force) estão ativos e configurados para o IP reverso da Vercel.

---

## PARTE 3: SIMULAÇÕES DE FLUXO E JORNADAS (ROLEPLAY E2E)

*A execução passo a passo dos cenários reais ("Finja que você é..."). Eu atuarei como o sistema e simularei cada passo.*

### Cenário 3.1: O Cliente Final e o Álbum de Casamento

**Persona**: Cliente B2C (Noiva) recebendo o link do Álbum.
**Objetivo da Simulação**: Validar acesso, usabilidade mobile, seleção e materialização.

1. Recebe o link via WhatsApp.
2. Acessa a página (UX Mobile ativada).
3. Faz Login/Cadastro sem atrito.
4. Vê a galeria (Grid-cols-2).
5. Toca nas fotos para selecionar (Ring verde esmeralda, Contador da Sticky Bar atualiza).
6. Clica em "Materializar Agora" com a meta atingida.
7. É redirecionada ao Checkout (Validação de preço dinâmico e integração Pix).
8. **Critério de Sucesso**: O pedido entra no banco com status `PENDENTE`, as fotos escolhidas são anexadas ao `OrderItem`, e ao pagar, o cofre é liberado.

### Cenário 3.2: O Franqueado e o Pânico Operacional

**Persona**: Franqueado gerenciando uma Unidade Fixa Phygital em um evento de alto volume.
**Objetivo da Simulação**: Validar IoT, WebSockets, Dashboards e Alertas de Insumo.

1. O Franqueado abre o `UnidadeFixaDashboard`.
2. O Print Agent local (Raspberry Pi) está conectado via WebSocket ao Supabase.
3. 50 clientes compram fotos via QRCode simultaneamente no salão.
4. O Franqueado acompanha as métricas de conversão e a "Fila de Impressão" (Print Monitor).
5. O estoque de papel cai para menos de 500 créditos.
6. **Critério de Sucesso**: O *Alerta Estratégico Vermelho* pisca na tela. Nenhuma foto é perdida e o Print Agent imprime as 50 fotos sequencialmente via eventos Realtime.

### Cenário 3.3: O Fotógrafo Profissional (Flash Event / B2B)

**Persona**: Fotógrafo autônomo vendendo em um evento esportivo na praia.
**Objetivo da Simulação**: Validar upload rápido, split de pagamento e resiliência de conexão.

1. O fotógrafo cria um `FLASH_EVENT` no celular.
2. Gera o QRCode e as pessoas começam a comprar antecipado.
3. O evento acaba, ele faz upload de 2GB de fotos em uma rede 4G oscilante.
4. As fotos chegam, o sistema pareia as compras antecipadas.
5. Quando o pagamento cai, o sistema divide automaticamente a comissão (Split).
6. **Critério de Sucesso**: O fotógrafo recebe exatamente a porcentagem combinada (ex: 70%) e a Foto Segundo retém a taxa administrativa automaticamente no Mercado Pago.

---

## 🚦 COMO EXECUTAR ESTA AUDITORIA

Para iniciarmos, você (Usuário) deve escolher por onde vamos atacar.
Sugiro começarmos pelo **Cenário 3.1 (O Cliente Final e o Álbum de Casamento)**.

Se quiser que eu comece a simulação e faça a auditoria técnica desse fluxo, basta dar o comando:
**"Iniciar Cenário 3.1"**.
