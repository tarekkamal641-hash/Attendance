تثبيت التطبيق على الموبايل (PWA) - من غير شغل بدون نت
====================================================
التطبيق بيتثبّت كأيقونة على الموبايل وبيفتح بشاشة كاملة، لكنه محتاج إنترنت عشان يشتغل (مفيش تخزين بيانات على الجهاز).

1) Apps Script: استبدلي Code.gs ثم Deploy > Manage deployments > Edit > New version > Deploy.
   لازم: Execute as = Me ، Who has access = Anyone. وانسخي رابط الـ /exec.
2) افتحي config.js والصقي الرابط:   window.APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
3) GitHub: New repository (Public) > uploading an existing file > ارفعي محتويات الفولدر (index.html, sw.js, manifest.webmanifest, config.js, وفولدر icons) > Commit.
4) Settings > Pages > Deploy from a branch > main / (root) > Save. الرابط: https://اسمك.github.io/اسم-الريبو/
5) على الموبايل: أندرويد (Chrome) شريط "تثبيت" أو القايمة > Install app. آيفون (Safari) المشاركة > إضافة إلى الشاشة الرئيسية.

للتحديث: ارفعي الملف الجديد على GitHub والتغيير بيظهر بعد دقيقة تقريباً من غير أي خطوات للمستخدمين.
رابط Apps Script القديم لسه شغال زي ما هو.
