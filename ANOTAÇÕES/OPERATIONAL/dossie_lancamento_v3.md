# 🚀 Dossiê de Lançamento: Foto Segundo (Foto Print Live)

Este documento consolida a estratégia de abordagem comercial e o roteiro técnico para a transição definitiva do laboratório para o mercado.

---

## 💼 1. Pitch Comercial: A Experiência "Magic Link"

### O Problema
Restaurantes, hotéis e academias querem gerar valor e memórias, mas evitam serviços que geram filas, ocupam espaço físico ou exigem que o cliente baixe um aplicativo.

### A Solução Foto Segundo
Uma plataforma de **Impressão Phygital Autônoma** que transforma a foto do celular do cliente em um presente físico instantâneo, sem fricção.

### Argumentos de Ouro (Diferenciais Técnicos v3.1)
1. **Zero Fricção (App-less)**: O cliente escaneia o QR Code e já está dentro da galeria. Sem download, sem cadastro obrigatório no início.
2. **Checkout de Convidado (Magic Link)**: Pagamento em segundos via Pix. A transação acontece no celular do cliente, não no balcão do parceiro.
3. **Estética Midnight Luxury**: A interface premium valoriza o estabelecimento. Não é "mais uma máquina de fotos", é um serviço de luxo integrado.
4. **Impressão Inteligente (IoT)**: O parceiro só precisa fornecer uma tomada e Wi-Fi. O sistema gerencia as filas e a logística de impressão de forma invisível.

### Proposta para o Parceiro
> "Transforme o tempo de espera do seu cliente em um momento de encantamento. Sem custos de pessoal, sem filas no balcão, e com a estética que o seu negócio merece."

---

## 🧪 2. Plano de Stress Test (O Piloto Real)

Para garantir a resiliência da infraestrutura "Architecture in Hourglass", seguiremos este roteiro no evento beta:

### Preparação do Hardware
- **Raspberry Pi**: Instalação limpa do `printer-agent`.
- **Epson L3250**: Verificação de níveis de tinta e alinhamento de papel fotográfico 10x15.
- **Rede**: Teste de reconexão automática (o `agent.js` deve recuperar a fila após quedas de Wi-Fi).

### Checklist de Sincronização
1. [ ] **Simulação de Venda**: Realizar 10 pedidos seguidos via mobile (Simular o "Ponto Fixo").
2. [ ] **Monitor de Fila**: Validar se o dashboard administrativo reflete os jobs em tempo real.
3. [ ] **Latência de Impressão**: Cronometrar o tempo entre o Pix confirmado no Checkout e o início da impressão física (Meta: < 15 segundos).
4. [ ] **Recuperação de Falhas**: Desligar o Raspberry durante uma impressão e religar para validar a idempotência do endpoint `/phygital/confirm`.

---

## 📈 3. Próximos Passos Imediatos

| Ação | Responsável | Status |
| :--- | :--- | :--- |
| **Ativação da Landing Page de Parceiros** | Kurio | 🟢 Pronto |
| **Configuração do .env de Produção no Agente** | Kurio | 🟡 Pendente |
| **Impressão dos QR Codes de Teste** | Kurio | ⚪ A fazer |
| **Primeira Abordagem Comercial (Pitch)** | Kurio | ⚪ A fazer |

---

> [!TIP]
> Use a nova **Partner Landing Page** como seu material de apoio visual durante a abordagem. Ela foi desenhada especificamente para converter esse tipo de parceria.
