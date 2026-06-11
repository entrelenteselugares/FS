# 📋 Lista de URLs Frontend — Foto Segundo

**Gerado em:** 2026-06-10  
**Base URL (produção):** <https://foto-segundo.vercel.app>  
**Base URL (local):** <http://localhost:3001>  
**Status:** Manual pendente = ❌ | Manual gerado = ✅

---

## 🌐 Páginas Públicas (sem autenticação)

| #   | URL              | Descrição                                                           | Acesso | Manual |
| --- | ---------------- | ------------------------------------------------------------------- | ------ | ------ |
| 01  | `/`              | **Home** — Vitrine pública, últimos eventos, CTA de agendamento     | Todos  | ✅     |
| 02  | `/sobre`         | **Sobre** — Apresentação da empresa e missão                        | Todos  | ✅     |
| 03  | `/parcerias`     | **Parcerias** — Landing page para casas parceiras                   | Todos  | ✅     |
| 04  | `/negocios`      | **Negócios** — Landing page B2B para empresas                       | Todos  | ✅     |
| 05  | `/clube`         | **Clube** — Landing page do programa de fidelidade                  | Todos  | ✅     |
| 06  | `/vitrine`       | **Vitrine de Profissionais** — Galeria de fotógrafos da plataforma  | Todos  | ✅     |
| 07  | `/profissionais` | **Profissionais** — Alias de /vitrine                               | Todos  | ✅     |
| 08  | `/pro/:id`       | **Perfil Público do Fotógrafo** — Portfólio, medalhas e agendamento | Todos  | ✅     |
| 09  | `/e/:slug`       | **Página do Evento** — Álbum público de um evento específico        | Todos  | ✅     |
| 10  | `/p/:slug`       | **Landing da Unidade Parceira** — Página de uma casa parceira       | Todos  | ✅     |
| 11  | `/suporte`       | **Central de Ajuda / Suporte**                                      | Todos  | ✅     |
| 12  | `/status`        | **Status da Plataforma** — Monitoramento de saúde da API            | Todos  | ✅     |
| 13  | `/termos`        | **Termos de Uso**                                                   | Todos  | ✅     |
| 14  | `/privacidade`   | **Política de Privacidade**                                         | Todos  | ✅     |
| 15  | `/lgpd`          | **LGPD** — Política de dados pessoais                               | Todos  | ✅     |
| 16  | `/contato`       | **Contato**                                                         | Todos  | ✅     |
| 17  | `/404`           | **Página não encontrada**                                           | Todos  | ✅     |

---

## 🔐 Autenticação

| #   | URL                | Descrição                                                          | Acesso  | Manual |
| --- | ------------------ | ------------------------------------------------------------------ | ------- | ------ |
| 18  | `/login`           | **Login** — Acesso com e-mail e senha                              | Público | ✅     |
| 19  | `/auth`            | **Seleção de Tipo de Acesso** — Escolha entre cliente/profissional | Público | ✅     |
| 20  | `/registro`        | **Cadastro** — Criação de conta                                    | Público | ✅     |
| 21  | `/register`        | **Cadastro** — Alias de /registro                                  | Público | ✅     |
| 22  | `/forgot-password` | **Esqueci minha Senha**                                            | Público | ✅     |
| 23  | `/reset-password`  | **Redefinir Senha** — Via link do e-mail                           | Público | ✅     |

---

## 📷 Cotação / Agendamento

| #   | URL                    | Descrição                                                                | Acesso  | Manual |
| --- | ---------------------- | ------------------------------------------------------------------------ | ------- | ------ |
| 24  | `/cotacao`             | **Hub de Cotação** — Ponto de entrada do funil de vendas                 | Todos   | ✅     |
| 25  | `/cotacao/pacotes`     | **Fluxo Principal de Vendas** — Passo a passo de contratação             | Todos   | ✅     |
| 26  | `/cotacao/unidades`    | **Unidades Fixas** — Fluxo para casas parceiras com serviços específicos | Público | ✅     |
| 27  | `/cotacao/customizado` | **Cotação Customizada** — Monte sua cobertura do zero                    | Público | ✅     |
| 28  | `/checkout`            | **Checkout** — Pagamento de pedido e aplicação de cupom                  | Público | ✅     |
| 29  | `/checkout/:orderId`   | **Checkout por ID** — Retomada de pedido específico                      | Público | ✅     |

---

## 👤 Área do Cliente / Minha Conta

> **Rota base:** `/minha-conta` com query param `?s=<secao>`

