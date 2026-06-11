# Phase 59: Banner, Chaveamento e Placar Ao Vivo da Copa

## Domain

Construir a integração em tempo real com placares da Copa do Mundo, renderizar um banner promocional dinâmico com notificações e uma interface dedicada para o chaveamento (bracket) do torneio. O objetivo é engajar os usuários a visualizarem o progresso da copa e interagirem com as ferramentas locais (como o Álbum da Torcida).

## Canonical refs

- Não há documentos ou APIs listados. O desenvolvedor usará uma API padrão do mercado (ex: API-Football).

## Decisions

### 1. Fonte de Dados (API)

- **Decisão:** Usar uma API Especializada de Esportes (Ex: API-Football ou equivalente).
- **Contexto:** Evitar realizar web-scraping direto no site da FIFA devido ao risco iminente de quebras no layout durante os jogos da Copa. Uma API dedicada traz mais confiabilidade para obter placares ao vivo e dados da tabela estruturados e padronizados, ainda que exija cadastro de chaves/tokens no `.env`.

### 2. Comportamento Visual em Tempo Real

- **Decisão:** (Via requisito original) Atualizar o placar automaticamente durante os jogos. Alertas em tempo real deverão comunicar sobre os jogos e eventos ocorrendo.
- **Contexto:** Isso provavelmente usará uma estratégia de Polling de curta duração contra o nosso próprio backend (que consultará a API de esportes com cache agressivo para evitar rate limits).

### 3. Renderização do Chaveamento e UI Local

- **Decisão:** (Via requisito original) Criar o desenho das chaves (bracket) e separar um "local especial" na interface para os tópicos da Copa.
- **Contexto:** Será uma evolução do `/album-torcida`, tornando-se uma central completa da Copa do Mundo, unindo o álbum, as chaves das oitavas-de-final em diante e o banner dinâmico.

## Code Context (Reusable Assets)

- O sistema já possui componentes em `frontend/src/pages/worldcup` que podem ser expandidos (como a `AlbumTorcidaPage`).
- Padrões de notificação via Toast (`sonner`) já estão habilitados para os alertas das partidas.
