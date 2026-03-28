// Minimal placeholder service worker to satisfy /firebase-messaging-sw.js requests
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
// No-op handlers to avoid errors if a script attempts to register
self.addEventListener('push', () => {});
self.addEventListener('notificationclick', () => {});