| #   | URL                         | Descrição                                                  | Acesso       | Manual |
| --- | --------------------------- | ---------------------------------------------------------- | ------------ | ------ |
| 30  | `/minha-conta`              | **Dashboard do Cliente** — Visão geral de pedidos e perfil | Autenticado  | ✅     |
| 31  | `/minha-conta?s=perfil`     | **Aba: Perfil** — Dados pessoais e foto                    | Autenticado  | ✅     |
| 32  | `/minha-conta?s=files`      | **Aba: Meus Pedidos** — Histórico de pedidos e álbuns      | Autenticado  | ✅     |
| 33  | `/minha-conta?s=wallet`     | **Aba: Carteira / Créditos**                               | Autenticado  | ✅     |
| 34  | `/minha-conta?s=affiliate`  | **Aba: Afiliado** — Programa de indicação                  | Autenticado  | ✅     |
| 35  | `/minha-conta?s=agenda`     | **Aba: Agenda** — Próximos eventos                         | PROFISSIONAL | ✅     |
| 36  | `/minha-conta?s=financeiro` | **Aba: Financeiro** — Ganhos e repasses                    | PROFISSIONAL | ✅     |
| 37  | `/minha-conta?s=servicos`   | **Aba: Serviços** — Pacotes ofertados                      | PROFISSIONAL | ✅     |
| 38  | `/minha-conta?s=portfolio`  | **Aba: Portfólio** — Gestão do portfólio                   | PROFISSIONAL | ✅     |
| 39  | `/minha-conta?s=perfil`     | **Aba: Perfil Profissional** — Configurações de conta      | PROFISSIONAL | ✅     |

---

## 📸 Área do Profissional

| #   | URL                                         | Descrição                                                               | Acesso       | Manual |
| --- | ------------------------------------------- | ----------------------------------------------------------------------- | ------------ | ------ |
| 40  | `/profissional`                             | **Dashboard do Profissional** — Visão geral com missões e ganhos        | PROFISSIONAL | ✅     |
| 41  | `/profissional/novo-servico`                | **Novo Serviço Customizado** — Formulário para criar serviço sob medida | PROFISSIONAL | ✅     |
| 42  | `/profissional/portfolio`                   | **Gestão de Portfólio** — Upload e organização de fotos                 | PROFISSIONAL | ✅     |
| 43  | `/profissional/monitor/:eventId`            | **Monitor de Impressão** — Painel de monitoramento ao vivo de evento    | PROFISSIONAL | ✅     |
| 44  | `/profissional/monitor/:eventId/full`       | **Monitor Fullscreen** — Versão tela cheia do monitor                   | PROFISSIONAL | ✅     |
| 45  | `/profissional/monitor/:eventId/fullscreen` | **Monitor Fullscreen** — Alias de /monitor/:eventId/full                | PROFISSIONAL | ✅     |

---

## 🏢 Área da Unidade Fixa / Cartório

| #   | URL             | Descrição                                                     | Acesso             | Manual |
| --- | --------------- | ------------------------------------------------------------- | ------------------ | ------ |
| 46  | `/unidade-fixa` | **Dashboard da Unidade** — Gestão de eventos da casa parceira | CARTORIO / UNIDADE | ✅     |

---

## 🏭 Área de Franquia

| #   | URL         | Descrição                                            | Acesso     | Manual |
| --- | ----------- | ---------------------------------------------------- | ---------- | ------ |
| 47  | `/franquia` | **Dashboard da Franquia** — Hub B2B para franqueados | FRANCHISEE | ✅     |

---

## 🔒 Área Administrativa

> **Rota base:** `/admin` — acesso exclusivo para ADMIN

| #   | URL                           | Descrição                                                         | Acesso | Manual |
| --- | ----------------------------- | ----------------------------------------------------------------- | ------ | ------ |
| 48  | `/admin`                      | **Painel Admin — Visão Geral**                                    | ADMIN  | ✅     |
| 49  | `/admin?s=usuarios`           | **Admin: Usuários** — Gestão de todos os usuários                 | ADMIN  | ✅     |
| 50  | `/admin?s=pedidos`            | **Admin: Pedidos** — Todos os pedidos da plataforma               | ADMIN  | ✅     |
| 51  | `/admin?s=eventos`            | **Admin: Eventos** — Gestão de eventos e álbuns                   | ADMIN  | ✅     |
| 52  | `/admin?s=financeiro`         | **Admin: Financeiro** — Pagamentos e repasses                     | ADMIN  | ✅     |
| 53  | `/admin?s=profissionais`      | **Admin: Aprovação Hub** — Aprovação de fotógrafos e serviços     | ADMIN  | ✅     |
| 54  | `/admin?s=servicos`           | **Admin: Serviços** — Catálogo de serviços da plataforma          | ADMIN  | ✅     |
| 55  | `/admin?s=unidades`           | **Admin: Unidades** — Casas parceiras cadastradas                 | ADMIN  | ✅     |
| 56  | `/admin?s=franquias`          | **Admin: Franquias** — Gestão de franqueados                      | ADMIN  | ✅     |
| 57  | `/admin?s=growth`             | **Admin: Growth** — Métricas de crescimento e campanhas           | ADMIN  | ✅     |
| 58  | `/admin?s=concursos`          | **Admin: Concursos** — Gestão de competições fotográficas         | ADMIN  | ✅     |
| 59  | `/admin?s=embaixadores`       | **Admin: Embaixadores** — Programa de embaixadores                | ADMIN  | ✅     |
| 60  | `/admin?s=catalogo-impressao` | **Admin: Catálogo de Impressão** — Produtos para impressão física | ADMIN  | ✅     |
| 61  | `/admin?s=fornecedores`       | **Admin: Fornecedores** — Gestão de fornecedores                  | ADMIN  | ✅     |
| 62  | `/admin?s=estoque`            | **Admin: Estoque** — Controle de insumos e materiais              | ADMIN  | ✅     |
| 63  | `/admin?s=leads`              | **Admin: Leads** — CRM de oportunidades                           | ADMIN  | ✅     |
| 64  | `/admin?s=configuracoes`      | **Admin: Configurações** — Configs gerais da plataforma           | ADMIN  | ✅     |
| 65  | `/admin?s=analytics`          | **Admin: Analytics** — Relatórios e dados de uso                  | ADMIN  | ✅     |

