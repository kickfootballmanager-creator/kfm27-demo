/* Animazioni della sezione Finanze: comparsa dei blocchi, riempimento delle barre,
   conteggio dei numeri grandi. Partono una volta sola all'ingresso nella sezione:
   render() sostituisce .fin-screen a ogni ridisegno, ma nello stesso ciclo, quindi
   l'observer la vede sempre presente e non riparte. */
import { animate } from '../vendor/motion-es.js';

var BLOCK_DUR = 0.35, BLOCK_STEP = 0.04, BLOCK_MAX = 0.4;
var BAR_DUR = 0.6, COUNT_DUR = 0.5;
var EASE_OUT = [0, 0, 0.58, 1];
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
var wasOpen = false;

function enterBlocks(root){
  var blocks = root.querySelectorAll('.fin-head, .fin-kpi, .fin-panel');
  blocks.forEach(function(el, i){
    /* il ritardo e' limitato perche' l'ultimo blocco finisca entro BLOCK_MAX */
    var delay = Math.min(i * BLOCK_STEP, BLOCK_MAX - BLOCK_DUR);
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    animate(el, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] },
      { duration: BLOCK_DUR, delay: delay, ease: EASE_OUT })
      .then(function(){ el.style.transform = ''; });
  });
}

function fillBars(root){
  root.querySelectorAll('.fin-bar-fill').forEach(function(el){
    var target = el.style.width;
    if(!target) return;
    el.style.width = '0%';
    animate(el, { width: ['0%', target] }, { duration: BAR_DUR, ease: EASE_OUT });
  });
}

function countNumbers(root){
  root.querySelectorAll('.fin-kpi .k-v').forEach(function(el){
    var text = el.textContent;
    var m = text.match(/^(\D*?)(-?\d+(?:\.\d+)?)(.*)$/);
    if(!m) return;
    var target = parseFloat(m[2]);
    var dec = (m[2].split('.')[1] || '').length;
    el.textContent = m[1] + (0).toFixed(dec) + m[3];
    animate(0, target, {
      duration: COUNT_DUR, ease: EASE_OUT,
      onUpdate: function(v){ el.textContent = m[1] + v.toFixed(dec) + m[3]; },
      onComplete: function(){ el.textContent = text; }
    });
  });
}

function check(){
  var root = document.querySelector('.fin-screen');
  var open = !!root;
  if(open && !wasOpen && !reduced.matches){
    enterBlocks(root);
    fillBars(root);
    countNumbers(root);
  }
  wasOpen = open;
}

new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
check();
