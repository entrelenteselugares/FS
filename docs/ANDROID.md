<!-- generated-by: gsd-doc-writer -->

# Android Development Guide (Capacitor)

Este documento descreve as práticas, configurações e fluxos para o desenvolvimento, build e manutenção do aplicativo Android da plataforma **Foto Segundo**, empacotado via **Capacitor**.

## 1. Visão Geral

A aplicação Frontend web (`/frontend`) é empacotada como um aplicativo Android nativo utilizando o **Capacitor**. 
A pasta `/frontend/android` contém todo o projeto Android Studio que é alimentado pelos builds da aplicação web (`dist`).

## 2. Pré-requisitos para Android

- **Android Studio** instalado.
- SDKs do Android configurados na máquina.
- Node.js e dependências do projeto já instaladas.

## 3. Fluxo de Build e Sincronização

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

## 4. Integração de Login Social (Deep Linking)

A plataforma utiliza o **Supabase Auth** para autenticação (E-mail, Google, Apple). No contexto do app Android, redirecionamentos web puros causam bugs no OAuth. Por isso, implementamos Deep Linking.

- **Scheme:** `com.fotosegundo.app`
- **Callback URL:** `com.fotosegundo.app://auth-callback`
- O código do `AuthContext.tsx` automaticamente detecta quando está rodando nativamente (`Capacitor.isNativePlatform()`) e utiliza o `@capacitor/browser` em conjunto com a URL de redirecionamento nativa.
- **IMPORTANTE:** Ao provisionar o projeto no Supabase (Painel de Autenticação), a URL `com.fotosegundo.app://auth-callback` **deve obrigatoriamente** estar cadastrada na lista de *Allowed Redirect URLs*, caso contrário o login social ficará em branco ou bloqueado no celular.

## 5. Permissões Essenciais

O `AndroidManifest.xml` do aplicativo deve declarar permissões cruciais para o funcionamento do motor de captura (Phygital Capture) e interações nativas:
- `android.permission.INTERNET`
- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES`
- `android.permission.WRITE_EXTERNAL_STORAGE`

## 6. Publicação

Para publicar na Play Store:
1. Abra o Android Studio.
2. Certifique-se de que os ícones e Splash Screens (via `capacitor-assets`) estão gerados corretamente.
3. No menu **Build**, selecione **Generate Signed Bundle / APK**.
4. Utilize a chave de assinatura (Keystore) do Foto Segundo para gerar a versão Release.
