self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("company-hub-static-v2")
      .then((cache) =>
        cache.addAll(["/manifest.webmanifest", "/icon.svg", "/apple-icon.svg"]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== "company-hub-static-v2")
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(requestUrl) {
  return (
    requestUrl.origin === self.location.origin &&
    (requestUrl.pathname.startsWith("/_next/static/") ||
      requestUrl.pathname === "/manifest.webmanifest" ||
      requestUrl.pathname === "/icon.svg" ||
      requestUrl.pathname === "/apple-icon.svg" ||
      requestUrl.pathname.endsWith(".woff2"))
  );
}

async function cacheFirst(request) {
  const cache = await caches.open("company-hub-static-v2");
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (isStaticAsset(requestUrl)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "company-hub-sync-queue") {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) =>
        Promise.all(
          clientList.map((client) =>
            client.postMessage({ type: "COMPANY_HUB_SYNC_QUEUE" }),
          ),
        ),
      ),
  );
});

function trackNotificationEvent(notificationId, eventName) {
  if (!notificationId) {
    return Promise.resolve();
  }

  return fetch("/api/notifications/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      notificationId,
      event: eventName,
    }),
  }).catch((error) => {
    console.error("[ServiceWorker] Unable to track notification event.", error);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = new URL(notificationData.url || "/", self.location.origin);

  event.waitUntil(
    Promise.all([
      trackNotificationEvent(notificationData.notificationId, "opened"),
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
    ]),
  );
});
