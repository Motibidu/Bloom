importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCSYSzOq10W7pP-BnhAkY1gyn4Qhqpxjlc',
  authDomain: 'bloom-24742.firebaseapp.com',
  projectId: 'bloom-24742',
  storageBucket: 'bloom-24742.firebasestorage.app',
  messagingSenderId: '302647318161',
  appId: '1:302647318161:web:031ba297b87e3d8efcd130',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || payload.notification?.title
  const body = payload.data?.body || payload.notification?.body
  if (!title) return
  self.registration.showNotification(title, {
    body: body ?? '',
    icon: '/icon.png',
    data: { url: payload.data?.url ?? '/' },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
