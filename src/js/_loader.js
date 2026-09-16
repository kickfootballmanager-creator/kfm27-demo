(function(){
  function loadScriptSeq(list, i, done){
    if (i >= list.length){ done(); return; }
    var s = document.createElement('script');
    s.src = list[i];
    s.onload = function(){ loadScriptSeq(list, i + 1, done); };
    s.onerror = function(){ console.error('KFM27: errore caricamento script', list[i]); loadScriptSeq(list, i + 1, done); };
    document.body.appendChild(s);
  }
  var scripts = [
    "src/js/001-eadb-extra.js",
    "src/js/002-db-utility.js",
    "src/js/003-fm-gk.js",
    "src/js/004-fm-oh0.js",
    "src/js/005-fm-oh1.js",
    "src/js/006-fm-oh2.js",
    "src/js/007-fm-oh3.js",
    "src/js/008-fm-oh4.js",
    "src/js/009-mu-updater.js",
    "src/js/010-m26-live-match.js",
    "src/js/011-fm26-engine.js",
    "src/js/012-orient-gate.js",
    "src/js/013-img-fallback.js",
    "src/js/014-ut-frames.js",
    "src/js/015-ut-app.js",
    "src/js/016-kfm-intro-js.js",
    "src/js/017-kfm-crest-js.js",
    "src/js/018-kfm-cal-js.js",
    "src/js/019-kfm-fix8-js.js",
    "src/js/020-kfm-rw-js.js",
    "src/js/021-kfm-fix12-js.js",
    "src/js/022-kfm-fix14-js.js",
    "src/js/023-kfm-fix15-js.js",
    "src/js/024-kfm-fix16-js.js",
    "src/js/025-kfm-fix19-js.js",
    "src/js/026-kfm-dbe-js.js",
    "src/js/027-kfm-dbe-ui-js.js",
    "src/js/028-kfm-face-js.js",
    "src/js/029-kfm-dbe-img-js.js",
    "src/js/030-kfm-logo2-js.js",
    "src/js/031-kfm-facce-sportmonks-js.js",
    "src/js/032-kfm-sfondo-facce-js.js",
    "src/js/033-kfm-stemmi-sportmonks-js.js",
    "src/js/034-kfm-campionati-js.js",
    "src/js/035-kfm-loghi-campionati-js.js",
    "src/js/036-kfm-pulizia-svincolati-js.js",
    "src/js/037-kfm-calendario-fix2-js.js",
    "src/js/038-kfm-tabellone-playoff-js.js",
    "src/js/039-kfm-fine-stagione-js.js",
    "src/js/040-kfm-schermate-js.js",
    "src/js/041-kfm-v135-js.js",
    "src/js/042-kfm-v137-js.js",
    "src/js/043-sq28-ledger.js",
    "src/js/044-sq26-overhaul.js",
    "src/js/045-mk27-card.js",
    "src/js/046-sq28b-backfill.js",
    "src/js/047-ng29-negotiation.js",
    "src/js/048-ng29-faces.js",
    "src/js/049-ng29-bg.js",
    "src/js/050-tac30.js",
    "src/js/051-au31-js.js",
    "src/js/052-kfm-sagome-js.js"
  ];
  fetch('src/data/eadb.json')
    .then(function(r){ return r.json(); })
    .then(function(data){
      window.EADB = data;
      var domReadyBefore = document.readyState !== 'loading';
      var loadReadyBefore = document.readyState === 'complete';
      loadScriptSeq(scripts, 0, function(){
        if (domReadyBefore) document.dispatchEvent(new Event('DOMContentLoaded'));
        if (loadReadyBefore) window.dispatchEvent(new Event('load'));
      });
    })
    .catch(function(e){ console.error('KFM27: errore caricamento database EADB', e); });
})();
