var CACHE = "asret-v3";
var SHELL = ["./", "index.html", "config.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  var font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !font) return;   // طلبات Apps Script تروح للشبكة مباشرة

  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {

      // الخطوط: من الكاش فورًا وتتحدث في الخلفية
      if (font) {
        var f = fetch(req).then(function (res) {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || f;
      }

      // ملفات التطبيق: دايمًا الأحدث من الشبكة، ولو بطيئة (3 ثواني) أو مقطوعة نرجع للمحفوظة
      var net = fetch(new Request(req.url, { cache: "no-cache" })).then(function (res) {
        if (res.redirected) return fetch(req);
        if (!res.ok) return hit || res;
        cache.put(req, res.clone());
        return res;
      });
      if (!hit) return net;
      return Promise.race([
        net.catch(function () { return hit; }),
        new Promise(function (resolve) { setTimeout(function () { resolve(hit); }, 3000); })
      ]);
    });
  }));
});
