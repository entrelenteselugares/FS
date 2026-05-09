# Skill: Teste de Lançamento - CLIENTE PRIVADO (CLIENTE)

Esta skill define o protocolo de validação para a jornada do usuário final (Consumidor).

## Descrição

Validação da jornada do cliente, desde o resgate de fotos até a materialização (compra) e gestão de memórias.

## Requisitos de Verificação (UAT)

1. **Resgate via PIN:** Funcionamento do desbloqueio de fotos em eventos Flash.
2. **Visualização de Galeria:** Renderização rápida de miniaturas e visualização em alta definição (modal).
3. **Fluxo de Checkout:** Adição de produtos ao carrinho e geração de cobrança PIX.
4. **Cofre de Memórias:** Inscrição em planos de assinatura e sistema de votação de fotos.
5. **Meus Pedidos:** Acompanhamento do status de entrega dos produtos adquiridos.

## Instruções de Execução

1. Acesse o link de um evento (ex: `/e/nome-do-evento`).
2. Digite um PIN válido e verifique se a foto é desbloqueada.
3. Adicione a foto ao carrinho e escolha um produto físico (ex: Revelação 10x15).
4. Siga para o checkout e verifique se o QR Code do PIX é gerado corretamente.
5. Acesse `/cofres`, crie um novo cofre e convide um amigo via link de convite.
6. Realize um voto em uma foto e verifique se o contador é atualizado.
