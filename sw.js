const CACHE_NAME = "war-clans-v1";

// files that make the UI work offline (app shell)
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  // add fonts if you host them locally:
  // "./fonts/Clash_Regular.otf",
  // "./fonts/Clash_Bold.otf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always try network for clans.json (so war data stays live)
  if (url.pathname.endsWith("/clans.json")) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // For navigation + static assets = cache-first, then network fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((resp) => resp || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((resp) => {
          // optionally cache new static stuff
          if (resp.ok && event.request.method === "GET") {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
      );
    })
  );
});
