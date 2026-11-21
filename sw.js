/* Service Worker: دوای یەکەم کردنەوە، مینوو لە ئینتەرنێتی لاوازیش دەکرێتەوە */
"use strict";
var V = "rm-v3";
var SHELL = ["./", "index.html", "app.css", "app.js", "theme.js", "icon.svg", "logo.svg", "icon-192.png", "icon-512.png", "manifest.webmanifest", "fonts/noto-sans-arabic-arabic-wght-normal.woff2", "fonts/noto-sans-arabic-latin-wght-normal.woff2"];

self.addEventListener("install", function (e) {
    e.waitUntil(caches.open(V).then(function (c) {
        return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () { }); }));
    }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
    e.waitUntil(caches.keys().then(function (ks) {
        return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});

function networkFirst(req) {
    return fetch(req, { cache: "no-cache" }).then(function (res) {
        if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); }
        return res;
    }).catch(function () { return caches.match(req, { ignoreSearch: true }); });
}
function cacheFirst(req) {
    return caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
            if (res && (res.ok || res.type === "opaque")) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); }
            return res;
        });
    });
}
function staleWhileRevalidate(req) {
    return caches.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
            if (res && (res.ok || res.type === "opaque")) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); }
            return res;
        }).catch(function () { return hit; });
        return hit || net;
    });
}

self.addEventListener("fetch", function (e) {
    var req = e.request;
    if (req.method !== "GET") return;
    var url = new URL(req.url);
    if (url.origin !== location.origin) {
        if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req));
        return;
    }
    var p = url.pathname;
    if (/menu\.json$/.test(p) || req.mode === "navigate") e.respondWith(networkFirst(req));
    else if (/\/(img|fonts)\//.test(p)) e.respondWith(cacheFirst(req));
    else e.respondWith(staleWhileRevalidate(req));
});