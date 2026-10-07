(() => {
  'use strict';
  const { slides, sources } = JSON.parse(document.getElementById('pitch-data').textContent);
  const mainCount = slides.filter(s => !s.appendix).length;
  const sections = [...document.querySelectorAll('.slide')];
  const $ = id => document.getElementById(id);
  let current = 0, lastMain = 0, shortMode = false, elapsed = 0, startedAt = 0, timerRunning = false;
  let presenterWindow = null, transitionTimeout, toastTimeout, idleTimeout;
  const formatTime = ms => {
    const sec = Math.floor(ms / 1000);
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  };
  const actualElapsed = () => elapsed + (timerRunning ? performance.now() - startedAt : 0);
  const notify = message => {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 3300);
  };
  function fit() {
    const rect = $('deck').getBoundingClientRect();
    const scale = Math.min(rect.width / 1600, rect.height / 900);
    $('stage').style.transform = `scale(${scale})`;
    $('stage').style.left = `${(rect.width - 1600 * scale) / 2}px`;
    $('stage').style.top = `${(rect.height - 900 * scale) / 2}px`;
  }
  function updatePresenter() {
    if (!presenterWindow || presenterWindow.closed) return;
    const d = presenterWindow.document;
    d.getElementById('p-title').textContent = `${slides[current].appendix ? 'Appendix' : `${current + 1} / ${mainCount}`} — ${slides[current].label}`;
    d.getElementById('p-mode').textContent = `${shortMode ? '3' : '5'} daqiqalik nutq`;
    d.getElementById('p-note').textContent = slides[current][shortMode ? 'short' : 'full'];
    const next = current < mainCount - 1 ? slides[current + 1] : current >= mainCount && current < slides.length - 1 ? slides[current + 1] : null;
    d.getElementById('p-next').textContent = next ? `Keyingi slayd: ${next.label}` : 'Asosiy pitch tugadi. Savol-javob uchun qo‘shimcha slaydlar bor.';
    d.getElementById('p-prev').disabled = current === 0;
    d.getElementById('p-advance').disabled = current === (current < mainCount ? mainCount - 1 : slides.length - 1);
    d.getElementById('p-timing').textContent = slides[current].appendix ? 'Savol-javob uchun qo‘shimcha slayd' : `Bu slayd: ${shortMode ? slides[current].shortSeconds : slides[current].fullSeconds} soniya`;
  }
  function refreshNotes() {
    const s = slides[current];
    $('notes-title').textContent = s.label;
    $('notes-copy').textContent = s[shortMode ? 'short' : 'full'];
    $('notes-timing').textContent = s.appendix ? 'Savol-javob uchun' : `${shortMode ? '3' : '5'} daqiqalik rejim / bu slayd: ${shortMode ? s.shortSeconds : s.fullSeconds} soniya`;
    updatePresenter();
  }
  function show(index, initial = false) {
    if (!Number.isInteger(index)) return;
    index = Math.max(0, Math.min(slides.length - 1, index));
    if (!initial && index === current) return;
    clearTimeout(transitionTimeout);
    sections.forEach(s => s.classList.remove('leaving'));
    const previous = sections[current];
    previous.classList.remove('active');
    if (!initial && !$('deck').classList.contains('motion-off')) previous.classList.add('leaving');
    sections.forEach((s, n) => {
      s.setAttribute('aria-hidden', String(n !== index));
      s.inert = n !== index;
    });
    current = index;
    if (current < mainCount) lastMain = current;
    sections[current].classList.add('active');
    transitionTimeout = setTimeout(() => sections.forEach(s => s.classList.remove('leaving')), 470);
    $('counter').textContent = slides[current].appendix ? `A${current - mainCount + 1} / 2` : `${String(current + 1).padStart(2, '0')} / ${mainCount}`;
    $('prev').disabled = current === 0;
    $('next').disabled = current === (current < mainCount ? mainCount - 1 : slides.length - 1);
    $('announcement').textContent = `Slide ${current + 1}: ${slides[current].label}`;
    document.querySelectorAll('[data-slide]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.slide) === current)));
    try { history.replaceState(null, '', `#${slides[current].id}`); } catch { /* Local file restrictions do not prevent navigation. */ }
    refreshNotes();
  }
  const next = () => show(Math.min(current + 1, current < mainCount ? mainCount - 1 : slides.length - 1));
  const prev = () => show(current - 1);
  function toggleMode() {
    shortMode = !shortMode;
    $('mode').textContent = shortMode ? '3 min' : '5 min';
    refreshNotes();
    notify(shortMode ? '3-minute Uzbek script selected.' : '5-minute Uzbek script selected.');
  }
  function toggleTimer() {
    if (timerRunning) elapsed = actualElapsed();
    else startedAt = performance.now();
    timerRunning = !timerRunning;
    $('timer').textContent = timerRunning ? 'Pause timer' : 'Start timer';
    $('timer').setAttribute('aria-label', timerRunning ? 'Pause rehearsal timer' : 'Start rehearsal timer');
  }
  function resetTimer() {
    elapsed = 0;
    startedAt = performance.now();
    tick();
    notify('Rehearsal timer reset.');
  }
  function tick() {
    const now = actualElapsed();
    $('clock').textContent = formatTime(now);
    $('clock').style.color = now > (shortMode ? 180000 : 300000) ? '#ff857c' : '';
    if (presenterWindow && !presenterWindow.closed) presenterWindow.document.getElementById('p-clock').textContent = formatTime(now);
  }
  function toggleNotes() {
    $('notes-panel').hidden = !$('notes-panel').hidden;
    if (!$('notes-panel').hidden) refreshNotes();
  }
  function toggleMotion() {
    const disabled = $('deck').classList.toggle('motion-off');
    $('motion').textContent = disabled ? 'Motion off' : 'Motion on';
    $('motion').setAttribute('aria-pressed', String(!disabled));
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.body.requestFullscreen();
    } catch { notify('Use your browser’s full-screen command (F11 on Windows).'); }
    fit();
  }
  function presenter() {
    if (presenterWindow && !presenterWindow.closed) { presenterWindow.focus(); return; }
    presenterWindow = window.open('', 'profai-speaker', 'width=1120,height=820');
    if (!presenterWindow) { notify('Allow this speaker window in your browser, or use UZ notes during rehearsal.'); return; }
    const d = presenterWindow.document;
    d.open();
    d.write('<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ProfAI — Speaker view</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f1eb;color:#16181c;font-family:Segoe UI,Arial,sans-serif;padding:40px;line-height:1.6}header{display:flex;justify-content:space-between;align-items:center}h1{font-size:26px;margin:25px 0 8px;line-height:1.3}#p-clock{font-size:44px;font-variant-numeric:tabular-nums}#p-mode,#p-timing,#p-next{color:#62646a}#p-note{font-size:26px;margin:28px 0}nav{display:flex;flex-wrap:wrap;gap:12px;position:sticky;bottom:0;background:#f4f1eb;padding:20px 0}button{font:inherit;border:0;border-radius:7px;background:#16181c;color:#fff;padding:12px 18px;cursor:pointer}button:disabled{opacity:.35}button:focus-visible{outline:3px solid #f4473b;outline-offset:3px}.warning{font-size:14px;color:#b8372d;border-top:1px solid #ccc;padding-top:18px}</style></head><body><header><strong>ProfAI / SPIKER IZOHLARI</strong><span id="p-clock">00:00</span></header><h1 id="p-title"></h1><div id="p-mode"></div><div id="p-timing"></div><p id="p-note"></p><p id="p-next"></p><nav><button id="p-prev">Oldingi</button><button id="p-advance">Keyingi</button><button id="p-switch">3 / 5 min</button><button id="p-timer">Timer</button><button id="p-reset">Timer reset</button><button id="p-appendix">Qo‘shimcha slaydlar</button></nav><p class="warning">Proyektorda faqat asosiy taqdimot oynasini ko‘rsating. Bu oyna noutbuk ekranida qolishi kerak. Bir ekran bo‘lsa, pitch paytida bu oynani yoping va nutqni oldindan mashq qiling.</p></body></html>');
    d.close();
    d.getElementById('p-prev').onclick = prev;
    d.getElementById('p-advance').onclick = next;
    d.getElementById('p-switch').onclick = toggleMode;
    d.getElementById('p-timer').onclick = toggleTimer;
    d.getElementById('p-reset').onclick = resetTimer;
    d.getElementById('p-appendix').onclick = () => show(current < mainCount ? mainCount : lastMain);
    presenterWindow.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    });
    updatePresenter();
    tick();
  }
  function activeControls() {
    $('controls').classList.remove('idle');
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => { if (document.fullscreenElement) $('controls').classList.add('idle'); }, 2600);
  }
  sections.forEach(s => s.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--delay', String(Math.min(i, 5)))));
  $('prev').onclick = prev;
  $('next').onclick = next;
  $('mode').onclick = toggleMode;
  $('timer').onclick = toggleTimer;
  $('notes').onclick = toggleNotes;
  $('presenter').onclick = presenter;
  $('motion').onclick = toggleMotion;
  $('fullscreen').onclick = toggleFullscreen;
  $('help').onclick = () => $('help-dialog').showModal();
  $('outline').onclick = () => $('outline-dialog').showModal();
  $('print').onclick = () => { $('help-dialog').close(); window.print(); };
  $('blackout').onclick = () => { $('blackout').hidden = true; };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { $(b.dataset.close).hidden = true; });
  document.querySelectorAll('[data-dialog-close]').forEach(b => b.onclick = () => $(b.dataset.dialogClose).close());
  slides.forEach((s, i) => {
    if (i === mainCount) {
      const label = document.createElement('small');
      label.textContent = 'OPTIONAL APPENDIX / Q&A';
      $('slide-list').append(label);
    }
    const b = document.createElement('button');
    b.textContent = `${s.appendix ? 'A' + (i - mainCount + 1) : String(i + 1).padStart(2, '0')}   ${s.label}`;
    b.dataset.slide = String(i);
    b.onclick = () => { show(i); $('outline-dialog').close(); };
    $('slide-list').append(b);
  });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.target.closest('input,textarea,select,[contenteditable=true]')) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') {
      $('notes-panel').hidden = true;
      $('blackout').hidden = true;
      if (current >= mainCount) show(lastMain);
      return;
    }
    if (!$('blackout').hidden) { e.preventDefault(); $('blackout').hidden = true; return; }
    const key = e.key.toLowerCase();
    const navigation = ['arrowright', 'pagedown', 'arrowleft', 'pageup', 'home', 'end'];
    if (navigation.includes(key) || (key === ' ' && !e.target.closest('button,a'))) e.preventDefault();
    switch (key) {
      case 'arrowright': case 'pagedown': next(); break;
      case ' ': if (!e.target.closest('button,a')) next(); break;
      case 'arrowleft': case 'pageup': prev(); break;
      case 'home': show(0); break;
      case 'end': show(mainCount - 1); break;
      case 'f': toggleFullscreen(); break;
      case 'p': presenter(); break;
      case 'n': toggleNotes(); break;
      case 'g': $('outline-dialog').showModal(); break;
      case 'a': show(current < mainCount ? mainCount : lastMain); break;
      case 'b': $('blackout').hidden = !$('blackout').hidden; break;
      case 't': toggleTimer(); break;
      case 'r': resetTimer(); break;
      case 'm': toggleMode(); break;
      case '?': $('help-dialog').showModal(); break;
    }
    activeControls();
  });
  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    fit(); activeControls();
  });
  document.addEventListener('pointermove', activeControls);
  document.addEventListener('focusin', activeControls);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) toggleMotion();
  setInterval(tick, 250);
  const hashIndex = slides.findIndex(s => s.id === location.hash.slice(1));
  show(hashIndex >= 0 ? hashIndex : 0, true);
  fit();
  window.profaiPitch = Object.freeze({ show, next, prev, get current() { return current; }, get mode() { return shortMode ? 'short' : 'full'; }, slides, sources });
})();
