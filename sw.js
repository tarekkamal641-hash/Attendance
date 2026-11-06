// Service worker: تحديث تلقائي للتطبيق + إشعارات الموبايل (Web Push)
// config.js بيعرّف window.APPS_SCRIPT_URL؛ جوه الـ service worker مفيش window فبنعمله اسم بديل لنفس الـ self
self.window = self;
try { importScripts("config.js"); } catch (e) {}

var CACHE = "asret-v4";
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

      // ملفات التطبيق: دايمًا الأحدث من الشبكة، ولو بطيئة (3 ثواني) أو مقطوعة نرجع للنسخة المحفوظة
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

// ---------- إشعارات الموبايل ----------
// السيرفر بيبعت نبضة فاضية، فهنا بنسأله "إيه الجديد؟" (بعنوان اشتراك الجهاز) ونعرض الإشعار
function fetchPending_() {
  return self.registration.pushManager.getSubscription().then(function (sub) {
    var url = self.APPS_SCRIPT_URL;
    if (!sub || !url) return [];
    return fetch(url, {
      method: "POST", redirect: "follow", credentials: "omit",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: "pushFetch", args: [sub.endpoint] })
    }).then(function (r) { return r.json(); }).then(function (d) {
      return (d && d.ok && d.data && d.data.items) || [];
    });
  }).catch(function () { return []; });
}

self.addEventListener("push", function (e) {
  e.waitUntil(fetchPending_().then(function (items) {
    // لازم نعرض إشعار مع كل نبضة (شرط المتصفح). لو مفيش جديد بنعرض إشعار عام بيستبدل نفسه
    if (!items.length) items = [{ title: "أسرة الرسل", body: "فيه تحديث جديد في التطبيق", tag: "asret-generic" }];
    return Promise.all(items.map(function (it) {
      var opts = { body: it.body || "", icon: "icon-192.png", badge: "icon-192.png", dir: "rtl", lang: "ar", data: { url: it.url || "./" } };
      if (it.tag === "asret-generic" || it.tag === "asret-multi") { opts.tag = it.tag; opts.renotify = true; }
      return self.registration.showNotification(it.title || "أسرة الرسل", opts);
    }));
  }));
});

// الضغط على الإشعار: يفتح التطبيق (أو يرجّع الشاشة المفتوحة قدام)
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var target = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) {
      if (cs[i].url.indexOf(self.registration.scope) === 0 && "focus" in cs[i]) return cs[i].focus();
    }
    return self.clients.openWindow(target);
  }));
});
