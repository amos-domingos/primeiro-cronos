
// Service Worker desativado para garantir funcionamento local no APK
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
