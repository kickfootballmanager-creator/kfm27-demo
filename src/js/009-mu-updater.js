
/* ============ MU · pannello e download automatico degli aggiornamenti ============ */
(function () {
  if (typeof MU === 'undefined') return;
  var LS_URL = 'mu_url', LS_CACHE = 'mu_cache', LS_AUTO = 'mu_auto';

  function gi(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function si(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  MU.getUrl = function () { return gi(LS_URL, ''); };
  MU.setUrl = function (u) { si(LS_URL, String(u || '').trim()); sync(); return MU.refresh(); };
  MU.auto = function () { return gi(LS_AUTO, '1') === '1'; };

  MU.applyText = function (txt, remember) {
    try {
      var p = JSON.parse(txt);
      if (remember !== false) si(LS_CACHE, JSON.stringify(p));
      var r = MU_apply(p, { rebuild: true });
      MU.status = 'aggiornato · versione ' + (p.version || '—');
      sync(r);
      return r;
    } catch (e) {
      MU.status = 'JSON non valido: ' + e.message;
      sync();
      return null;
    }
  };

  MU.refresh = function () {
    var u = MU.getUrl();
    if (!u) { MU.status = 'nessun URL configurato'; sync(); return Promise.resolve(null); }
    MU.status = 'scarico gli aggiornamenti…'; sync();
    return fetch(u + (u.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) { return MU.applyText(t); })
      .catch(function (e) { MU.status = 'errore: ' + e.message + ' (uso l\'ultima patch salvata)'; sync(); return null; });
  };

  MU.reset = function () {
    try { localStorage.removeItem(LS_CACHE); } catch (e) {}
    MU.status = 'patch rimossa · ricarica la pagina per tornare al database originale';
    sync();
  };

  /* ---------------- pannello ---------------- */
  var C = {
    bg: '#191919', surf: '#202020', raised: '#2b2b2b', bd: 'rgba(255,255,255,.20)',
    tx: '#ffffff', tx2: 'rgba(255,255,255,.65)', acc: '#5E9FE8', ok: '#72BC8F', warn: '#DE9255'
  };
  var btn, panel, elStatus, elVer, elUrl, elLog;

  function mk(tag, css, txt) {
    var e = document.createElement(tag);
    if (css) e.setAttribute('style', css);
    if (txt != null) e.textContent = txt;
    return e;
  }
  var BTNCSS = 'position:fixed;left:16px;bottom:16px;z-index:99998;width:44px;height:44px;border-radius:8px;' +
    'border:1px solid ' + C.bd + ';background:' + C.surf + ';color:' + C.tx + ';font:600 18px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
    'cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.35),0 4px 12px rgba(0,0,0,.25);opacity:.82;';
  var PANCSS = 'position:fixed;left:16px;bottom:70px;z-index:99999;width:340px;max-width:calc(100vw - 32px);' +
    'max-height:calc(100vh - 110px);overflow:auto;background:' + C.bg + ';border:1px solid ' + C.bd + ';border-radius:12px;' +
    'padding:16px;color:' + C.tx + ';font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
    'box-shadow:0 1px 2px rgba(0,0,0,.4),0 12px 32px rgba(0,0,0,.45);display:none;';
  var LBL = 'display:block;font-size:12px;letter-spacing:.02em;text-transform:uppercase;color:' + C.tx2 + ';margin:0 0 6px;';
  var INP = 'width:100%;box-sizing:border-box;background:' + C.surf + ';border:1px solid ' + C.bd + ';border-radius:8px;' +
    'color:' + C.tx + ';padding:10px 12px;font:13px/1.4 inherit;';
  var BT = 'flex:1;min-height:44px;border-radius:8px;border:1px solid ' + C.bd + ';background:' + C.raised + ';color:' + C.tx + ';' +
    'font:600 13px/1.2 inherit;cursor:pointer;padding:0 12px;';
  var BTP = BT.replace(C.raised, C.acc).replace('border:1px solid ' + C.bd, 'border:1px solid ' + C.acc);

  function build() {
    btn = mk('button', BTNCSS, '⟳');
    btn.title = 'Aggiornamento database';
    btn.setAttribute('aria-label', 'Aggiornamento database');
    btn.onmouseenter = function () { btn.style.opacity = '1'; };
    btn.onmouseleave = function () { btn.style.opacity = '.82'; };
    btn.onclick = function () { panel.style.display = (panel.style.display === 'none') ? 'block' : 'none'; sync(); };

    panel = mk('div', PANCSS);

    var head = mk('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;');
    head.appendChild(mk('div', 'font:600 16px/1.3 inherit;', 'Aggiornamento database'));
    var x = mk('button', 'width:28px;height:28px;border-radius:8px;border:1px solid ' + C.bd + ';background:transparent;color:' + C.tx2 + ';cursor:pointer;font:16px/1 inherit;', '×');
    x.setAttribute('aria-label', 'Chiudi');
    x.onclick = function () { panel.style.display = 'none'; };
    head.appendChild(x);
    panel.appendChild(head);

    panel.appendChild(mk('p', 'margin:0 0 16px;color:' + C.tx2 + ';font-size:13px;',
      'Trasferimenti, prestiti e valori di mercato reali vengono letti da un file JSON. Gli overall dei giocatori già presenti non vengono mai modificati.'));

    elStatus = mk('div', 'background:' + C.surf + ';border:1px solid ' + C.bd + ';border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:16px;');
    panel.appendChild(elStatus);

    panel.appendChild(mk('label', LBL, 'URL del file di aggiornamento'));
    elUrl = mk('input', INP);
    elUrl.type = 'url';
    elUrl.placeholder = 'https://.../aggiornamenti.json';
    panel.appendChild(elUrl);

    var row1 = mk('div', 'display:flex;gap:8px;margin:12px 0 16px;');
    var save = mk('button', BTP, 'Salva e aggiorna');
    save.onclick = function () { MU.setUrl(elUrl.value); };
    var now = mk('button', BT, 'Aggiorna ora');
    now.onclick = function () { MU.refresh(); };
    row1.appendChild(save); row1.appendChild(now);
    panel.appendChild(row1);

    panel.appendChild(mk('label', LBL, 'Oppure carica un file dal computer'));
    var file = mk('input', INP);
    file.type = 'file';
    file.accept = '.json,application/json';
    file.onchange = function () {
      var f = file.files && file.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { MU.applyText(String(fr.result)); };
      fr.readAsText(f);
    };
    panel.appendChild(file);

    var row2 = mk('div', 'display:flex;gap:8px;margin:16px 0 0;');
    var rst = mk('button', BT, 'Rimuovi aggiornamenti');
    rst.onclick = function () { MU.reset(); };
    row2.appendChild(rst);
    panel.appendChild(row2);

    elLog = mk('div', 'margin-top:16px;padding-top:12px;border-top:1px solid ' + C.bd + ';color:' + C.tx2 + ';font-size:12px;white-space:pre-line;');
    panel.appendChild(elLog);

    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  function sync(res) {
    if (!panel) return;
    if (elUrl && document.activeElement !== elUrl) elUrl.value = MU.getUrl();
    var r = res || MU.lastResult;
    var col = /errore|non valido/i.test(MU.status || '') ? C.warn : (MU.applied ? C.ok : C.tx2);
    elStatus.innerHTML = '';
    elStatus.appendChild(mk('div', 'color:' + col + ';font-weight:600;', MU.status || 'in attesa'));
    if (MU.version) elStatus.appendChild(mk('div', 'color:' + C.tx2 + ';margin-top:2px;', 'Versione dati: ' + MU.version));
    if (r) {
      elStatus.appendChild(mk('div', 'color:' + C.tx2 + ';margin-top:6px;',
        r.trasferimenti + ' trasferimenti · ' + r.prestiti + ' prestiti · ' + r.rientri + ' rientri · ' +
        r.valori + ' valori · ' + r.nuovi + ' nuovi · ' + r.ignorati + ' ignorati'));
    }
    if (elLog) {
      var lg = (MU.log || []).slice(0, 12);
      elLog.textContent = lg.length ? ('Dettagli:\n' + lg.join('\n') + ((MU.log.length > 12) ? '\n… e altri ' + (MU.log.length - 12) : '')) : '';
    }
  }

  function start() {
    build();
    sync();
    if (MU.getUrl() && MU.auto()) MU.refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

