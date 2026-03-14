const CACHE_NAME = "semachat-app-v2";
const OFFLINE_ASSETS = [
  "/",
  "/manifest.json",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "/static/js/script.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "SemaChat", body: "Nouveau signalement près de vous.", url: "/", priority: "INFO" };
  if (event.data) {
    try {
      payload = Object.assign(payload, event.data.json());
    } catch (_error) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/static/icons/icon-192.png",
    badge: payload.badge || "/static/icons/icon-192.png",
    vibrate: payload.vibrate || [220, 120, 220],
    data: { url: payload.url || "/", priority: payload.priority || "INFO", message: payload.body || "" },
    actions: [
      { action: "view_map", title: "Voir sur la carte" },
      { action: "close", title: "Fermer" }
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || "SemaChat", options),
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
        windows.forEach((client) =>
          client.postMessage({
            type: "ADMIN_BROADCAST",
            message: payload.body || "",
            priority: payload.priority || "INFO",
            url: payload.url || "/",
          })
        );
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  const action = event.action || "view_map";
  event.notification.close();
  if (action === "close") return;
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(targetUrl));
});
