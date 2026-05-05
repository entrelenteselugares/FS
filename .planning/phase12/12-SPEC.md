# SPEC-012: Print-Shop Integration (Physical Product Expansion)

## 1. Context & Objectives

Esta fase expande as capacidades transacionais da Foto Segundo, permitindo que clientes adquiram não apenas fotos digitais, mas produtos físicos de um catálogo unificado (Álbuns, Quadros, Revelações). O sistema deve resolver de forma autônoma a precificação, o cálculo de frete e o roteamento de produção (Fulfillment).

### Goals

- Implementar suporte a **Carrinho Híbrido** (Múltiplos produtos físicos + Mídias digitais).
- Integrar **Motor de Logística** para coleta de endereço e cotação de frete baseada em CEP e Volume.
- Criar **Roteamento de Fulfillment**:
  - Instantâneo (Fila local do Printer Agent).
  - Premium (Exportação estruturada para laboratórios parceiros - CK).
- Manter integridade estética **Midnight Luxury v3.2**.

## 2. Technical Architecture (Proposed)

```xml
<Architecture>
  <Module name="OrderEngineV3">
    <Component name="HybridCart">
      <Action>Merge digital media items and PrintProduct entities into a single transaction payload.</Action>
      <DataStructure>Array of { productId, type: "PHYSICAL" | "DIGITAL", mediaRefs: string[], quantity: number }</DataStructure>
    </Component>
    <Component name="LogisticEngine">
      <Input>Destination ZipCode, Origin ZipCode (Event/Franchise), Total Volume (sum of products' dimensions).</Input>
      <Logic>Serviceable check + Dynamic cost addition to Order total.</Logic>
    </Component>
    <Component name="FulfillmentRouter">
      <Strategy name="Instant">
        <Condition>category == "REVELACAO" AND printerAgentActive == true</Condition>
        <Action>Inject into PhygitalQueue with priority.</Action>
      </Strategy>
      <Strategy name="Premium">
        <Condition>category IN ["ALBUM", "QUADRO"]</Condition>
        <Action>Generate CK-Order JSON and flag for partner API submission.</Action>
      </Strategy>
    </Component>
  </Module>
</Architecture>
```

## 3. Data Schema Updates (Prisma)

### `PrintProduct`

- Adicionar campos de volume/peso para frete: `weight`, `width`, `height`, `depth`.
- Adicionar `fulfillmentType`: `INSTANT` | `PARTNER`.

### `Order`

- Adicionar `shippingAddress` (JSON).
- Adicionar `shippingCost` (Decimal).
- Adicionar `trackingCode` (String?).

### `OrderItem`

- Nova model para suportar múltiplos itens no pedido (atualmente `Order` é muito plano).

## 4. Acceptance Criteria (UAT)

1. [ ] Cliente consegue adicionar um Álbum e 10 fotos avulsas no mesmo carrinho.
2. [ ] Sistema exige CEP e calcula valor de frete antes do checkout final.
3. [ ] Após pagamento, um Álbum é gerado na aba "Fulfillment Parceiro" (Admin).
4. [ ] Fotos de revelação instantânea aparecem na fila do `Printer Agent` local imediatamente.
5. [ ] Split de pagamento (Fase 09) continua operando corretamente sobre o valor dos produtos.

## 5. Ambiguity Scoring

- **Technical Complexity**: 0.15 (Temos a base, mas o roteamento exige precisão).
- **External Dependencies**: 0.20 (Cotação de frete e APIs de laboratórios).
- **Scope Clarity**: 0.10 (Requisitos bem definidos).
- **Legacy Impact**: 0.05 (Ajustes no PaymentController).
- **TOTAL AMBIGUITY**: 0.12 (Gate Passed: < 0.20)

