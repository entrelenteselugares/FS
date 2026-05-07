# 🚀 Guia de Operação: Logística Phygital (QR-to-Print)

Este documento detalha o funcionamento do "Motor Phygital" do Foto Segundo, permitindo que convidados imprimam fotos em tempo real via QR Code.

## 🏗️ Arquitetura do Sistema

1. **Captura (Mobile PWA)**: Convidados escaneiam o QR Code -> Abre a câmera -> Foto enviada com dados (Nome/Whats).
2. **Backend (Phygital Motor)**: Processa a imagem usando `sharp`, aplica o carimbo com código de referência (Ex: NY-2021) e salva no Supabase Storage.
3. **Admin (Radar Phygital)**: Dashboard em tempo real para monitorar a fila de impressão.
4. **Agent (IoT Printer)**: Script Node.js local que "pesca" fotos do servidor e envia para a Epson L3250 via PowerShell (Windows) ou CUPS (Linux).

---

## 🛠️ Configuração de Campo (O que levar para o evento)

- **Hardware**: Notebook ou Raspberry Pi com Node.js instalado.
- **Impressora**: Epson L3250 conectada via USB ou Wi-Fi.
- **Internet**: 4G/5G estável (o tráfego é otimizado para JPEG 95%).

### Passo a Passo no Notebook do Evento

1. Navegue até a pasta `printer-agent`.
2. Configure o arquivo `.env`:
   - `BACKEND_URL`: URL de produção ou IP local.
   - `AGENT_TOKEN`: Token JWT de Admin (ver script de geração).
   - `EVENT_ID`: ID único do evento atual.
   - `MOCK_MODE`: `false` (para imprimir de verdade).
   - `PRINTER_NAME`: Nome exato da impressora no Windows/Linux.
3. Inicie o agente: `node agent.js`.

---

## 🕹️ Central de Comando (Painel Admin)

No Dashboard do Administrador, clique no ícone de **Radar (Verde)** no evento ativo para abrir o monitor:

- **Status Pendente**: Foto enviada pelo cliente, aguardando o agente baixar.
- **Status Impresso**: Agente confirmou o recebimento e o comando de impressão.
- **Referência**: Use o código (Ex: NY-1234) para organizar os envelopes físicos.

## 📱 Kit de Distribuição

No Painel Admin, use o botão **QR Code** para gerar:

- **Vitrine Online**: Link para venda das fotos profissionais.
- **Captura Phygital**: Link direto para os convidados enviarem fotos (Gerar Cartaz de Mesa).

---
*Atualizado em: 01/05/2026*
*Status: Produção Ready*