---

## 🎁 Fluxos Especiais

| #   | URL                     | Descrição                                                            | Acesso       | Manual |
| --- | ----------------------- | -------------------------------------------------------------------- | ------------ | ------ |
| 66  | `/meus-albuns`          | **Gestão de Álbuns (Vaults)** — Cofres de fotos do usuário           | Autenticado  | ✅     |
| 67  | `/meus-albuns/:vaultId` | **Álbum / Cofre** — Visualização das fotos de um evento              | Autenticado  | ✅     |
| 68  | `/delivery/:id`         | **Entrega Luxury** — Experiência de entrega premium das fotos        | Autenticado  | ✅     |
| 69  | `/captura`              | **Captura Phygital** — Interface de captura ao vivo em evento        | PROFISSIONAL | ✅     |
| 70  | `/phygital-capture`     | **Captura Phygital** — Alias de /captura                             | PROFISSIONAL | ✅     |
| 71  | `/flash/:shortId`       | **Flash Unlock** — Desbloqueio rápido de álbum por link              | Público      | ✅     |
| 72  | `/embaixador/:slug`     | **Página do Embaixador** — Perfil público do embaixador              | Público      | ✅     |
| 73  | `/invitation/:code`     | **Convite** — Aceite de convite para vault compartilhado             | Público      | ✅     |
| 74  | `/dashboard`            | **Redirect Inteligente** — Redireciona para o painel correto do role | Autenticado  | ✅     |

---

## 🏆 Copa do Mundo (Gamificação)

| #   | URL                                | Descrição                                                      | Acesso      | Manual |
| --- | ---------------------------------- | -------------------------------------------------------------- | ----------- | ------ |
| 75  | `/album-torcida`                   | **Álbum da Torcida** — Visualização e figurinhas Copa do Mundo | Autenticado | ✅      |
| 76  | `/album-torcida/match/:matchId`    | **Folha de Partida** — Visão e detalhe de partida específica   | Autenticado | ✅      |

---

## 📊 Estatísticas

| Categoria               | Total de Páginas |
| ----------------------- | ---------------- |
| Páginas Públicas        | 17               |
| Autenticação            | 6                |
| Cotação / Checkout      | 6                |
| Área do Cliente         | 10               |
| Área do Profissional    | 6                |
| Área Unidade / Franquia | 2                |
| Área Administrativa     | 18               |
| Fluxos Especiais        | 9                |
| Copa do Mundo           | 2                |
| **TOTAL**               | **76 páginas**   |

---

## 🎯 Ordem Sugerida de Documentação

Prioridade por impacto de usuário:

1. `/` — Home
2. `/login` — Autenticação
3. `/cotacao` — Início do funil principal
4. `/cotacao/pacotes` — Fluxo mais usado
5. `/cotacao/unidades` — Fluxo casas parceiras
6. `/minha-conta` — Área do cliente
7. `/profissional` — Dashboard do fotógrafo
8. `/meus-albuns` — Álbuns
9. `/vitrine` — Vitrine de profissionais
10. `/admin` — Painel administrativo

## Emails para teste, senha padrão "123456"

### Usuários cliente, profissional e unidade fixa

- <gelin.graff@hotmail.com>
- <info@tlmmakers.com>
- <moraesrenata.br@gmail.com>
- <recomendonacidade@gmail.com>
- <recomendonacozinha@gmail.com>
- <recomendonaviagem@gmail.com>
- <matheuskurio@gmail.com>

### Usuário admin

- <contatofotosegundo@gmail.com>
