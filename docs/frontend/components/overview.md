<!-- generated-by: gsd-doc-writer -->

# Frontend Components Overview

Esta documentação descreve os componentes principais do frontend localizados em `src/components/`, os quais são os blocos de construção da interface **Foto Segundo**.

## Estrutura de Diretórios

O diretório de componentes está dividido nos seguintes subdiretórios e arquivos raiz:

- `/UI`: Componentes genéricos de interface (botões, inputs, modais base).
- `/notifications`: Notificações e alertas da interface.
- `/profissional`: Componentes específicos para o fluxo do Fotógrafo/Parceiro (gestão de eventos, upload de fotos, etc).
- `/quote`: Componentes de orçamentos e propostas comerciais.
- `/worldcup`: Funcionalidades temporárias e gamificação do projeto Copa do Mundo (Álbum da Torcida).

## Componentes Chave

### 1. Dashboard e Layout
- **DashboardLayout.tsx**: O wrapper principal que orquestra a navegação e a responsividade em todo o painel de controle (Master, Partner, Consumer, Ambassador).
- **Navbar.tsx** e **BottomNav.tsx**: Sistemas de navegação superior (desktop) e inferior (mobile).
- **SideDrawer.tsx**: Menu lateral expansível usado no painel de controle.

### 2. Core Business Components
- **PrintStoreModal.tsx** & **PrintKitModal.tsx**: Modais críticos para o fluxo "Web-to-Print" e de venda de serviços físicos e ingressos.
- **ServiceStoreModal.tsx**: Marketplace para contratação de serviços fotográficos extras.
- **InAppCamera.tsx**: Câmera PWA nativa para o fluxo phygital (ex. escaneamento de QR Code ou captura de perfil).
- **VaultSettingsModal.tsx**: Painel de configurações para gerenciamento de álbuns, segurança de PIN e compartilhamento de cofre de memórias.

### 3. Autenticação e Gamificação
- **AuthModal.tsx**: Sistema de login híbrido (Magic Link, Google, etc).
- **SchoolAuthenticationGate.tsx**: Interceptor de autenticação específico para eventos do tipo "Escolar" (seleção de aluno).
- **ProfileStepper.tsx**: Fluxo de onboarding gamificado.
- **AffiliateDashboard.tsx**: Dashboard para embaixadores acompanharem links gerados e comissões.

### 4. Gestão de Imagens
- **OptimizedImage.tsx**: Fallback de imagens e otimização de load com lazy-loading.
- **TouchSelectionGallery.tsx**: Galeria focada em dispositivos touch para facilitar a seleção de fotos a serem compradas.
- **PhotoMosaic.tsx**: Visualizador estético (Mosaico) para apresentação das fotos no vault ou eventos públicos.

## Padrões de Uso

1. **Lazy Loading**: Componentes que usam bibliotecas de gráficos (Recharts) ou renderização avançada (PDF, Canvas) devem ser importados usando `React.lazy()` no nível da rota para evitar inflar o bundle principal.
2. **Modais Globais**: Modais como `AuthModal` ou `CartModal` costumam usar context (`useModal`) para poderem ser invocados por qualquer parte da UI.
3. **Responsividade Mobile-First**: Quase todos os componentes devem garantir que são perfeitamente usáveis via `BottomNav.tsx` antes de se preocuparem com a expansão desktop no `DashboardLayout`.

<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->
