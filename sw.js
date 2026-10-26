// Keeps the app working offline. The version changes on every build so phones pick up updates.
const CACHE = "mi-ropa-8441b13bcf";
const FILES = ["./", "index.html", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && req.mode === "navigate") {
    // Page: network first so updates arrive, but only good answers replace the saved copy,
    // and after 3 seconds without an answer (bad signal) the saved copy opens instead.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const guardada = await cache.match("index.html");
      const red = fetch(req).then((r) => {
        if (r.ok && r.type === "basic") { cache.put("index.html", r.clone()); return r; }
        return guardada || r;
      }).catch(() => guardada || Response.error());
      if (!guardada) return red;
      return Promise.race([red, new Promise((res) => setTimeout(() => res(guardada), 3000))]);
    })());
    return;
  }
  // Live data from other sites (the weather) is never cached here: the app keeps its own copy.
  if (url.origin !== location.origin && !/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) return;
  // Everything else (icons, Google Fonts): cache first, fill on the way.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
