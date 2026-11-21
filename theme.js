/* دۆخی ڕووناک/تاریک پێش یەکەم نیشاندان، بۆ ئەوەی فلاش نەکات */
(function () {
  try {
    var t = localStorage.getItem("rm_theme");
    if (!t) t = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) { document.documentElement.setAttribute("data-theme", "light"); }
})();
