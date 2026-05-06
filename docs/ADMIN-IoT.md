# Documentação Técnica: Telemetria IoT & Monitoramento

Este documento descreve o funcionamento do sistema de telemetria e "Heartbeat" para os agentes de impressão físicos (Raspberry Pi).

## 1. Arquitetura do Heartbeat

O sistema utiliza um modelo de "pull-and-report" para garantir a visibilidade do estado de conexão dos hardwares em campo.

### Componentes

1. **IoT Agent (`printer-agent/agent.js`)**: Realiza uma chamada POST para `/api/iot/heartbeat` a cada 60 segundos.
2. **IoT Service (`backend/src/services/iot.service.ts`)**: Gerencia o estado no banco de dados (`prisma.ioTDevice`).
3. **Monitoramento Ativo (`expiration.job.ts`)**: Um cron job que roda periodicamente e marca como `OFFLINE` qualquer dispositivo que não tenha reportado presença nos últimos 2 minutos.

## 2. Endpoints de API

### Reportar Presença

- **URL**: `/api/iot/heartbeat`
- **Método**: `POST`
- **Payload**:

  ```json
  {
    "agentId": "iot-agent-001",
    "name": "Printer Agent (EPSON_L3250)"
  }
  ```

### Listar Dispositivos (Admin)

- **URL**: `/api/admin/iot/devices`
- **Método**: `GET`
- **Segurança**: Requer Token JWT de Administrador.

## 3. Estados de Dispositivo

- **ONLINE**: Dispositivo enviou heartbeat nos últimos 2 minutos.
- **OFFLINE**: Dispositivo ausente há mais de 2 minutos. Detectado automaticamente pelo `runExpirationJob`.

## 4. Configuração do Agente

No arquivo `.env` do `printer-agent`:

```env
AGENT_ID=iot-agent-001
BACKEND_URL=https://api.fotosegundo.com.br
```

---

### Atualizado em Maio de 2026 - Equipe Foto Segundo
