import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fotosegundo.app',
  appName: 'Foto Segundo',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    // Permite mixed content (https para imagens externas do R2/CDN)
    allowMixedContent: true,
    // Habilita cache do WebView — sem isso o Android re-baixa cada imagem
    initialFocus: true,
  },
  // Permite requests para o backend de produção e R2
  server: {
    allowNavigation: [
      'foto-segundo.vercel.app',
      'fs-backend-beige.vercel.app',
      '*.r2.cloudflarestorage.com',
      '*.supabase.co',
    ],
  },
};

export default config;
