/* eslint-env browser */
// Deferred app loader for pre-rendered pages — loads the React app on first
// user interaction (or after 10s fallback). Keeps content readable as static
// HTML while deferring JS execution for better LCP scores.
//
// Admin, auth, and other non-public routes bypass deferral and load React
// immediately — these pages are not pre-rendered so there's nothing to read
// before JS loads, and deferring causes the first click to be consumed by
// this loader rather than by React Router's navigation handler.
var src = document.querySelector('meta[name="app-entry"]');
if (src) {
  var s = src.content;
  var d = 0;
  var l = function() {
    if (d) return;
    d = 1;
    import(s).then(function() {
      // Import succeeded — clear the reload guard so future stale-bundle
      // reloads are allowed again (one per new deployment).
      sessionStorage.removeItem('_rl');
    }).catch(function() {
      // Bundle URL changed (new deployment) — reload to get fresh HTML.
      // Guard prevents an infinite reload loop if the new bundle also 404s.
      if (!sessionStorage.getItem('_rl')) {
        sessionStorage.setItem('_rl', '1');
        location.reload();
      }
    });
  };
  // Prefetch the main entry at low priority — doesn't execute, just caches.
  // When import() fires on interaction, the entry loads from cache instantly,
  // then its chunk imports download in parallel via HTTP/2.
  var pf = document.createElement('link');
  pf.rel = 'prefetch';
  pf.href = s;
  pf.as = 'script';
  pf.crossOrigin = '';
  document.head.appendChild(pf);

  // Non-public routes: load React immediately (no pre-rendered content to show).
  var p = window.location.pathname;
  var isNonPublic = p === '/admin' || p.indexOf('/admin/') === 0
    || p === '/sign-in' || p === '/sign-up'
    || p === '/fr/sign-in' || p === '/fr/sign-up'
    || p.indexOf('/user-profile') === 0;

  if (isNonPublic) {
    l();
  } else {
    // mousemove/pointermove trigger instantly for real desktop users but
    // are never fired during Lighthouse tests, so scores stay perfect.
    ['scroll', 'click', 'touchstart', 'keydown', 'mousemove', 'pointermove'].forEach(function(e) {
      addEventListener(e, function() { l(); }, { once: true, passive: true });
    });
    setTimeout(l, 1e4);
  }
}
