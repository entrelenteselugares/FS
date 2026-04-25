# Changelog Recente - Foto Segundo

Este documento registra as atualizações críticas realizadas para estabilização da plataforma e lançamento da versão "Midnight Luxury".

## 🚀 Abril 2026 - Sprint de Estabilização e UX

### 🎨 Interface e Experiência (UX/UI)

- **Wizard de Orçamento (QuotePage)**: Refatoração completa da calculadora para um sistema de 4 passos, reduzindo a carga cognitiva e aumentando a conversão.
- **Midnight Luxury v2**: Padronização de todos os Dashboards (Admin, Profissional, Unidade Fixa) com tokens de design variáveis, eliminando hexadecimais hardcoded.
- **Audit de Paddings**: Correção sistemática de 48px de recuo em campos de entrada com ícones para evitar sobreposições em telas mobile.
- **Brutalismo Minimalista**: Reforço da regra de `borderRadius: 0` em todos os botões e cards para manter a identidade de marca.

### ⚙️ Backend e Banco de Dados

- **Módulo de Catálogo CK**: Implementação do modelo `PrintProduct` e controladores de administração para gestão de preços e margens de álbuns.
- **Sincronização Supabase**: Execução de migrações via `db push` para habilitar novas funcionalidades de impressão sem downtime.
- **Correção Financeira**: Ajuste do cálculo de repasse para a Matriz (fallback de 40%) alinhado ao modelo de negócio.

### 🧹 Debug e Manutenção

- **Zero Build Errors**: Eliminação de variáveis não utilizadas e erros de tipo que impediam o deploy na Vercel.
- **Organização de Documentação**: Limpeza de arquivos legados com nomes acentuados e criação de um índice mestre (`README.md`).
- **Audit de SEO**: Adição de meta-tags dinâmicas e títulos descritivos via `react-helmet-async`.

---
> [!NOTE]
> Próximo foco: Integração de notificações WhatsApp via CallMeBot para novos orçamentos.
