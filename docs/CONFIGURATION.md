# Configuration Guide

A configuração da plataforma Foto Segundo é gerenciada através de variáveis de ambiente. Siga este guia para configurar corretamente a aplicação em ambientes de desenvolvimento e produção.

## Variáveis de Ambiente

O arquivo `.env` na raiz do projeto é responsável por armazenar as credenciais sensíveis e as URLs de integração. 

### Banco de Dados (Supabase/PostgreSQL)
A plataforma utiliza o Prisma com a extensão pg-adapter para conectar ao banco de dados no Supabase.

```env
# URL de conexão com pool de conexões (usada pelo Prisma Client no runtime)
DATABASE_URL="postgresql://user:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL direta de conexão (usada para rodar as migrations via CLI)
DIRECT_URL="postgresql://user:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Mercado Pago (Pagamentos)
Utilizado para o motor financeiro e splits dinâmicos.

```env
# Access Token da conta Mercado Pago associada à plataforma
MP_ACCESS_TOKEN="APP_USR-..."

# Token de segurança para o Webhook de recebimento de notificações IPN
MP_WEBHOOK_SECRET="v1-..."
```

### Autenticação JWT
Chave simétrica usada para assinar e validar os tokens de sessão dos usuários, convidados e profissionais.

```env
# Mínimo de 32 caracteres gerados aleatoriamente
JWT_SECRET="sua-chave-secreta-muito-segura"
```

### Serviços de E-mail
Serviço SMTP para envio de notificações, links de redefinição de senha e alertas transacionais.

```env
SMTP_HOST="smtp.provedor.com"
SMTP_PORT="587"
SMTP_USER="suporte@fotosegundo.com.br"
SMTP_PASS="senha-do-email"
FRONTEND_URL="http://localhost:5173" # URL base para links nos e-mails
```

### Infraestrutura de Nuvem e Paywall
Chaves para upload e armazenamento de mídia (caso utilize Google Drive ou S3 no ambiente em questão).

```env
# (Variáveis dependentes do driver de storage configurado)
STORAGE_PROVIDER="local" # ou "s3", "gdrive"
```

## Como configurar localmente

1. Crie um arquivo `.env` na raiz do repositório baseado nas chaves de homologação.
2. Não comite o arquivo `.env` no Git (ele já está ignorado no `.gitignore`).
3. Ao executar `npm run dev`, as variáveis serão automaticamente injetadas nos processos Node.js e no build do Vite (para as que iniciam com `VITE_`, caso existam no frontend).

## Tabela de Splits (Configuração em Banco)
A configuração financeira (comissões da plataforma, impostos, taxas) não fica no `.env`, mas sim na tabela `PlatformConfig` no banco de dados. Isso permite atualizar a matriz de Split sem precisar de redeploy.
