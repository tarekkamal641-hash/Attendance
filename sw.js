/* Service Worker بسيط - أسرة الرسل
 * وجوده شرط من المتصفح عشان التطبيق يتثبّت على الموبايل. مفيش تخزين مؤقت ولا شغل بدون نت:
 * كل طلب بيروح للشبكة مباشرة، وأي تحديث بتنزّليه على الاستضافة بيظهر في نفس اللحظة.
 */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) {
  // امسحي أي كاش قديم لو اتعمل من نسخة سابقة
  event.waitUntil(
    caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function () { /* من غير تدخّل: الطلبات بتروح للشبكة */ });
