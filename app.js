/* مینووی کڕیار: تەنها نیشاندان. داتا لە menu.json دەخوێندرێتەوە کە سیستەمی کافێ خۆکار نوێی دەکاتەوە. */
(function () {
    "use strict";

    var CACHE_KEY = "rm_menu_v1", THEME_KEY = "rm_theme";
    var root = document.getElementById("app");
    var data = null, sig = "", query = "";
    var els = {};
    var lockSpy = 0, io = null, sheetOpen = false;
    var tableName = "";
    try { tableName = (new URLSearchParams(location.search).get("t") || "").replace(/\s+/g, " ").trim().slice(0, 24); } catch (e) { /* */ }

    /* ───────── ئامار (بێ زانیاری کەسی) — Worker ی Cloudflare دواتر لێرە دادەنرێت ───────── */
    var ANALYTICS_URL = "", DNT = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
    var LS = {
        get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
        set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } }
    };
    var favs = LS.get("rm_fav", []), recent = LS.get("rm_recent", []), favOnly = false;
    var ua = navigator.userAgent || "";
    var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    var isIOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var isAndroid = /android/i.test(ua), inApp = /FBAN|FBAV|Instagram|Snapchat|TikTok|Line\//i.test(ua);
    var deferred = null, sugBound = false;
    var vid = LS.get("rm_vid", null), isNew = !vid;
    if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); LS.set("rm_vid", vid); }
    ANALYTICS_URL = LS.get("rm_an", "");
    var queue = [], qT = 0;
    function track(t, k) {
        if (DNT) return;
        if (queue.length < 40) queue.push({ t: t, k: k ? String(k).slice(0, 60) : "" });
        if (!ANALYTICS_URL) return;
        clearTimeout(qT); qT = setTimeout(flush, 1500);
    }
    function flush() {
        if (!queue.length || !ANALYTICS_URL) return;
        var body = JSON.stringify({ v: vid, d: isIOS ? "ios" : isAndroid ? "android" : "desktop", m: standalone ? "app" : "web", tb: tableName, n: isNew ? 1 : 0, e: queue.splice(0, 30) });
        try { if (!(navigator.sendBeacon && navigator.sendBeacon(ANALYTICS_URL + "/e", body))) fetch(ANALYTICS_URL + "/e", { method: "POST", body: body, keepalive: true, mode: "no-cors" }); } catch (e) { /* */ }
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });

    /* ───────── یاریدەدەرەکان ───────── */
    function h(tag, props) {
        var n = document.createElement(tag);
        if (props) for (var k in props) {
            var v = props[k];
            if (v == null || v === false) continue;
            if (k === "class") n.className = v;
            else if (k === "text") n.textContent = v;
            else if (k === "style") n.style.cssText = v;
            else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
            else n.setAttribute(k, v === true ? "" : v);
        }
        for (var i = 2; i < arguments.length; i++) add(n, arguments[i]);
        return n;
    }
    function add(n, c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) { c.forEach(function (x) { add(n, x); }); return; }
        n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    var ICON = {
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
        sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
        insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/></svg>',
        cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2M15 3v2"/></svg>',
        heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 5 6.200 5c2 0 3.200 1 3.800 2 .6-1 1.800-2 3.800-2 3.200 0 5.300 3.200 3.800 6.700C19.500 16.400 12 21 12 21z"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.600 10.500l6.800-4M8.600 13.500l6.800 4"/></svg>',
        download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
        up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>'
    };
    function icon(name) { var s = document.createElement("span"); s.style.display = "contents"; s.innerHTML = ICON[name] || ""; return s.firstChild || s; }
    function money(n) { try { return Number(n).toLocaleString("en-US"); } catch (e) { return String(n); } }
    function norm(s) { return String(s || "").toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ە/g, "ه").replace(/[\u064B-\u065F\u0640]/g, "").trim(); }
    function safeUrl(u) { u = String(u || "").trim(); return /^https?:\/\//i.test(u) ? u : ""; }
    function when(iso) {
        var d = new Date(iso); if (isNaN(d)) return "";
        function p(x) { return (x < 10 ? "0" : "") + x; }
        return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
    }
    function nch(c) { return c === "ي" ? "ی" : c === "ك" ? "ک" : c === "ە" ? "ه" : c.toLowerCase(); }
    function hl(text, q) {
        text = String(text || ""); var nq = norm(q);
        if (!nq) return text;
        var s = "", map = [];
        for (var i = 0; i < text.length; i++) { var c = text.charAt(i); if (/[\u064B-\u065F\u0640]/.test(c)) continue; s += nch(c); map.push(i); }
        var at = s.indexOf(nq);
        if (at < 0) return text;
        var a = map[at], b = map[at + nq.length - 1] + 1;
        return [text.slice(0, a), h("mark", { text: text.slice(a, b) }), text.slice(b)];
    }
    function minPrice(it) { var v = (it.vars || []).map(function (x) { return x.p; }); return v.length ? Math.min.apply(null, v) : 0; }
    function isFav(it) { return favs.indexOf(it.n) > -1; }
    function heart(it) {
        var b = h("button", { class: "fav" + (isFav(it) ? " on" : ""), type: "button", "aria-label": "دڵخواز", "data-n": it.n });
        b.appendChild(icon("heart"));
        b.addEventListener("click", function (e) { e.stopPropagation(); toggleFav(it); });
        return b;
    }
    function toggleFav(it) {
        var i = favs.indexOf(it.n);
        if (i > -1) favs.splice(i, 1); else { favs.push(it.n); track("fav", it.n); }
        LS.set("rm_fav", favs);
        Array.prototype.forEach.call(document.querySelectorAll(".fav"), function (b) { b.classList.toggle("on", favs.indexOf(b.getAttribute("data-n")) > -1); });
        if (favOnly || (favs.length === 1 && i < 0) || !favs.length) renderList(); else if (els.favChip) els.favChip.lastChild.textContent = favs.length;
        toast(i > -1 ? "لە دڵخوازەکان لابرا" : "زیادکرا بۆ دڵخوازەکان ❤");
    }
    function shareItem(it) {
        var url = location.origin + location.pathname;
        if (navigator.share) { navigator.share({ title: it.n, text: it.n + " · " + (data.cafe || ""), url: url }).catch(function () { /* */ }); track("share", it.n); }
        else { try { navigator.clipboard.writeText(url).then(function () { toast("بەستەر کۆپی کرا"); }); } catch (e) { toast(url); } }
    }
    var toastT = 0;
    function toast(msg) {
        var t = els.toast; if (!t) return;
        t.textContent = msg; t.classList.add("on");
        clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2600);
    }

    /* ───────── دۆخی ڕووناک / تاریک ───────── */
    function theme() { return document.documentElement.getAttribute("data-theme") || "light"; }
    function setTheme(t) {
        document.documentElement.setAttribute("data-theme", t);
        try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* */ }
        var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "dark" ? "#070d20" : "#0c1735");
        if (els.themeBtn) { els.themeBtn.innerHTML = ""; els.themeBtn.appendChild(icon(t === "dark" ? "sun" : "moon")); }
    }

    /* ───────── وێنە ───────── */
    function imgBox(src, label, big) {
        var box = h("span", { class: big ? "sh-img" : "img" });
        box.appendChild(document.createTextNode((label || "☕").trim().charAt(0) || "☕"));
        if (src) {
            var im = h("img", { alt: "", loading: "lazy", decoding: "async" });
            im.addEventListener("load", function () { im.classList.add("ok"); });
            im.addEventListener("error", function () { im.remove(); });
            im.src = src; box.appendChild(im);
        }
        return box;
    }

    /* ───────── کارتی کاڵا ───────── */
    function priceView(it, cur) {
        var v = it.vars || [];
        if (v.length === 1) return h("div", { class: "prices" }, h("span", { class: "price" }, money(v[0].p), h("small", { text: cur })));
        var min = Math.min.apply(null, v.map(function (x) { return x.p; }));
        var pills = v.slice(0, 3).map(function (x) { return h("span", { class: "pill" }, x.n || "", h("em", { text: money(x.p) })); });
        if (v.length > 3) pills.push(h("span", { class: "pill", text: "+" + (v.length - 3) }));
        return h("div", { class: "prices" }, pills);
    }
    function card(it, cat, i) {
        var cur = data.currency || "";
        var b = h("div", { class: "card", role: "button", tabindex: "0", style: "--i:" + Math.min(i, 14) },
            imgBox(it.img, it.n),
            h("div", { class: "info" },
                h("b", null, hl(it.n, query)),
                it.d && data.showDesc !== false ? h("p", { class: "desc", text: it.d }) : null,
                priceView(it, cur)),
            heart(it));
        b.addEventListener("click", function () { openSheet(it, cat); });
        b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(it, cat); } });
        return b;
    }

    /* ───────── وردەکاری کاڵا ───────── */
    function buildSheet() {
        els.shade = h("div", { class: "shade", onclick: function () { closeSheet(true); } });
        els.sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true" });
        document.body.appendChild(els.shade); document.body.appendChild(els.sheet);
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheetOpen) closeSheet(true); });
        window.addEventListener("popstate", function () { if (sheetOpen) closeSheet(false); });
    }
    function showSheet() {
        els.sheet.scrollTop = 0;
        els.shade.classList.add("on"); els.sheet.classList.add("on");
        document.body.classList.add("noscroll");
        if (!sheetOpen) { try { history.pushState({ sheet: 1 }, ""); } catch (e) { /* */ } }
        sheetOpen = true;
    }
    function openPanel(node) {
        els.sheet.innerHTML = "";
        els.sheet.appendChild(h("div", { class: "grab" }));
        els.sheet.appendChild(node);
        showSheet();
    }
    function openSheet(it, cat) {
        track("view", it.n);
        var cur = data.currency || "";
        var fb = heart(it); fb.classList.add("lg"); fb.appendChild(h("span", { text: "دڵخواز" }));
        var sb = h("button", { class: "sh-share", type: "button", onclick: function () { shareItem(it); } }); sb.appendChild(icon("share")); sb.appendChild(h("span", { text: "هاوبەشکردن" }));
        var x = h("button", { class: "sh-close", type: "button", "aria-label": "داخستن", onclick: function () { closeSheet(true); } }); x.appendChild(icon("x"));
        els.sheet.innerHTML = "";
        els.sheet.appendChild(h("div", { class: "grab" }));
        var wrap = h("div", { style: "position:relative" }, imgBox(it.img, it.n, true), x);
        els.sheet.appendChild(wrap);
        els.sheet.appendChild(h("div", { class: "sh-body" },
            h("h3", { text: it.n }),
            h("span", { class: "sh-cat", text: cat.n }),
            h("div", { class: "sh-act" }, fb, sb),
            it.d ? h("p", { text: it.d }) : null,
            h("ul", { class: "sh-vars" }, (it.vars || []).map(function (v) {
                return h("li", null, h("span", { text: v.n || "نرخ" }), h("span", { class: "price" }, money(v.p), h("small", { text: cur })));
            }))));
        els.sheet.scrollTop = 0;
        els.shade.classList.add("on"); els.sheet.classList.add("on");
        document.body.classList.add("noscroll");
        if (!sheetOpen) { try { history.pushState({ sheet: 1 }, ""); } catch (e) { /* */ } }
        sheetOpen = true;
    }
    function closeSheet(fromUi) {
        if (!sheetOpen) return;
        sheetOpen = false;
        els.shade.classList.remove("on"); els.sheet.classList.remove("on");
        document.body.classList.remove("noscroll");
        if (fromUi) { try { if (history.state && history.state.sheet) history.back(); } catch (e) { /* */ } }
    }

    /* ───────── ڕێکخستنی پەڕە ───────── */
    function render() {
        var d = data;
        document.title = (d.cafe || "مینوو") + " · مینوو";
        root.innerHTML = "";

        /* سەرەوە */
        var logo = h("span", { class: "logo" });
        var li = h("img", { src: "logo.svg", alt: "" }); li.addEventListener("error", function () { logo.innerHTML = ""; logo.appendChild(icon("cup")); logo.firstChild.style.cssText = "width:34px;height:34px;color:#f4ea2a"; });
        logo.appendChild(li);
        els.themeBtn = h("button", { class: "icon-btn", type: "button", "aria-label": "ڕەنگ", onclick: function () { setTheme(theme() === "dark" ? "light" : "dark"); } });
        var input = h("input", { type: "search", placeholder: "گەڕان لە مینوو...", autocomplete: "off", enterkeyhint: "search", "aria-label": "گەڕان" });
        var clear = h("button", { class: "clear", type: "button", "aria-label": "پاککردنەوە" }); clear.appendChild(icon("x"));
        var sbox = h("div", { class: "search" }, input, clear);
        sbox.insertBefore(icon("search"), clear);
        var t = 0;
        els.sbox = sbox; els.input = input;
        els.sug = h("div", { class: "sug", role: "listbox" }); sbox.appendChild(els.sug);
        input.addEventListener("focus", sugRender);
        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { commitSearch(input.value); closeSug(); input.blur(); } else if (e.key === "Escape") closeSug();
        });
        if (!sugBound) { sugBound = true; document.addEventListener("pointerdown", function (e) { if (els.sbox && !els.sbox.contains(e.target)) closeSug(); }); }
        input.addEventListener("input", function () {
            sugRender();
            clearTimeout(t); t = setTimeout(function () { query = input.value; sbox.classList.toggle("has", !!query); renderList(); }, 120);
        });
        clear.addEventListener("click", function () { input.value = ""; query = ""; sbox.classList.remove("has"); renderList(); input.focus(); });

        els.offline = h("div", { class: "offline", text: "ئینتەرنێت نییە، دوایین مینووی هەڵگیراو نیشان دەدرێت" });
        var hero = h("header", { class: "hero" }, h("div", { class: "hero-in" },
            h("div", { class: "top" },
                h("div", { class: "brand" }, logo, h("div", { class: "brand-tx" }, h("b", { text: d.cafe || "مینوو" }), d.tagline ? h("small", { text: d.tagline }) : null)),
                els.themeBtn),
            tableName ? h("span", { class: "tbl-chip" }, "🪑 مێزی " + tableName) : null,
            sbox));
        root.appendChild(hero);
        root.appendChild(els.offline);

        els.bar = h("div", { class: "cats-in", role: "tablist" });
        root.appendChild(h("div", { class: "cats" }, els.bar));
        els.list = h("main", { class: "wrap" });
        root.appendChild(els.list);
        root.appendChild(footer());
        if (!els.toast) { els.toast = h("div", { class: "toast", role: "status" }); document.body.appendChild(els.toast); }
        if (!els.sheet) buildSheet();
        if (!els.top) {
            els.top = h("button", { class: "to-top", type: "button", "aria-label": "سەرەوە", onclick: function () { window.scrollTo({ top: 0, behavior: "smooth" }); } });
            els.top.appendChild(icon("up")); document.body.appendChild(els.top);
            window.addEventListener("scroll", function () { els.top.classList.toggle("on", window.pageYOffset > 700); }, { passive: true });
            var seen = false; try { seen = sessionStorage.getItem("rm_s") === "1"; sessionStorage.setItem("rm_s", "1"); } catch (e) { /* */ }
            if (!seen) track("visit", tableName);
            setTimeout(maybeBanner, 6000);
        }
        setTheme(theme());
        renderList();
    }

    function closeSug() { if (els.sug) els.sug.classList.remove("on"); }
    function commitSearch(term) {
        term = String(term || "").replace(/\s+/g, " ").trim();
        if (term.length < 2) return;
        recent = [term].concat(recent.filter(function (x) { return x !== term; })).slice(0, 6);
        LS.set("rm_recent", recent); track("search", term);
    }
    function setQuery(v) {
        els.input.value = v; query = v; els.sbox.classList.toggle("has", !!v);
        renderList(); closeSug(); els.input.blur(); commitSearch(v);
    }
    function sugRender() {
        var box = els.sug, q = els.input.value, nq = norm(q);
        box.innerHTML = "";
        if (!nq) {
            if (!recent.length) { box.classList.remove("on"); return; }
            box.appendChild(h("div", { class: "sug-h" }, h("span", { text: "گەڕانی دوایین" }),
                h("button", { type: "button", class: "sug-clr", text: "پاککردنەوە", onclick: function () { recent = []; LS.set("rm_recent", recent); sugRender(); } })));
            var wrap = h("div", { class: "sug-chips" });
            recent.forEach(function (r) { wrap.appendChild(h("button", { type: "button", class: "sug-chip", text: r, onclick: function () { setQuery(r); } })); });
            box.appendChild(wrap); box.classList.add("on"); return;
        }
        var hits = [];
        (data.categories || []).forEach(function (c) {
            (c.items || []).forEach(function (it) {
                var pos = norm(it.n).indexOf(nq);
                if (pos > -1 || norm(it.d).indexOf(nq) > -1) hits.push({ it: it, c: c, rank: pos === 0 ? 0 : pos > -1 ? 1 : 2 });
            });
        });
        hits.sort(function (a, b) { return a.rank - b.rank; });
        var total = hits.length; hits = hits.slice(0, 6);
        if (!hits.length) { box.appendChild(h("div", { class: "sug-empty", text: "هیچ شتێک نەدۆزرایەوە" })); box.classList.add("on"); return; }
        hits.forEach(function (x) {
            var row = h("button", { type: "button", class: "sug-it", role: "option" }, imgBox(x.it.img, x.it.n),
                h("span", { class: "sug-tx" }, h("b", null, hl(x.it.n, q)), h("small", { text: x.c.n })),
                h("span", { class: "sug-p" }, money(minPrice(x.it)), h("small", { text: data.currency || "" })));
            row.addEventListener("click", function () { commitSearch(q); closeSug(); els.input.blur(); openSheet(x.it, x.c); });
            box.appendChild(row);
        });
        if (total > hits.length) box.appendChild(h("button", { type: "button", class: "sug-all", text: "بینینی هەموو " + total + " ئەنجامەکە", onclick: function () { commitSearch(q); closeSug(); els.input.blur(); } }));
        box.classList.add("on");
    }

    function renderList() {
        if (favOnly && !favs.length) favOnly = false;
        var q = norm(query), cats = (data.categories || []);
        els.list.innerHTML = ""; els.bar.innerHTML = "";
        if (io) { io.disconnect(); io = null; }
        var shown = [], n = 0;
        cats.forEach(function (c) {
            var items = (c.items || []).filter(function (it) {
                if (favOnly && !isFav(it)) return false;
                if (!q) return true;
                return norm(it.n).indexOf(q) > -1 || norm(it.d).indexOf(q) > -1 || (it.vars || []).some(function (v) { return norm(v.n).indexOf(q) > -1; });
            });
            if (items.length) shown.push({ c: c, items: items });
        });
        if (!shown.length) {
            els.list.appendChild(h("div", { class: "empty" }, icon("search"), h("div", { text: q ? "هیچ شتێک نەدۆزرایەوە" : "مینوو هێشتا بەتاڵە" })));
            return;
        }
        els.favChip = null;
        if (favs.length) {
            els.favChip = h("button", { class: "chip fav-chip" + (favOnly ? " on" : ""), type: "button" }, "❤ دڵخوازەکان", h("small", { class: "cnt", text: favs.length }));
            els.favChip.addEventListener("click", function () { favOnly = !favOnly; renderList(); try { window.scrollTo({ top: Math.max(0, els.list.offsetTop - 70), behavior: "smooth" }); } catch (e) { /* */ } });
            els.bar.appendChild(els.favChip);
        }
        shown.forEach(function (s) {
            var c = s.c;
            var chip = h("button", { class: "chip", type: "button", role: "tab", "data-id": c.id }, c.icon ? h("img", { src: c.icon, alt: "", loading: "lazy" }) : null, c.n);
            chip.addEventListener("click", function () {
                var sec = els.list.querySelector('[data-cat="' + c.id + '"]'); if (!sec) return;
                track("cat", c.n); lockSpy = Date.now() + 900; activate(c.id);
                sec.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            els.bar.appendChild(chip);
            var head = h("h2", null, c.icon ? h("img", { src: c.icon, alt: "" }) : null, c.n, h("small", { text: s.items.length }));
            var grid = h("div", { class: "grid" }, s.items.map(function (it) { return card(it, c, n++); }));
            els.list.appendChild(h("section", { class: "sec", "data-cat": c.id }, head, grid));
        });
        if (!favOnly) activate(shown[0].c.id);
        if ("IntersectionObserver" in window && !q && !favOnly) {
            io = new IntersectionObserver(function (es) {
                if (Date.now() < lockSpy) return;
                es.forEach(function (e) { if (e.isIntersecting) activate(e.target.getAttribute("data-cat")); });
            }, { rootMargin: "-90px 0px -70% 0px", threshold: 0 });
            Array.prototype.forEach.call(els.list.querySelectorAll(".sec"), function (s) { io.observe(s); });
        }
    }

    function activate(id) {
        var on = null;
        Array.prototype.forEach.call(els.bar.children, function (c) {
            var is = c.getAttribute("data-id") === String(id);
            c.classList.toggle("on", is); c.setAttribute("aria-selected", is);
            if (is) on = c;
        });
        if (on && on.scrollIntoView) { try { on.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); } catch (e) { /* */ } }
    }

    /* ───────── دابەزاندن (Android / iPhone) ───────── */
    function installPanel() {
        var steps = isIOS
            ? ["لە Safari، دوگمەی هاوبەشکردن (Share ⬆) لە خوارەوە دابگرە", "بچۆ خوارەوە و «Add to Home Screen» هەڵبژێرە", "«Add» دابگرە، ئایکۆنی ڕۆما دەکەوێتە سەر شاشەکەت"]
            : ["لەسەر سێ خاڵەکەی براوزەر (⋮) دابگرە", "«Install app» یان «Add to Home screen» هەڵبژێرە", "دووپاتی بکەرەوە، ئایکۆنی ڕۆما دەکەوێتە سەر شاشەکەت"];
        return h("div", { class: "sh-body ins-panel" },
            h("img", { class: "ins-logo", src: "icon-192.png", alt: "" }),
            h("h3", { text: "مینووی ڕۆما لەسەر شاشەکەت" }),
            h("p", { text: "وەک ئەپێکی ڕاستەقینە دەکرێتەوە، خێراتر و لە ئینتەرنێتی لاوازیش کار دەکات." }),
            inApp ? h("p", { class: "ins-warn", text: "ئێستا لەناو ئەپێکی تر (ئینستاگرام/فەیسبووک...) کراوەتەوە. سەرەتا بە " + (isIOS ? "Safari" : "Chrome") + " بیکەرەوە." }) : null,
            h("ol", { class: "ins-steps" }, steps.map(function (s, i) { return h("li", null, h("span", { text: i + 1 }), h("div", { text: s })); })),
            h("button", { class: "ins-ok", type: "button", text: "تێگەیشتم", onclick: function () { closeSheet(true); } }));
    }
    function doInstall() {
        if (deferred) {
            var p = deferred; deferred = null; track("install_prompt");
            p.prompt();
            p.userChoice.then(function (r) { track(r && r.outcome === "accepted" ? "install_accept" : "install_dismiss"); hideBanner(); }, function () { /* */ });
            return;
        }
        openPanel(installPanel());
    }
    function hideBanner() { if (els.ban) { els.ban.classList.remove("on"); var b = els.ban; setTimeout(function () { b.remove(); }, 400); els.ban = null; } }
    function maybeBanner() {
        if (standalone || els.ban || !data || !(deferred || isIOS)) return;
        if (LS.get("rm_ins_until", 0) > Date.now()) return;
        var x = h("button", { class: "ins-x", type: "button", "aria-label": "داخستن", onclick: function () { LS.set("rm_ins_until", Date.now() + 7 * 864e5); hideBanner(); } }); x.appendChild(icon("x"));
        els.ban = h("div", { class: "ins-ban", role: "dialog" },
            h("img", { src: "icon-192.png", alt: "" }),
            h("div", { class: "ins-tx" }, h("b", { text: "مینووی ڕۆما لەسەر شاشەکەت" }), h("small", { text: isIOS ? "ئایکۆن بخەرە سەر شاشەی ئایفۆنەکەت" : "ئەپی خێرا، بێ گەڕان لە براوزەر" })),
            h("button", { class: "ins-go", type: "button", text: isIOS ? "چۆن؟" : "دابەزاندن", onclick: doInstall }), x);
        document.body.appendChild(els.ban);
        requestAnimationFrame(function () { requestAnimationFrame(function () { if (els.ban) els.ban.classList.add("on"); }); });
    }
    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; setTimeout(maybeBanner, 5000); });
    window.addEventListener("appinstalled", function () { deferred = null; LS.set("rm_ins_until", Date.now() + 3650 * 864e5); track("installed"); hideBanner(); toast("مینوو دابەزێنرا ✓"); });

    /* ───────── خوارەوە: زانیاری کافێ ───────── */
    function footer() {
        var i = data.info || {}, rows = [];
        if (i.phone) rows.push(h("a", { class: "row", href: "tel:" + String(i.phone).replace(/[^\d+]/g, "") }, icon("phone"), h("span", { text: i.phone, dir: "ltr", style: "text-align:start" })));
        if (i.instagram) {
            var ig = safeUrl(i.instagram) || "https://instagram.com/" + String(i.instagram).replace(/^@/, "").replace(/[^\w.]/g, "");
            rows.push(h("a", { class: "row", href: ig, target: "_blank", rel: "noopener" }, icon("insta"), h("span", { text: "ئینستاگرام" })));
        }
        if (safeUrl(i.facebook)) rows.push(h("a", { class: "row", href: safeUrl(i.facebook), target: "_blank", rel: "noopener" }, icon("link"), h("span", { text: "فەیسبووک" })));
        if (safeUrl(i.tiktok)) rows.push(h("a", { class: "row", href: safeUrl(i.tiktok), target: "_blank", rel: "noopener" }, icon("link"), h("span", { text: "تیکتۆک" })));
        if (safeUrl(i.map)) rows.push(h("a", { class: "row", href: safeUrl(i.map), target: "_blank", rel: "noopener" }, icon("pin"), h("span", { text: i.address || "ناونیشان لەسەر نەخشە" })));
        else if (i.address) rows.push(h("div", { class: "row" }, icon("pin"), h("span", { text: i.address })));
        if (i.hours) rows.push(h("div", { class: "row" }, icon("clock"), h("span", { text: i.hours })));
        if (i.wifi) {
            var w = h("button", { class: "row", type: "button" }, icon("wifi"), h("span", { text: "وایفای: " + i.wifi + (i.wifiPass ? " · " + i.wifiPass : ""), dir: "auto" }), i.wifiPass ? h("em", { text: "کۆپی" }) : null);
            if (i.wifiPass) w.addEventListener("click", function () {
                try { navigator.clipboard.writeText(i.wifiPass).then(function () { toast("وشەی نهێنی کۆپی کرا"); }, function () { toast(i.wifiPass); }); } catch (e) { toast(i.wifiPass); }
            });
            rows.push(w);
        }
        if (!standalone) { var ib = h("button", { class: "row", type: "button", onclick: doInstall }, icon("download"), h("span", { text: "دابەزاندنی مینوو لەسەر مۆبایل" }), h("em", { text: "نوێ" })); rows.push(ib); }
        els.upd = h("p", { class: "upd", text: data.updated ? "دوا نوێکردنەوەی مینوو: " + when(data.updated) : "" });
        return h("footer", { class: "foot" }, rows.length ? h("div", { class: "info-card" }, h("h4", { text: "زانیاری و پەیوەندی" }), h("div", { class: "rows" }, rows)) : null, els.upd, h("p", { class: "pw", text: "Powered by Cortexa" }));
    }

    /* ───────── بارکردنی داتا ───────── */
    function signature(d) { return String(d.updated || "") + "|" + (d.categories || []).length + "|" + JSON.stringify(d).length; }
    function readCache() { try { var s = localStorage.getItem(CACHE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
    function writeCache(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch (e) { /* */ } }

    function apply(d, silent) {
        if (d.analytics && /^https:\/\/[\w.-]+(\/[\w.~-]*)*$/.test(d.analytics) && d.analytics.replace(/\/$/, "") !== ANALYTICS_URL) { ANALYTICS_URL = d.analytics.replace(/\/$/, ""); LS.set("rm_an", ANALYTICS_URL); }
        if (ANALYTICS_URL && queue.length) { clearTimeout(qT); qT = setTimeout(flush, 800); }
        var s = signature(d), changed = s !== sig;
        if (!changed) { if (els.offline) els.offline.classList.remove("on"); return; }
        var first = !data; data = d; sig = s;
        var y = window.pageYOffset;
        render();
        if (!first) { try { window.scrollTo(0, y); } catch (e) { /* */ } if (!silent) toast("مینوو نوێ کرایەوە ✓"); }
    }

    function showError() {
        root.innerHTML = "";
        root.appendChild(h("div", { class: "err" }, h("h3", { text: "مینوو نەکرایەوە" }), h("p", { text: "ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەرەوە." }),
            h("button", { type: "button", onclick: function () { load(); } }, "دووبارە هەوڵ بدەرەوە")));
    }

    function load() {
        return fetch("menu.json", { cache: "no-cache" }).then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        }).then(function (d) {
            if (!d || !d.categories) throw new Error("bad");
            writeCache(d); if (!d.analytics && ANALYTICS_URL) { ANALYTICS_URL = ""; LS.set("rm_an", ""); } apply(d, !data);
        }).catch(function () {
            if (data) { if (els.offline) els.offline.classList.add("on"); return; }
            var c = readCache();
            if (c) { apply(c, true); if (els.offline) els.offline.classList.add("on"); } else showError();
        });
    }

    /* پێش هەموو شتێک: نیشاندانی خێرا لە cache ی مۆبایل، دواتر نوێکردنەوە لە ئینتەرنێت */
    var cached = readCache();
    if (cached && cached.categories) apply(cached, true);
    load();

    /* مینوو لە کاتی کراوەبوونی پەڕە خۆی نوێ دەکاتەوە */
    setInterval(function () { if (!document.hidden) load(); }, 90000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) load(); });
    window.addEventListener("online", load);

    if ("serviceWorker" in navigator && location.protocol === "https:") {
        window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () { /* */ }); });
    }
})();