// Deferred app loader for article pages — loads the React app on first
// user interaction (or after 10s fallback). Keeps article content readable
// as static HTML while deferring JS execution for better LCP scores.
var src = document.querySelector('meta[name="app-entry"]');
if (src) {
  var s = src.content;
  var d = 0;
  var l = function() {
    if (d) return;
    d = 1;
    import(s).catch(function() {
      // Bundle URL changed (new deployment) — reload to get fresh HTML.
      // Guard with sessionStorage to prevent infinite reload loops.
      if (!sessionStorage.getItem('_rl')) {
        sessionStorage.setItem('_rl', '1');
        location.reload();
      }
    });
  };
  ['scroll', 'click', 'touchstart', 'keydown'].forEach(function(e) {
    addEventListener(e, function() { l(); }, { once: true, passive: true });
  });
  setTimeout(l, 1e4);
  // Clear the reload guard after successful load
  sessionStorage.removeItem('_rl');
}
