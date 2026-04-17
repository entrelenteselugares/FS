# Documentação de Infraestrutura e APIs - Foto Segundo

Este documento consolida as chaves de acesso e procedimentos para a integração das APIs e serviços da plataforma. O sistema foi resetado conforme solicitado para um novo início "Clean Slate".

## 1. Vercel (Hospedagem & Deployment)
- **URL de Produção**: `https://foto-segundo.vercel.app`
- **Ambiente**: Next.js 16 (App Router)
- **Variáveis de Ambiente Obrigatórias**:
  - `NEXT_PUBLIC_APP_URL`: URL base da aplicação.
  - `NEXT_PUBLIC_MP_PUBLIC_KEY`: Chave pública do Mercado Pago.
  - `DATABASE_URL`: String de conexão com o Supabase.

## 2. Supabase (Banco de Dados & Auth)
- **Tecnologia**: PostgreSQL (Instância AWS sa-east-1)
- **Conexão**: Via Prisma (Porta 6543 - Connection Pooling)
- **Autenticação**: Gerenciada via JWT personalizado (JWT_SECRET) ou Supabase Auth.
- **Armazenamento (Storage)**: Bucket `midias` configurado para fotos brutas e processadas.

## 3. GitHub (Controle de Versão)
- **Repositório**: `entrelenteselugares/FS` (Branch: `main`)
- **Workflow**: O deploy na Vercel é automático ao realizar push na branch `main`.

## 4. Mercado Pago (Pagamentos)
- **SDK**: SDK v2 para Node.js.
- **Integração**: Tokenização dinâmica (Web-tokenizer) para cartões e geração de QR Code Pix.

---

### Status do Reset:
- **Código Fonte**: Apagado (`/src`).
- **Componentes**: Apagados (`/components`).
- **Prisma**: Esquema removido para redefinição.
- **Public**: Assets removidos.

*Este documento é a única referência técnica restante para o novo início do zero.*
