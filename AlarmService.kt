package com.cronos.alarme

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat

class AlarmService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "cronos_alarm_channel"
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "Alarme Ativo",
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("CRONOS")
            .setContentText("O alarme está tocando...")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(
                PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE),
                true
            )
            .build()

        startForeground(1, notification)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}