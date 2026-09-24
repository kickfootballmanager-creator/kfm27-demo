/* Interruttore della partita 3D. Vale solo in locale (anche da telefono
   sulla stessa rete) e dentro l'app Capacitor: su GitHub Pages resta
   spento, il pulsante "Gioca la partita" sparisce e Three.js non viene
   mai scaricato. */
(function(){
  function localHost(h){
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true;
    var m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(h);
    if (!m) return false;
    var a = +m[1], b = +m[2];
    return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
  }
  var nativo = false;
  try { nativo = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); } catch (e) {}
  var on = nativo || localHost(location.hostname);
  window.MATCH3D_ENABLED = on;

  /* Il percorso e' relativo a questo file, quindi funziona anche nel
     sottopercorso di GitHub Pages e dentro Capacitor. */
  window.kfmLoadMatch3d = function(modulo){
    if (!window.MATCH3D_ENABLED) return Promise.reject(new Error('match3d spento'));
    return modulo === 'test-mode' ? import('./match3d/test-mode.js') : import('./match3d/main.js');
  };

  if (!on) {
    var st = document.createElement('style');
    st.textContent = '[data-m3d]{display:none!important}';
    document.head.appendChild(st);
  }
})();
