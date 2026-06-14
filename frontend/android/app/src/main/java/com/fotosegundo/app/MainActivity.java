package com.fotosegundo.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.os.Build;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ocultar a barra inferior (botoes de navegacao do telefone) e sobrepor a barra superior
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            
            // Fazer a status bar ficar transparente
            getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
            
            // Obter controller para ocultar barra de navegacao
            final WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Oculta a barra de navegacao do sistema (botoes de voltar, home, apps)
                controller.hide(WindowInsets.Type.navigationBars());
                // Permite mostrar a barra ao arrastar de baixo para cima e ocultar automaticamente (Sticky Immersive)
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            // Suporte para versoes anteriores do Android
            int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                          | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                          | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            getWindow().getDecorView().setSystemUiVisibility(uiOptions);
            getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        }
    }
}
