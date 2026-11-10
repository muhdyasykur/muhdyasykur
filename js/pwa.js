/* PunctuAction — offline support. When served over http(s), a service worker caches every file so the app
   keeps working with no internet. (Opening the files directly from a folder also works without it.) */
(function () {
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
