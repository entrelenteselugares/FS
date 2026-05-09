# Skill: Teste de Lançamento - UNIDADE FIXA (CARTORIO/UNIDADE)

Esta skill define o protocolo de validação para o braço logístico e ponto de impressão.

## Descrição

Validação da fila de impressão em tempo real, integração com Printer Agent e vendas de balcão.

## Requisitos de Verificação (UAT)

1. **Monitor de Impressão:** Atualização automática (Real-time) da fila quando um pedido é pago.
2. **Integração IoT:** Comunicação bem-sucedida entre o backend e o Printer Agent local.
3. **Download de Mídia:** Capacidade de baixar o arquivo original em alta resolução para impressão.
4. **Venda de Balcão:** Funcionamento do QR Code da unidade para captura de clientes presenciais.
5. **Confirmação de Fulfillment:** Botão de "Confirmar Impressão" que limpa a fila e atualiza o status do pedido.

## Instruções de Execução

1. Faça login como UNIDADE FIXA.
2. Abra o Monitor de Impressão em `/unidade-fixa`.
3. Realize um pedido de teste como cliente e faça o pagamento simulado.
4. Verifique se o pedido aparece na fila da unidade em menos de 10 segundos.
5. Verifique se o Printer Agent (se instalado) detectou o novo arquivo.
6. Clique em "Imprimir" e depois em "Confirmar" para verificar se o pedido sai da fila.
7. Teste o acesso via QR Code da Unidade e veja se o cliente é vinculado corretamente ao ponto fixo.
