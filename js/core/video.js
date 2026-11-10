/* PunctuAction — "PunctuAction TV": animated, narrated video tutorials.
   Timing is driven by the narration itself: every sentence is spoken to the end (or, without a voice,
   shown for its reading time) before the animation moves on, so pictures, captions and voice always match. */
(function () {
  const PA = (window.PA = window.PA || {});
  const { esc } = PA;
  let open = null;

  const Video = {
    /** Open a video by id. opts.onGo(hash) is used for the end-screen button. */
    play(id, { startShot = 0 } = {}) {
      const v = PA.VIDEOS && PA.VIDEOS[id];
      if (!v) return PA.toast("Video not found.");
      if (open) open.close();
      const back = document.createElement("div");
      back.className = "vp-back";
      back.innerHTML = `<div class="vp" role="dialog" aria-label="Video: ${esc(v.title)}">
        <div class="vp-top"><span class="vp-logo">${PA.logo(26)}</span><b>${esc(v.title)}</b><span class="vp-live">● TUTORIAL</span><button class="vp-x" aria-label="Close video">✕</button></div>
        <div class="vp-stage" id="vpStage"><div class="vp-layer" id="vpLayer"></div>
          <div class="vp-presenter" id="vpPres"></div>
          <div class="vp-cap" id="vpCap"></div>
          <button class="vp-big" id="vpBig" aria-label="Play">▶</button></div>
        <div class="vp-bar" id="vpBar">${v.shots.map((s, i) => `<button class="vp-seg" data-s="${i}" title="${esc(s.label || "Part " + (i + 1))}"><i></i></button>`).join("")}</div>
        <div class="vp-ctrl"><button data-c="prev" aria-label="Previous part">⏮</button><button data-c="pp" class="vp-pp" aria-label="Play or pause">▶</button><button data-c="next" aria-label="Next part">⏭</button><button data-c="replay" aria-label="Replay part">↺</button>
          <span class="vp-time" id="vpTime"></span><span class="grow"></span>
          <button data-c="speed" id="vpSpeed" title="Speed">1×</button><button data-c="cc" id="vpCC" class="on" title="Subtitles">CC</button><button data-c="voice" id="vpVoice" class="on" title="Narration voice">🔊</button><button data-c="fs" title="Full screen">⛶</button></div></div>`;
      document.body.appendChild(back);
      const $ = (s) => back.querySelector(s);
      const layer = $("#vpLayer"), cap = $("#vpCap"), pres = $("#vpPres");
      const st = { s: 0, k: 0, playing: false, run: 0, speed: PA.settings.get("vpSpeed", 1), voice: PA.settings.get("vpVoice", true), cc: true, presenter: v.presenter || "bip" };
      $("#vpSpeed").textContent = st.speed + "×"; $("#vpVoice").classList.toggle("on", st.voice); $("#vpVoice").textContent = st.voice ? "🔊" : "🔇";
      const setPres = (name, mood) => { st.presenter = name || st.presenter; pres.innerHTML = PA.mascot(st.presenter, { size: 150, mood: mood || "happy", cls: "bob" }) + `<span class="vp-name">${{ bip: "Bip", dot: "Dotty", koma: "Koma", quizzy: "Quizzy", zing: "Zing" }[st.presenter]}</span>`; };
      const close = () => { st.run++; PA.Voice.stop(); back.remove(); document.removeEventListener("keydown", onKey); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); open = null; };
      open = { close };

      /* ---------- rendering a shot ---------- */
      function render(i) {
        const sh = v.shots[i];
        layer.className = "vp-layer";
        void layer.offsetWidth;
        layer.classList.add("vp-in");
        if (sh.kind === "screen") {
          layer.innerHTML = `<div class="vp-device"><div class="vp-zoom" id="vpZoom"><img src="assets/video/${sh.img}.jpg" alt="" draggable="false"><div class="vp-ring" id="vpRing"></div><div class="vp-hand" id="vpHand">👆</div></div></div>${sh.label ? `<div class="vp-chip">${esc(sh.label)}</div>` : ""}`;
        } else if (sh.kind === "title") {
          layer.innerHTML = `<div class="vp-title"><div class="vp-tmasc">${PA.mascot(sh.mascot || "bip", { size: 170, mood: "happy", cls: "bob" })}</div><div><div class="vp-tnum">${esc(sh.kicker || v.title)}</div><h2>${esc(sh.title)}</h2>${sh.sub ? `<p>${esc(sh.sub)}</p>` : ""}</div></div>`;
          PA.sfx("whoosh");
        } else if (sh.kind === "scene") {
          layer.innerHTML = `<div class="vp-scene">${sh.html()}</div>`;
        }
        $$(".vp-seg").forEach((b, j) => { b.classList.toggle("done", j < i); b.classList.toggle("cur", j === i); b.querySelector("i").style.width = j < i ? "100%" : "0"; });
        $("#vpTime").textContent = `Part ${i + 1} of ${v.shots.length}`;
        if (sh.presenter) setPres(sh.presenter);
        pres.style.display = sh.kind === "title" || sh.wide ? "none" : "";
        const sc = layer.querySelector(".vp-scene"); if (sc && sh.wide) sc.classList.add("wide");
      }
      const $$ = (s) => Array.from(back.querySelectorAll(s));
      function act(sh, k, instant) {
        const a = (sh.acts || {})[k]; if (!a) return;
        const map = (PA.SHOTMAP || {})[sh.img] || {};
        const rectOf = (sel) => (Array.isArray(sel) ? sel : map[sel]);
        if (sh.kind === "screen") {
          const z = layer.querySelector("#vpZoom"), ring = layer.querySelector("#vpRing"), hand = layer.querySelector("#vpHand");
          if (instant) [z, ring, hand].forEach((e) => (e.style.transition = "none"));
          if (a.zoom !== undefined) {
            const r = rectOf(a.focus || a.ring || a.point);
            if (a.zoom > 1 && r) {
              const zf = a.zoom, cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
              const lim = 0.5 / zf, ccx = Math.min(1 - lim, Math.max(lim, cx)), ccy = Math.min(1 - lim, Math.max(lim, cy));
              z.style.transform = `scale(${zf}) translate(${(0.5 - ccx) * 100}%, ${(0.5 - ccy) * 100}%)`;
            } else z.style.transform = "none";
          }
          if (a.ring !== undefined) { const r = rectOf(a.ring); if (r) Object.assign(ring.style, { left: r[0] * 100 + "%", top: r[1] * 100 + "%", width: r[2] * 100 + "%", height: r[3] * 100 + "%", opacity: 1 }); else ring.style.opacity = 0; }
          if (a.point !== undefined) { const r = rectOf(a.point); if (r) { Object.assign(hand.style, { left: (r[0] + r[2] / 2) * 100 + "%", top: (r[1] + r[3] * 0.6) * 100 + "%", opacity: 1 }); hand.classList.remove("tap"); if (a.tap && !instant) setTimeout(() => { hand.classList.add("tap"); PA.sfx("tap"); }, 900); } else hand.style.opacity = 0; }
          if (instant) requestAnimationFrame(() => [z, ring, hand].forEach((e) => (e.style.transition = "")));
        }
        if (a.fn && !instant) try { a.fn(layer); } catch (e) {}
        if (a.fn && instant && a.keep) try { a.fn(layer); } catch (e) {}
        if (a.presenter) setPres(a.presenter, "talk");
        if (a.sfx && !instant) PA.sfx(a.sfx);
      }
      function caption(text) {
        let html = "", last = 0; const re = /\S+/g; let m;
        while ((m = re.exec(text))) { html += esc(text.slice(last, m.index)) + `<span data-s="${m.index}">${esc(m[0])}</span>`; last = m.index + m[0].length; }
        cap.innerHTML = `<span class="vp-captext">${html}</span>`; cap.style.visibility = st.cc ? "visible" : "hidden";
        return (pos) => { let best = null; cap.querySelectorAll("[data-s]").forEach((w) => { if (+w.dataset.s <= pos) best = w; }); cap.querySelectorAll(".on").forEach((w) => w.classList.remove("on")); if (best) best.classList.add("on"); };
      }
      function fill(i, frac) { const seg = $$(".vp-seg")[i]; if (seg) seg.querySelector("i").style.width = Math.min(100, frac * 100) + "%"; }

      /* ---------- the narration-driven timeline ---------- */
      async function run(fromShot, fromK) {
        const my = ++st.run;
        for (let i = fromShot; i < v.shots.length; i++) {
          st.s = i; const sh = v.shots[i]; render(i);
          const say = sh.say || [];
          const startK = i === fromShot ? fromK : 0;
          for (let k = 0; k < startK; k++) act(sh, k, true);
          await PA.sleep(sh.kind === "title" ? 500 : 650);
          for (let k = startK; k < say.length; k++) {
            if (my !== st.run) return;
            st.k = k; fill(i, k / Math.max(1, say.length));
            act(sh, k, false);
            const hl = caption(say[k]);
            setPres(null, "talk");
            await PA.Voice.speak(say[k], { mode: "natural", rate: 0.92 * st.speed, clipRate: st.speed, silent: !st.voice, onWord: hl, voice: PA.Voice.narrator() });
            if (my !== st.run) return;
            setPres(null, "happy");
            const a = (sh.acts || {})[k];
            if (a && a.demo) {
              const el = layer.querySelector(a.demo.el || ".vp-demo");
              cap.innerHTML = `<span class="vp-captext">🔊 ${esc(a.demo.text)}</span>`;
              if (el) await PA.ReadAlong.play(el, a.demo.text, { emotion: a.demo.emo, robot: !!a.demo.robot, silent: !st.voice, pitch: a.demo.pitch || 1, clipRate: st.speed, markSounds: false });
              if (my !== st.run) return;
            }
            fill(i, (k + 1) / Math.max(1, say.length));
            await PA.sleep(Math.round(450 / st.speed));
          }
          if (!say.length) await PA.sleep(2600 / st.speed);
          if (my !== st.run) return;
          fill(i, 1);
          await PA.sleep(Math.round(700 / st.speed));
        }
        if (my !== st.run) return;
        finished();
      }
      function finished() {
        st.playing = false; $(".vp-pp").textContent = "▶";
        cap.innerHTML = "";
        layer.innerHTML = `<div class="vp-title vp-end"><div class="vp-tmasc">${PA.mascot("bip", { size: 160, mood: "happy", cls: "bob" })}</div><div><div class="vp-tnum">Well done!</div><h2>You finished “${esc(v.title)}”</h2>
          <div class="row" style="margin-top:14px"><button class="btn btn-ghost" data-end="replay" style="color:#fff;border-color:rgba(255,255,255,.4)">↺ Watch again</button>${v.go ? `<button class="btn btn-feel" data-end="go">${esc(v.goLabel || "Let's try it!")} ➡</button>` : ""}</div></div></div>`;
        PA.jingle(); PA.confetti(80);
        layer.onclick = (e) => { const b = e.target.closest("[data-end]"); if (!b) return; if (b.dataset.end === "replay") start(0, 0); else { close(); location.hash = v.go; } };
      }
      function start(s, k) { layer.onclick = null; st.playing = true; $(".vp-pp").textContent = "❚❚"; $("#vpBig").hidden = true; run(s, k); }
      function pause() { st.playing = false; st.run++; PA.Voice.stop(); $(".vp-pp").textContent = "▶"; $("#vpBig").hidden = false; setPres(null, "happy"); }
      const toggle = () => (st.playing ? pause() : start(st.s, st.k));

      back.addEventListener("click", (e) => {
        if (e.target === back) return close();
        if (e.target.closest(".vp-x")) return close();
        if (e.target.closest("#vpBig")) return start(st.s, st.k);
        const seg = e.target.closest(".vp-seg"); if (seg) { PA.Voice.stop(); return start(+seg.dataset.s, 0); }
        const c = e.target.closest("[data-c]"); if (!c) return;
        const k = c.dataset.c;
        if (k === "pp") toggle();
        if (k === "prev") { PA.Voice.stop(); start(Math.max(0, st.s - (st.k > 0 ? 0 : 1)), 0); }
        if (k === "next") { PA.Voice.stop(); if (st.s < v.shots.length - 1) start(st.s + 1, 0); }
        if (k === "replay") { PA.Voice.stop(); start(st.s, 0); }
        if (k === "speed") { const sp = [0.8, 1, 1.2]; st.speed = sp[(sp.indexOf(st.speed) + 1) % 3]; c.textContent = st.speed + "×"; PA.settings.set("vpSpeed", st.speed); }
        if (k === "cc") { st.cc = !st.cc; c.classList.toggle("on", st.cc); cap.style.visibility = st.cc ? "visible" : "hidden"; }
        if (k === "voice") { st.voice = !st.voice; c.classList.toggle("on", st.voice); c.textContent = st.voice ? "🔊" : "🔇"; PA.settings.set("vpVoice", st.voice); if (st.playing) { pause(); start(st.s, st.k); } }
        if (k === "fs") { const el = back.querySelector(".vp"); if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); }
      });
      const onKey = (e) => { if (e.key === "Escape") close(); if (e.key === " ") { e.preventDefault(); toggle(); } if (e.key === "ArrowRight") back.querySelector('[data-c="next"]').click(); if (e.key === "ArrowLeft") back.querySelector('[data-c="prev"]').click(); };
      document.addEventListener("keydown", onKey);
      setPres(v.presenter || "bip", "happy");
      render(startShot); st.s = startShot;
      cap.innerHTML = `<span class="vp-captext">Press ▶ to start the video${PA.Voice.hasVoices() ? "" : " (no computer voice on this device, so read the subtitles)"}.</span>`;
      start(startShot, 0); // the click that opened the video counts as permission to speak
      return open;
    },
    close() { open && open.close(); }
  };
  PA.Video = Video;

  /* thumbnail card HTML for a video (used in Help Centre and Teacher guide) */
  PA.videoCard = (id) => {
    const v = PA.VIDEOS[id]; if (!v) return "";
    const first = v.shots.find((s) => s.kind === "screen");
    return `<button class="vcard" data-video="${id}"><span class="vthumb" style="${first ? `background-image:url(assets/video/${first.img}.jpg)` : ""}"><span class="vplay">▶</span><span class="vdur">${v.shots.length} parts</span></span>
      <span class="vmeta"><b>${v.icon || "🎬"} ${esc(v.title)}</b><span>${esc(v.blurb || "")}</span></span></button>`;
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-video]"); if (b && !b.closest(".vp")) { e.preventDefault(); Video.play(b.dataset.video); } });
})();
