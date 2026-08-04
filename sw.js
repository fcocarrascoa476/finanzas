const CACHE = "finanzas-v9";
const SHELL = ["./index.html", "./chart.min.js", "./manifest.webmanifest",
               "./icono-192.png", "./icono-512.png"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));

self.addEventListener("activate", e =>
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim())));

self.addEventListener("fetch", e => {
  const path = new URL(e.request.url).pathname;
  // index.html y data.enc: RED PRIMERO (siempre lo más fresco cuando hay internet),
  // con caída al cache si estás sin conexión. Así los cambios de la app llegan solos.
  const redPrimero = path.endsWith("/") || path.endsWith("index.html") || path.endsWith("data.enc");
  if (redPrimero) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // chart.js, iconos, manifest: cache primero (casi nunca cambian).
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
