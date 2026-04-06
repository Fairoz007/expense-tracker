self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Expense Reminder';
  const options = {
    body: data.body || 'Don\'t forget to track your expenses today!',
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
