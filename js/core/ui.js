/* PunctuAction — tiny UI toolkit (no frameworks, works offline & from file://) */
(function () {
  const PA = (window.PA = window.PA || {});

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = (p = "id") => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rand(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

  function fmtDate(ts, withTime = true) {
    if (!ts) return "—";
    const d = new Date(ts);
    const opt = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) Object.assign(opt, { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleString("en-GB", opt);
  }
  function ago(ts) {
    if (!ts) return "never";
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " d ago";
  }

  function toast(msg, type = "") {
    let w = $(".toast-wrap");
    if (!w) { w = document.createElement("div"); w.className = "toast-wrap"; document.body.appendChild(w); }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    w.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2400);
    setTimeout(() => t.remove(), 2800);
  }

  /** modal({title, body, actions:[{label, cls, value, onClick}], dismissable}) -> Promise(value) */
  function modal({ title = "", body = "", actions = [{ label: "OK", cls: "btn-ask", value: true }], dismissable = true, wide = false, onOpen } = {}) {
    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.className = "modal-back";
      back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" ${wide ? 'style="max-width:880px"' : ""}>
        ${title ? `<h2>${title}</h2>` : ""}<div class="modal-body">${body}</div>
        <div class="modal-actions">${actions.map((a, i) => `<button class="btn ${a.cls || ""}" data-i="${i}">${a.label}</button>`).join("")}</div></div>`;
      const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey); resolve(v); };
      const onKey = (e) => { if (e.key === "Escape" && dismissable) close(undefined); };
      back.addEventListener("click", async (e) => {
        if (e.target === back && dismissable) return close(undefined);
        const b = e.target.closest("[data-i]");
        if (!b || !b.closest(".modal-actions")) return;
        const a = actions[+b.dataset.i];
        if (a.onClick) { const r = await a.onClick(back); if (r === false) return; }
        close(a.value);
      });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(back);
      if (onOpen) onOpen(back);
      const first = back.querySelector("input,textarea,select") || back.querySelector(".modal-actions .btn:last-child");
      first && first.focus();
    });
  }
  const confirmBox = (title, body, yes = "Yes", cls = "btn-stop") =>
    modal({ title, body: `<p>${body}</p>`, actions: [{ label: "Cancel", cls: "btn-ghost", value: false }, { label: yes, cls, value: true }] });

  /** Very small hash router: routes = { "home": fn(params), "learn/:id": fn } */
  function Router(routes, fallback = "home") {
    const compiled = Object.keys(routes).map((k) => {
      const keys = [];
      const re = new RegExp("^" + k.replace(/:(\w+)/g, (_, n) => (keys.push(n), "([^/]+)")) + "$");
      return { re, keys, fn: routes[k] };
    });
    function run() {
      const raw = (location.hash || "#/" + fallback).replace(/^#\/?/, "");
      const [path, qs] = raw.split("?");
      const query = Object.fromEntries(new URLSearchParams(qs || ""));
      for (const r of compiled) {
        const m = path.match(r.re);
        if (m) {
          const params = { query };
          r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
          return r.fn(params);
        }
      }
      location.hash = "#/" + fallback;
    }
    window.addEventListener("hashchange", run);
    return { run, go: (p) => (location.hash = "#/" + p) };
  }

  function download(name, data, type = "application/json") {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function pickFile(accept = ".json") {
    return new Promise((resolve) => {
      const i = document.createElement("input");
      i.type = "file"; i.accept = accept;
      i.onchange = () => resolve(i.files[0] || null);
      i.click();
    });
  }
  const readText = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
  const blobToB64 = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  function b64ToBlob(dataUrl) {
    const [head, body] = dataUrl.split(",");
    const mime = (head.match(/:(.*?);/) || [])[1] || "application/octet-stream";
    const bin = atob(body); const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  /* Plays an audio Blob; returns {promise, stop} */
  let currentAudio = null;
  function playBlob(blob, { rate = 1 } = {}) {
    stopAudio();
    const a = new Audio(URL.createObjectURL(blob));
    a.playbackRate = rate;
    currentAudio = a;
    const promise = new Promise((res) => { a.onended = () => res(true); a.onerror = () => res(false); a.play().catch(() => res(false)); });
    return { promise, audio: a, stop: () => { a.pause(); } };
  }
  function stopAudio() { if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; } }

  /* Small inline SVG bar chart (teacher dashboards) */
  function bars(items, { max = 100, unit = "%", h = 22 } = {}) {
    return `<div class="hbars">${items.map((it) => `<div class="hbar"><span class="hb-l">${esc(it.label)}</span>
      <span class="hb-t"><i style="width:${clamp((it.value / max) * 100, 0, 100)}%;background:${it.color || "var(--ask)"};height:${h}px"></i></span>
      <span class="hb-v">${it.text != null ? it.text : Math.round(it.value) + unit}</span></div>`).join("")}</div>`;
  }

  Object.assign(PA, { $, $$, esc, uid, rand, pick, shuffle, sample, clamp, sleep, avg, fmtDate, ago, toast, modal, confirmBox, Router, download, pickFile, readText, blobToB64, b64ToBlob, playBlob, stopAudio, bars });
})();
