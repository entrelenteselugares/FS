# SPEC: Fase 11 - Cofres de Memórias

## Contexto
O Foto Segundo evolui para um modelo SaaS B2C, permitindo que usuários criem "Cofres" (Álbuns Privados) para Photo Dumps colaborativos. O objetivo final é a materialização física (impressão) automática ou sob demanda, baseada em metas de "poses" (estilo câmera analógica).

## 1. Requisitos Técnicos: Cold Storage (Google Drive)
- **Motivação**: Redução de custos de storage no banco de dados principal para fotos privadas massivas.
- **Implementação**: 
    - Uso de **Service Account** do Google Cloud.
    - Cada álbum criado gera uma pasta única no Drive corporativo.
    - O banco de dados armazena apenas links de metadados (`fileId`, `webViewLink`).
    - Cache de thumbnails no backend para evitar latência excessiva do Drive API no carregamento inicial.

## 2. Requisitos de Banco de Dados (Prisma)
### SharedAlbum
- `goalPoses`: Meta de fotos (12, 24, 36).
- `type`: `ANALOG_HOUSE` (assinatura) ou `ON_DEMAND`.
- `status`: `OPEN`, `LOCKED` (processando impressão), `ARCHIVED`.

### AlbumMember
- Papéis: `OWNER` (gestão total), `COLLABORATOR` (upload e voto), `SPECTATOR` (apenas visualização).

### AccessLink (Zero Trust)
- QR Codes que expiram em períodos configuráveis (12h, 24h, 7 dias).
- Links permanentes para administradores/moradores.

### MediaVote
- Mecânica de curadoria comunitária: fotos mais votadas são selecionadas automaticamente para o fechamento do álbum.

## 3. Modelo de Negócio & Logística
- **Assinatura (Prepaid)**: Ciclo mensal fechado automaticamente no dia configurado se a meta de votos for atingida.
- **Avulso (On-Demand)**: Usuário decide quando fechar o cofre e paga via Checkout Unificado.
- **Logística**: Integração de frete via "Carta Registrada" (baixo custo para envios de poucas fotos).

## 4. UI/UX: Design System "Midnight Luxury"
- **Mobile Navigation**: Migração total para Bottom Nav nos fluxos de cliente.
- **Visual**:
    - Cards imersivos com cantos `2xl` e gradientes escuros.
    - Badges de hierarquia com efeito `backdrop-blur` (glassmorphism).
    - Grid infinito de 2 colunas para navegação rápida em Photo Dumps.

## Critérios de Aceite (UAT)
1. Criação de cofre gera automaticamente pasta no Google Drive.
2. QR Code temporário bloqueia acesso após 24h.
3. Ranking de fotos reflete corretamente a ordem de prioridade para impressão.
4. Fechamento de ciclo gera um pedido (`Order`) pendente no Dashboard Master.
