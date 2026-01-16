
package com.cronos.alarme

import android.Manifest
import android.app.Activity
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.RingtoneManager
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import android.app.KeyguardManager
import android.os.Build
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView

    private val ringtonePickerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val uri: Uri? = result.data?.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            if (uri != null) {
                val ringtone = RingtoneManager.getRingtone(this, uri)
                val name = ringtone.getTitle(this)
                webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('systemSoundSelected', { detail: { uri: '${uri}', name: '${name}' } }));", null)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupLockScreenFlags()
        checkPermissions()
        
        webView = WebView(this)
        configureWebView()
        
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
            override fun onPageFinished(view: WebView?, url: String?) {
                webView.evaluateJavascript("window.isAndroidReady = true;", null)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d("CRONOS_JS", "[${consoleMessage?.messageLevel()}] ${consoleMessage?.message()}")
                return true
            }
        }

        webView.addJavascriptInterface(WebAppInterface(this, webView, ringtonePickerLauncher), "AndroidAlarm")
        
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
        setContentView(webView)
    }

    private fun checkPermissions() {
        val permissions = mutableListOf(Manifest.permission.WAKE_LOCK, Manifest.permission.VIBRATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        val toRequest = permissions.filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (toRequest.isNotEmpty()) ActivityCompat.requestPermissions(this, toRequest.toTypedArray(), 101)
    }

    private fun setupLockScreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
    }

    private fun configureWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        webView.evaluateJavascript("window.dispatchEvent(new Event('alarmTriggered'));", null)
    }

    class WebAppInterface(private val mContext: Context, private val webView: WebView, private val launcher: androidx.activity.result.ActivityResultLauncher<Intent>) {
        @JavascriptInterface
        fun scheduleAlarm(timeInMillis: Long, label: String) {
            val alarmManager = mContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(mContext, AlarmReceiver::class.java).apply { putExtra("ALARM_LABEL", label) }
            val pendingIntent = PendingIntent.getBroadcast(mContext, label.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
            else alarmManager.setExact(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
        }

        @JavascriptInterface
        fun stopAlarmService() {
            mContext.stopService(Intent(mContext, AlarmService::class.java))
        }

        @JavascriptInterface
        fun getSystemRingtones() {
            try {
                val manager = RingtoneManager(mContext)
                manager.setType(RingtoneManager.TYPE_ALARM)
                val cursor = manager.cursor
                val list = JSONArray()
                while (cursor.moveToNext()) {
                    val title = cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX)
                    val uri = manager.getRingtoneUri(cursor.position).toString()
                    val item = JSONObject()
                    item.put("name", title)
                    item.put("uri", uri)
                    list.put(item)
                }
                val json = list.toString()
                (mContext as Activity).runOnUiThread {
                    webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('systemRingtonesLoaded', { detail: $json }));", null)
                }
            } catch (e: Exception) {
                Log.e("CRONOS_BRIDGE", "Erro ao listar ringtones", e)
            }
        }

        @JavascriptInterface
        fun pickSystemSound() {
            val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
                putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Sons do Android")
                putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, null as Uri?)
            }
            (mContext as Activity).runOnUiThread { launcher.launch(intent) }
        }
    }
}
