// Deferred app loader for article pages — loads the React app on first
// user interaction (or after 10s fallback). Keeps article content readable
// as static HTML while deferring JS execution for better LCP scores.
var src = document.querySelector('meta[name="app-entry"]');
if (src) {
  var s = src.content;
  var l = function() { import(s); };
  ['scroll', 'click', 'touchstart', 'keydown'].forEach(function(e) {
    addEventListener(e, function() { l(); }, { once: true, passive: true });
  });
  setTimeout(l, 1e4);
}
