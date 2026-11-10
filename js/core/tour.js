/* PunctuAction — "Watch how" tutorials: a narrated, auto-playing walkthrough (like a video) with an animated hand.
   Works offline. Each page registers its own steps. */
(function () {
  const PA = (window.PA = window.PA || {});
  let active = null;

  const Tour = {
    async play(steps, { title = "Tutorial" } = {}) {
      if (active) active.close();
      const shade = document.createElement("div"); shade.className = "tour-shade";
      const hole = document.createElement("div"); hole.className = "tour-hole";
      const hand = document.createElement("div"); hand.className = "tour-hand"; hand.textContent = "👆";
      const badge = document.createElement("div"); badge.className = "tour-badge"; badge.textContent = "Tutorial · " + title;
      const player = document.createElement("div"); player.className = "tour-player";
      player.innerHTML = `<div style="width:64px;flex:none">${PA.mascot("bip", { mood: "talk", size: 64 })}</div>
        <div class="t-text"><div class="t-title"></div><div class="t-body"></div>
        <div class="tour-ctrls"><button class="btn btn-sm btn-ghost" data-t="prev" aria-label="Previous">⏮</button>
        <button class="btn btn-sm btn-ask" data-t="pp" aria-label="Pause">⏸</button>
        <button class="btn btn-sm btn-ghost" data-t="next" aria-label="Next">⏭</button>
        <div class="tour-progress"><i></i></div><span class="small muted t-count"></span>
        <button class="btn btn-sm btn-stop" data-t="close">✕ Close</button></div></div>`;
      document.body.append(shade, hole, hand, badge, player);
      hand.style.left = innerWidth / 2 + "px"; hand.style.top = innerHeight + "px";
      let i = 0, playing = true, timer = null, startT = 0, dur = 0, raf = 0, runId = 0;
      const bar = player.querySelector(".tour-progress i");
      const close = () => { runId++; clearTimeout(timer); cancelAnimationFrame(raf); PA.Voice.stop(); [shade, hole, hand, badge, player].forEach((e) => e.remove()); active = null; };
      const tick = () => { if (!playing) return; bar.style.width = Math.min(100, ((performance.now() - startT) / dur) * 100) + "%"; raf = requestAnimationFrame(tick); };
      async function show(n) {
        const my = ++runId;
        i = Math.max(0, Math.min(steps.length - 1, n));
        const st = steps[i];
        clearTimeout(timer); cancelAnimationFrame(raf); PA.Voice.stop();
        if (st.before) { try { await st.before(); } catch (e) {} await PA.sleep(250); }
        if (my !== runId) return;
        const el = st.sel ? document.querySelector(st.sel) : null;
        player.querySelector(".t-title").textContent = st.title || "";
        player.querySelector(".t-body").textContent = st.text;
        player.querySelector(".t-count").textContent = `${i + 1}/${steps.length}`;
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          await PA.sleep(380);
          const r = el.getBoundingClientRect(), pad = 8;
          Object.assign(hole.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px", opacity: 1 });
          hand.style.left = r.left + r.width / 2 - 14 + "px"; hand.style.top = Math.min(innerHeight - 60, r.top + r.height / 2) + "px";
          hand.style.opacity = 1;
          hand.classList.remove("tap"); if (st.tap) setTimeout(() => hand.classList.add("tap"), 800);
          const playerH = player.getBoundingClientRect().height;
          player.style.top = r.bottom > innerHeight - playerH - 40 && r.top > playerH + 40 ? "18px" : "auto";
          player.style.bottom = player.style.top === "18px" ? "auto" : "18px";
        } else {
          Object.assign(hole.style, { left: innerWidth / 2 + "px", top: innerHeight / 2 + "px", width: "0px", height: "0px" });
          hand.style.opacity = 0; player.style.top = "auto"; player.style.bottom = "18px";
        }
        dur = Math.max(3800, st.text.split(" ").length * 420);
        startT = performance.now(); bar.style.width = "0"; tick();
        if (PA.settings.get("narrate", true)) PA.Voice.speak(st.text, { mode: "natural", rate: 1.05 });
        if (playing) timer = setTimeout(() => { if (my !== runId) return; if (i < steps.length - 1) show(i + 1); else close(); }, dur);
      }
      player.addEventListener("click", (e) => {
        const b = e.target.closest("[data-t]"); if (!b) return;
        const t = b.dataset.t;
        if (t === "close") close();
        if (t === "next") { if (i < steps.length - 1) show(i + 1); else close(); }
        if (t === "prev") show(i - 1);
        if (t === "pp") { playing = !playing; b.textContent = playing ? "⏸" : "▶"; if (playing) show(i); else { clearTimeout(timer); PA.Voice.stop(); } }
      });
      shade.addEventListener("click", () => { if (i < steps.length - 1) show(i + 1); else close(); });
      active = { close };
      show(0);
    },
    close() { active && active.close(); }
  };
  PA.Tour = Tour;
})();
