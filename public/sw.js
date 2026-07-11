self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = new URL(notificationData.url || "/", self.location.origin);

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        const samePageClient = clientList.find((client) => {
          try {
            return new URL(client.url).href === targetUrl.href;
          } catch {
            return false;
          }
        });

        if (samePageClient) {
          return samePageClient.focus();
        }

        const companyHubClient = clientList.find((client) => {
          try {
            return new URL(client.url).origin === self.location.origin;
          } catch {
            return false;
          }
        });

        if (companyHubClient) {
          return companyHubClient
            .focus()
            .then((client) => client.navigate(targetUrl.href));
        }

        return clients.openWindow(targetUrl.href);
      }),
  );
});
