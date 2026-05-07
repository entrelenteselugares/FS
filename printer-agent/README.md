# 🖨️ Agente de Impressão Foto Segundo (IoT)

Este script transforma um Raspberry Pi em um servidor de impressão autônomo para eventos Phygital.

## 🚀 Setup Rápido (No Raspberry Pi)

### 1. Instalar Dependências do Sistema

```bash
sudo apt update
sudo apt install cups nodejs npm -y
# Adicione seu usuário ao grupo de impressão
sudo usermod -a -G lpadmin $USER
```

### 2. Configurar a Impressora

Acesse `http://localhost:631` no navegador do Pi e adicione sua Epson L3250. Anote o nome exato (ex: `EPSON_L3250`).

### 3. Instalar o Agente

```bash
mkdir printer-agent
cd printer-agent
# (Copie os arquivos agent.js e package.json para cá)
npm install
```

### 4. Configurar Variáveis

Crie um arquivo `.env` baseado no `.env.example`.

## 🛡️ Blindagem com PM2 (Resiliência Total)

Para garantir que o script reinicie sozinho se o Pi cair ou a energia oscilar:

```bash
# Instalar o PM2 globalmente
sudo npm install -g pm2

# Iniciar o agente
pm2 start agent.js --name "foto-segundo-printer"

# Configurar para iniciar no boot do Raspberry Pi
pm2 startup
# (Execute o comando que o terminal vai te mostrar)

# Salvar a lista de processos atual
pm2 save
```

## 📊 Comandos Úteis

- `pm2 logs`: Ver o que está acontecendo em tempo real.
- `pm2 status`: Ver se o agente está online.
- `pm2 restart all`: Reiniciar o sistema de impressão.
- `lpstat -p`: Ver o status da impressora no CUPS.
- `lpstat -o`: Ver a fila de impressão local.
