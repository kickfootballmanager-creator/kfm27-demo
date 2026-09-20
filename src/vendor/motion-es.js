/* =====================================================================
   Ponte fra motion.js e il resto del progetto.

   motion.js e' una build UMD: importata come modulo esegue la fabbrica
   e riempie globalThis.Motion, ma non espone nessun export con nome.
   Un "import { animate } from './motion.js'" fallisce in fase di
   collegamento con:
     does not provide an export named 'animate'

   Qui lo importo per il suo effetto e ri-espongo le funzioni come
   export veri, cosi' il resto del codice usa import con nome.
   ===================================================================== */
import './motion.js';

const M = (typeof globalThis !== 'undefined' && globalThis.Motion) || {};

export const animate = M.animate;
export const stagger = M.stagger;
export const inView = M.inView;
export default M;
