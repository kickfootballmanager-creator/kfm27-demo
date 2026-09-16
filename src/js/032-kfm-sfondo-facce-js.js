
/* =====================================================================
   Le foto Sportmonks hanno lo sfondo bianco pieno, non trasparente.
   Non si può ritagliare da CSS, ma si può far sparire in due modi:

   1. dove la faccia è tonda (liste, rose, mercato) il ritaglio circolare
      taglia già quasi tutto: basta stringere l'inquadratura;
   2. sulle carte, dove la foto è a figura intera, sfumo i bordi con una
      maschera così il bianco si dissolve nel telaio invece di stagliarsi.

   Vale solo per le immagini Sportmonks: quelle vecchie sono già ritagliate.
   ===================================================================== */
(function(){
'use strict';

var css = document.createElement('style');
css.id = 'kfm-sfondo-facce-css';
css.textContent =

/* --- carte: sfumatura sui bordi -------------------------------------- */
'.uc-ph img[src*="cdn.sportmonks.com"],' +
'.uc-ph img[src*="media.api-sports.io/football/players"]{' +
  '-webkit-mask-image:radial-gradient(118% 92% at 50% 34%,' +
    '#000 0%,#000 52%,rgba(0,0,0,.92) 63%,rgba(0,0,0,.55) 76%,rgba(0,0,0,0) 88%);' +
  'mask-image:radial-gradient(118% 92% at 50% 34%,' +
    '#000 0%,#000 52%,rgba(0,0,0,.92) 63%,rgba(0,0,0,.55) 76%,rgba(0,0,0,0) 88%);' +
  'mix-blend-mode:normal;' +
'}' +

/* --- facce tonde: inquadratura più stretta, il bianco resta fuori ---- */
'.mk-face[src*="cdn.sportmonks.com"],.p-face[src*="cdn.sportmonks.com"],' +
'.rt-face[src*="cdn.sportmonks.com"],.rp-face[src*="cdn.sportmonks.com"],' +
'.rp-mface[src*="cdn.sportmonks.com"],.hr-face[src*="cdn.sportmonks.com"],' +
'.tr-face[src*="cdn.sportmonks.com"],.hubc-face[src*="cdn.sportmonks.com"],' +
'.cf-hc-face[src*="cdn.sportmonks.com"],.ps-face[src*="cdn.sportmonks.com"],' +
'.neg-face[src*="cdn.sportmonks.com"],.st-coach-face[src*="cdn.sportmonks.com"],' +
'.mk-face[src*="media.api-sports.io"],.p-face[src*="media.api-sports.io"],' +
'.rt-face[src*="media.api-sports.io"],.rp-mface[src*="media.api-sports.io"],' +
'.hubc-face[src*="media.api-sports.io"],.cf-hc-face[src*="media.api-sports.io"],' +
'.ps-face[src*="media.api-sports.io"]{' +
  'object-fit:cover;object-position:50% 22%;transform:scale(1.18);' +
'}' +

/* i contenitori tondi devono tagliare l'ingrandimento */
'.mk-face,.p-face,.rt-face,.rp-face,.rp-mface,.hr-face,.tr-face,' +
'.hubc-face,.cf-hc-face,.ps-face,.neg-face,.st-coach-face{overflow:hidden}';

document.head.appendChild(css);
})();
