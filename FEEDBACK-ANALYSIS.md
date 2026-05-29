# Feedback Analysis: Horários Errados no Painel Admin

## User Intent

O usuário queria visualizar e agendar eventos com os horários corretos no fuso horário local (Brasil/Brasília) no painel administrativo (`AdminEvents.tsx`).

## Friction Point

Ao criar ou visualizar um evento, o horário exibido na tabela e no formulário de edição está divergente do horário que foi inserido, tipicamente com um desvio de 3 horas (fuso horário do Brasil). Isso causa confusão e atrasos operacionais.

## Diagnosis

O problema é um bug técnico no tratamento de fusos horários (Timezone Mismatch).

1. O formulário do frontend usa um input `<input type="datetime-local">` que salva a data no formato `"YYYY-MM-DDTHH:mm"` (sem informação de fuso horário).
2. O frontend envia essa string exata (ex: `"2026-06-02T15:00"`) para o backend.
3. O backend (`admin.controller.ts`), rodando em um servidor configurado em UTC (ex: Vercel, AWS), converte essa string com `new Date("2026-06-02T15:00")`. Por faltar o offset, o Node.js assume que a hora enviada *já está em UTC*, salvando `15:00 UTC` no banco de dados.
4. Quando o frontend busca essa data, recebe `"2026-06-02T15:00:00.000Z"`. Ao converter de volta para o fuso local do navegador (ex: GMT-3), o horário é ajustado para `12:00` (menos 3 horas).

## Action Plan

1. **No Frontend (`AdminEvents.tsx`)**:
   - Antes de enviar o formulário para o backend (no `handleCreate`), converter a string do `datetime-local` para um objeto `Date` no fuso do navegador e enviar a string ISO final (`new Date(formData.date).toISOString()`), que inclui corretamente o tempo em UTC.
2. **Correção de Exibição (Opcional mas Recomendado)**:
   - Certificar-se de que outros painéis que enviam datas também enviem no formato ISO completo, garantindo consistência.
3. **Migração/Fix de Dados**:
   - Pode ser necessário rodar um script simples para corrigir os horários dos eventos existentes no banco de dados (somar 3 horas aos eventos criados incorretamente) caso o impacto seja crítico para eventos futuros.
