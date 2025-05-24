const VERSION = "v3";
const CACHE_NAME = `tcgp-shell-${VERSION}`;
const SHELL = [
  "./", // la root dell’app
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-1024.png",
  "./main.js",
];

// 1) Al momento dell’installazione pre-cache dell’app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// 2) Sul fetch, rispondi sempre con cache-first
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// 3) Al activate, pulisci eventuali cache vecchie
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});
