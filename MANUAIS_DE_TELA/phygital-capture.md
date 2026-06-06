# Manual de Uso — Captura Phygital (Câmera Integrada)

**URL:** `https://foto-segundo.vercel.app/phygital-capture?e=:slug`  
**Gerado em:** 2026-06-06  
**Acesso:** Público (com ou sem autenticação) / Acesso via QR Code ou link do Evento

---

## 📋 Propósito da Página

Esta página é a interface dedicada à captura de fotos e vídeos pelos convidados ou fotógrafos de um evento, funcionando como a entrada principal de mídia "Live". Foi projetada para ser simples, rápida e funcionar inteiramente dentro do navegador sem necessidade de baixar aplicativos, oferecendo uma experiência similar a redes sociais (Instagram/TikTok).

---

## 🧭 Estrutura e Interface da Página

A experiência de uso é dividida em fluxos baseados no estado do usuário:

### 1. Câmera Fullscreen In-App (`InAppCamera.tsx`)

Se o usuário estiver logado (ou se acessar o link com o parâmetro `?auto=1`), a interface abre diretamente no modo de **Câmera Integrada Fullscreen**:

- **Live Viewfinder:** O stream de vídeo ocupa a tela inteira utilizando o acesso da câmera do dispositivo (`getUserMedia`).
- **Toggle Foto/Vídeo:** Controles em pílula na parte inferior permitindo alternar visualmente os modos.
- **Botão de Captura (Shutter):**
  - No modo *Foto*: Um clique simples captura a imagem imediatamente.
  - No modo *Vídeo*: O usuário deve **segurar** o botão para iniciar a gravação. Soltar o botão interrompe a captura (com um limite máximo de 15 segundos). Durante a gravação, um anel de progresso verde (`brand-tactical`) circula o botão.
- **Virar Câmera:** Botão inferior direito permite alternar entre a câmera frontal (selfie) e traseira. (A traseira é selecionada por padrão, se disponível).
- **Acesso à Galeria (Fallback):** Botão inferior esquerdo abre o `file picker` nativo do dispositivo para escolher arquivos preexistentes da galeria.
- **Tela de Preview:** Após tirar uma foto ou gravar um vídeo, o usuário é apresentado a uma tela de confirmação (com botões "Refazer" ou "Confirmar"). Após a confirmação, o item é fechado e o arquivo é enviado.

### 2. Header de Identificação e Progresso (Fallback/Sem Login)

Caso o usuário acesse a página sem estar logado previamente, a câmera in-app não abrirá automaticamente (por restrições de permissões de browser sem gesto do usuário) e a página exibirá um header solicitando e-mail, senha e nome/telefone caso o e-mail não seja reconhecido. Após autenticado, a interface aciona a câmera.

Durante o envio (quando `user` está autenticado, os uploads acontecem em background automaticamente):

- **Barra de Progresso de Upload:** Um widget de progresso detalha o envio das mídias com contador "Enviando 1 de N".

### 3. Fila de Sucesso e Recebidos

- **Preview em Grid:** Exibe miniaturas quadradas das fotos capturadas e ícones específicos para vídeos capturados.
- **Códigos de Referência:** Após o envio bem sucedido, a interface mostra uma lista de códigos gerados (Ex: `AMORE-2849`), confirmando o sucesso da operação.

---

## ⚙️ Observações Técnicas (Integração Backend e MIME Types)

- **Extração Segura de MIME Type:** A lógica do InAppCamera injeta os arquivos (`File[]`) diretamente na função `processFiles()` do fluxo, contornando limitações nativas de instabilidade de `DataTransfer` no Android/WebViews que acabavam fazendo arquivos de vídeo perderem a propriedade `type`. O frontend infere `video/mp4` ou `image/jpeg` de modo seguro, garantindo os ícones corretos no grid.
- **Bypass de Processamento de Vídeo:** Mídias com tipo `video/*` recebem tratamento expresso no backend (`phygital.service.ts`), pulando o pipeline do `sharp` (que processa apenas imagens) para evitar o erro HTTP 500 fatal. O vídeo bruto é salvo no storage do Supabase e o registro vai para o banco como tipo `VIDEO`.
- **Limites e Tamanhos:** É permitido selecionar um máximo de **12 itens por vez**. O tempo de gravação de vídeo é estritamente monitorado e restrito a **15 segundos**, contendo validações visuais no anel de progresso da gravação.
- **WebRTC Tracking:** O componente implementa o ciclo de vida completo de encerramento (`stream.getTracks().forEach(t => t.stop())`) garantindo o desligamento do diodo/luz de uso da câmera e aliviando a memória quando a pessoa minimiza o browser ou troca de câmera (frontal/traseira) via celular.
