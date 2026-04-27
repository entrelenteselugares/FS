# Planejamento: Marketplace de Fotos e Serviços para Profissionais

Este documento descreve a expansão da Foto Segundo para suportar eventos em locais públicos (ex: Taquaral, Parques, Corridas) onde o modelo de negócio muda de "Acesso ao Álbum" para "Venda por Foto" e "Venda de Serviços".

## 1. Visão Geral do Fluxo (Matheus Kurio no Taquaral)

- **Criação do Evento**: O fotógrafo cria um evento do tipo "Público/Marketplace".
- **Descrição Dinâmica**: Um campo de texto rico para o fotógrafo vender seu peixe (ex: "estarei com lente 70-200, espontâneas...").
- **CTA de Serviços**: Botão "Agendar Clique" que abre um menu de serviços (ex: Pack 10 fotos, Vídeo Reel, Ensaio 15min) com preços definidos pelo próprio fotógrafo.
- **Galeria de Venda**: O usuário navega pelas fotos (com marca d'água e proteção). Ele adiciona as fotos que deseja ao "Carrinho" e paga por unidade ou pelo pack escolhido.

## 2. Requisitos Técnicos (Back-end)

### 2.1 Modelo de Dados (Prisma)

- **Evento**: Adicionar campo `type` (`ALBUM_FULL` ou `PHOTO_MARKETPLACE`).
- **Serviços do Profissional**: Criar tabela `ProfessionalService` vinculada ao fotógrafo (similar aos serviços da Unidade Fixa).
- **Preços por Foto**: Definir um valor padrão por foto no evento (ex: R$ 15,00/foto).
- **Itens do Pedido**: O modelo `Order` deve suportar uma lista de `mediaIds` específicos em vez de apenas o `eventId`.

### 2.2 Processamento de Imagem

- **Watermark (Marca d'água)**: Implementar uma função (usando biblioteca `sharp` ou similar) que aplica a logo da Foto Segundo automaticamente no "Preview" da foto durante o upload ou via Cloudinary Transformation.
- **IDs Únicos**: Expor o `shortId` de cada mídia para que o cliente possa identificar e o fotógrafo possa localizar o original em alta.

## 3. Requisitos de Interface (Front-end)

### 3.1 Proteção de Conteúdo

- **Bloqueio de Clique Direito**: Impedir o "Salvar imagem como".
- **Bloqueio de Print/Screenshot**:
  - Usar CSS (`user-select: none`).
  - Overlay transparente sobre a imagem para dificultar o arraste/cópia.
  - *Disclaimer*: Bloqueio de print total é impossível no browser, mas podemos dificultar 99% com overlays e marca d'água agressiva.

### 3.2 Novo Carrinho de Compras

- Substituir o botão "Comprar Álbum" por um seletor de fotos.
- Contador de fotos selecionadas com cálculo de valor em tempo real.
- Integração com os "Packs de Serviço" do fotógrafo.

## 4. Diferenciais Estratégicos

- **Autonomia do Fotógrafo**: Ele não é apenas um captador, ele é um gestor da sua própria vitrine dentro da Foto Segundo.
- **Escalabilidade**: O sistema passa a atender desde casamentos fechados até grandes eventos públicos e turismo.

## 5. Fluxo Operacional: Logística e "Uberização" do Serviço

Para eventos dinâmicos (ex: parques e corridas), o sistema operará como uma logística de despacho em tempo real:

### 5.1 O Dia do Evento (Step-by-Step)

1. **Notificação de Início**: Quando o fotógrafo inicia o expediente, todos os clientes que compraram packs para aquele dia recebem um alerta (WhatsApp/Push).
2. **Localização em Tempo Real**: O fotógrafo compartilha sua posição via GPS. O mapa exibe "Pontos de Encontro" pré-definidos (via Google Maps) e a posição atual do profissional.
3. **Chamada do Cliente (Pinning)**: O usuário escolhe um ponto de encontro ou envia sua localização exata dentro da área de cobertura.
4. **Roteirização Inteligente (Shortest Path)**: O painel do fotógrafo organiza uma lista de "Próximos Cliques" calculando a rota mais curta entre os usuários que chamaram, otimizando o deslocamento.
5. **Autenticação via QR Code (Proof of Presence)**: Ao encontrar o cliente, o fotógrafo lê o QR Code no painel do usuário (gerado no checkout). Isso valida o serviço no sistema e libera a contagem de fotos do pack.

## 6. Desafios e Soluções Técnicas

- **Real-time Tracking**: Utilizar Supabase Realtime ou Socket.io para atualizar os pins no mapa sem recarregar a página.
- **API de Rotas**: Integração com Google Directions API para sugerir o caminho ponto-a-ponto para o fotógrafo.
- **Geofencing**: Alertar o usuário quando o fotógrafo estiver a menos de 200 metros do seu ponto.

---

**Próximos Passos Sugeridos:**

1. Validar se o modelo de "Preço Único por Foto" atende a maioria dos casos.
2. Definir se os "Serviços/Packs" serão cadastrados globalmente pelo Admin ou se cada fotógrafo terá total liberdade.
3. Iniciar o protótipo da "Dashboard de Rota" para o fotógrafo.
