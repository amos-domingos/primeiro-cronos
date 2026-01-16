package com.cronos.alarme

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.WindowManager
import android.app.KeyguardManager
import android.os.Build
import android.provider.Settings
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.util.Log
import java.io.IOException

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupLockScreenFlags()
        checkPermissions()
        
        // Log de diagnóstico
        debugListAssets()

        webView = WebView(this)
        configureWebView()
        
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidAlarm")
        
        // Tentativa de carregar o index.html
        val url = "file:///android_asset/www/index.html"
        Log.d("CRONOS", "Iniciando carregamento da WebView: $url")
        
        webView.loadUrl(url)
        setContentView(webView)
    }

    private fun debugListAssets() {
        try {
            val rootFiles = assets.list("")
            Log.d("CRONOS_DIAG", "Raiz dos Assets contém: ${rootFiles?.joinToString(", ")}")
            
            val wwwFiles = assets.list("www")
            if (wwwFiles.isNullOrEmpty()) {
                Log.e("CRONOS_DIAG", "ERRO: Pasta 'www' não encontrada ou vazia nos assets do APK!")
            } else {
                Log.d("CRONOS_DIAG", "Pasta 'www' ok. Arquivos: ${wwwFiles.joinToString(", ")}")
            }
        } catch (e: IOException) {
            Log.e("CRONOS_DIAG", "Falha catastrófica ao acessar Assets: ${e.message}")
        }
    }

    private fun checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
    }

    private fun setupLockScreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
    }

    private fun configureWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d("WebViewConsole", "[JS] ${consoleMessage?.message()}")
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                Log.d("CRONOS", "Página carregada com sucesso: $url")
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                val failingUrl = request?.url.toString()
                Log.e("WebViewError", "Erro na URL: $failingUrl | Descrição: ${error?.description}")
                
                if (failingUrl.endsWith("index.html")) {
                    val errorHtml = "<html><body style='background:#020617;color:white;display:flex;justify-content:center;align-items:center;height:100vh;text-align:center;font-family:sans-serif;'><div>" +
                            "<h1>CRONOS: Arquivo não encontrado</h1>" +
                            "<p>O Android não incluiu os arquivos da pasta assets/www no APK.</p>" +
                            "<p style='color:#6366f1'>Clique em Build -> Rebuild Project</p></div></body></html>"
                    view?.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null)
                }
            }
        }
    }

    class WebAppInterface(private val mContext: Context) {
        @JavascriptInterface
        fun scheduleAlarm(timeInMillis: Long, label: String) {
            val alarmManager = mContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(mContext, AlarmReceiver::class.java).apply {
                putExtra("ALARM_LABEL", label)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                mContext, 0, intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
        }

        @JavascriptInterface
        fun stopAlarmService() {
            mContext.stopService(Intent(mContext, AlarmService::class.java))
        }
    }
}