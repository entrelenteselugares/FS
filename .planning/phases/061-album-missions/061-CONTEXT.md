# Phase 61: Missões do Álbum da Torcida

## Domain
Uma aba "Missões" dentro do Álbum da Torcida que guia o usuário através de quizzes e tarefas específicas para completar os 12 slots do álbum. A funcionalidade é desenhada para engajar os torcedores via gamificação, permitindo o acúmulo de pontos/selos e validação comunitária das fotos.

## Canonical Refs
- `c:\foto-segundo\frontend\src\pages\worldcup\AlbumTorcidaPage.tsx`
- `.planning/phases/58-album-da-torcida-copa-do-mundo/58-UI-SPEC.md`

## Locked Decisions
- **Estrutura das Missões**: As missões são exclusivas e mapeadas 1 para 1; cada uma das 12 missões libera ou preenche um dos 12 slots do álbum da Copa.
- **Dinâmica de Perguntas**: A mecânica utilizará o formato Quiz. O usuário pode ter que acertar uma pergunta de trivia da Copa para desbloquear o slot da foto correspondente.
- **Mecânica de Recompensa**: O cumprimento das missões e quizzes rende pontos e selos. Estes servirão como moeda de troca/pontuação para uma premiação maior.
- **Validação das Fotos**: A aprovação das fotos submetidas nos slots dependerá de um sistema de avaliação comunitária ("a comunidade vai julgar a foto"). Os usuários da comunidade/amigos irão validar se a foto cumpre a missão requerida.

## Codebase Context
- O Álbum da Torcida base já possui a renderização dos jogos (`AlbumTorcidaPage.tsx`), sendo necessário integrar a aba de Missões.
- A validação comunitária precisará de uma infraestrutura para permitir que outros usuários interajam com as fotos submetidas (aprovação/rejeição).

## Deferred Ideas
- N/A
