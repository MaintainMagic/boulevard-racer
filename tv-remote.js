/* Boulevard Racer: TV remote support (Samsung Tizen, LG webOS, Sony / Google TV).
   The game reads event.code. TV browsers often only give keyCode, and they use the
   arrow keys for their own cursor or focus navigation. This layer runs first (capture
   phase), fills in event.code from keyCode, keeps the browser from acting on the keys,
   and maps the remote's Back button to Escape (pause) instead of leaving the page. */
(function () {
  var MAP = {
    37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
    13: 'Enter', 23: 'Enter',            // OK / select (23 = Android DPAD_CENTER)
    27: 'Escape', 10009: 'Escape', 461: 'Escape', // Esc, Samsung Return, LG Back
    32: 'Space',
    415: 'Enter', 19: 'Escape', 10252: 'Escape'   // media play / pause / play-pause
  };
  var SWALLOW = { 37: 1, 38: 1, 39: 1, 40: 1, 10009: 1, 461: 1, 415: 1, 19: 1, 10252: 1 };

  function normalise(e) {
    var kc = e.keyCode || e.which;
    var want = MAP[kc];
    if (!want) return;
    if (SWALLOW[kc]) e.preventDefault();
    if (e.code === want) return;
    try { Object.defineProperty(e, 'code', { value: want, configurable: true }); } catch (x) {}
    if (e.code === want) return;
    // Engine would not let us patch the event: replay it with the right code.
    e.stopImmediatePropagation();
    var ev;
    try {
      ev = new KeyboardEvent(e.type, { code: want, key: e.key || want, bubbles: true, cancelable: true, repeat: !!e.repeat });
    } catch (x) { return; }
    ev.__tvReplay = true;
    (e.target && e.target.dispatchEvent ? e.target : document.body).dispatchEvent(ev);
  }

  function guard(e) { if (!e.__tvReplay) normalise(e); }
  window.addEventListener('keydown', guard, true);
  window.addEventListener('keyup', guard, true);

  // Samsung: ask the TV to send media keys to the page as well.
  try {
    if (window.tizen && tizen.tvinputdevice) {
      ['MediaPlay', 'MediaPause', 'MediaPlayPause'].forEach(function (k) {
        try { tizen.tvinputdevice.registerKey(k); } catch (x) {}
      });
    }
  } catch (x) {}

  // Keep keyboard focus on the page so the first press reaches the game.
  function takeFocus() {
    try {
      if (document.activeElement && document.activeElement !== document.body && document.activeElement.tagName !== 'INPUT') document.activeElement.blur();
      document.body.tabIndex = -1;
      document.body.focus();
      window.focus();
    } catch (x) {}
  }
  takeFocus();
  window.addEventListener('load', takeFocus);
})();
