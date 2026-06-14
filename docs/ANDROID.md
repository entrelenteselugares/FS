<!-- generated-by: gsd-doc-writer -->

# Android Development Guide (Capacitor)

Este documento descreve as práticas, configurações e fluxos para o desenvolvimento, build e manutenção do aplicativo Android da plataforma **Foto Segundo**, empacotado via **Capacitor**.

## 1. Visão Geral

A aplicação Frontend web (`/frontend`) é empacotada como um aplicativo Android nativo utilizando o **Capacitor v8**.
A pasta `/frontend/android` contém todo o projeto Android Studio que é alimentado pelos builds da aplicação web (`dist`).

## 2. Configuração de Plugins (capacitor.config.ts)

Atualmente configuramos nativamente os seguintes plugins:

- **Splash Screen**: Duração mínima de 2000ms, fundo preto (`#000000`), loader nativo habilitado, modo Immersive em Tela Cheia.

## 3. Pré-requisitos para Android

- **Android Studio** instalado.
- SDKs do Android configurados na máquina (API 34+ recomendada).
- Node.js e dependências do projeto já instaladas.

## 4. Fluxo de Build e Sincronização

Sempre que alterações estruturais forem feitas na aplicação Web ou nos plugins do Capacitor, você precisará sincronizar as mudanças com o projeto Android.

1. **Faça o build da aplicação Web:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Sincronize com o Capacitor (copia a pasta `dist` para o app nativo e atualiza dependências):**

   ```bash
   npx cap sync android
   ```

3. **Abra o projeto no Android Studio para compilar, assinar ou testar em emuladores:**

   ```bash
   npx cap open android
   ```

## 5. Integração de Login Social (Deep Linking)

A plataforma utiliza o **Supabase Auth** para autenticação (E-mail, Google, Apple). No contexto do app Android, redirecionamentos web puros causam bugs no OAuth. Por isso, implementamos Deep Linking.

- **Scheme:** `com.fotosegundo.app`
- **Callback URL:** `com.fotosegundo.app://auth-callback`
- O código do `AuthContext.tsx` automaticamente detecta quando está rodando nativamente (`Capacitor.isNativePlatform()`) e utiliza o `@capacitor/browser` em conjunto com a URL de redirecionamento nativa.
- **IMPORTANTE:** Ao provisionar o projeto no Supabase (Painel de Autenticação), a URL `com.fotosegundo.app://auth-callback` **deve obrigatoriamente** estar cadastrada na lista de *Allowed Redirect URLs*, caso contrário o login social ficará em branco ou bloqueado no celular.

## 6. Permissões Essenciais

O `AndroidManifest.xml` do aplicativo deve declarar permissões cruciais para o funcionamento do motor de captura (Phygital Capture) e interações nativas:

- `android.permission.INTERNET`
- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES`
- `android.permission.WRITE_EXTERNAL_STORAGE`

## 7. Publicação

Para publicar na Play Store:

1. Abra o Android Studio.
2. Certifique-se de que os ícones e Splash Screens (via `capacitor-assets`) estão gerados corretamente.
3. No menu **Build**, selecione **Generate Signed Bundle / APK**.
4. Utilize a chave de assinatura (Keystore) do Foto Segundo para gerar a versão Release.

## 8. Boas Práticas e Solução de Problemas Conhecidos (Troubleshooting)

### Uploads via CapacitorHttp e Vercel (Boundary Loss)

Uploads de arquivos pelo Android (usando o plugin nativo `CapacitorHttp`) costumam corromper o cabeçalho *multipart/form-data* (Boundary) quando enviados para ambientes Serverless (Vercel).

- **Solução implementada:** O aplicativo envia os arquivos como `application/octet-stream` puro em vez de `FormData`.
- O backend (`app.ts`) usa `express.raw({ type: 'application/octet-stream' })` para interpretar os binários do aplicativo nativo, contornando a necessidade do `multer`.

### Idempotência em Uploads em Lote (Rede Instável)

Quando o fotógrafo/cliente sobe um lote grande de fotos no Android via 3G/4G, a conexão pode piscar e o aplicativo tentar reenviar o mesmo arquivo, gerando duplicações (20+ cópias da mesma foto).

- **Mecanismo:** Cada foto processada no frontend recebe um `queueItemId` único (`uuid`).
- Esse ID é repassado no Header ou URL ao backend e salvo na coluna `metadata` (JSON) da tabela `EventMedia`.
- Antes de salvar no Supabase, o serviço `phygital.service.ts` varre o banco buscando a existência do `queueItemId` e, se encontrar, bloqueia a duplicação.
- **Offline Persistence (Phase 72):** A fila nativa do aplicativo utiliza o IndexedDB integrado no webview do Capacitor para guardar as imagens localmente. Se o aplicativo fechar, a fila é restaurada e os uploads são resumidos de onde pararam.

### Detalhamento de Erros de Upload

Anteriormente, falhas de timeout, cota do Supabase Storage excedida ou quebras de Memória no *Sharp* eram maquiadas pelo `Axios` no Android como apenas `Network Error` ou `Falha na conexão`.

- **Mecanismo:** O `UploadQueueContext.tsx` agora intercepta o objeto `error.response?.data?.details` repassado diretamente pelo Express e escreve o motivo exato sob a miniatura falhada, viabilizando depuração em ambiente de produção para os usuários do App.
