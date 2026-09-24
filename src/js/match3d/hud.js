// Punteggio, pulsante Esci, scelta di uscita e avvisi. DOM + SVG, niente emoji.

const ICON_EXIT = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 8l-4 4 4 4M6 12h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_ROTATE = '<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><rect x="14" y="6" width="20" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M40 30a14 14 0 0 1-10 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M29 38l1 4 4-1" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function team(t, side) {
  const box = el('div', 'm3d-team ' + side);
  if (t.crest) {
    const img = el('img', 'm3d-crest');
    img.alt = '';
    img.src = t.crest;
    img.onerror = () => img.remove();
    box.appendChild(img);
  }
  box.appendChild(el('span', 'm3d-name', t.name));
  return box;
}

export class Hud {
  constructor(root, { home, away, exitMode }, on) {
    this.on = on;
    this.home = home;
    this.away = away;

    const hud = el('div', 'm3d-hud');
    const score = el('div', 'm3d-score');
    score.setAttribute('role', 'status');
    this.hg = el('span', 'm3d-g', '0');
    this.ag = el('span', 'm3d-g', '0');
    const goals = el('div', 'm3d-goals');
    goals.append(this.hg, el('span', 'm3d-sep', '-'), this.ag);
    score.append(team(home, 'home'), goals, team(away, 'away'));

    const exit = el('button', 'm3d-exit');
    exit.type = 'button';
    exit.setAttribute('aria-label', 'Esci dalla partita');
    exit.innerHTML = ICON_EXIT;
    exit.addEventListener('click', () => on.openExit());

    this.banner = el('div', 'm3d-banner');
    this.banner.hidden = true;
    this.bannerTeam = el('span', 'm3d-banner-team');
    this.banner.append(el('span', 'm3d-banner-t', 'Gol'), this.bannerTeam);

    this.hint = el('div', 'm3d-hint', 'Tocca un punto del campo: la palla ci va');

    this.dialog = this._dialog(exitMode);
    this.dialog.hidden = true;

    const rotate = el('div', 'm3d-rotate');
    rotate.innerHTML = ICON_ROTATE;
    rotate.appendChild(el('span', null, 'Gira il telefono in orizzontale'));

    hud.append(score, exit, this.banner, this.hint, this.dialog, rotate);
    root.appendChild(hud);
    this.node = hud;
  }

  _dialog(mode) {
    const wrap = el('div', 'm3d-dialog');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    const panel = el('div', 'm3d-panel');
    const title = el('h2', 'm3d-title', 'Esci dalla partita');
    title.id = 'm3d-exit-title';
    wrap.setAttribute('aria-labelledby', title.id);
    panel.appendChild(title);

    const choice = (label, note, cls, fn) => {
      const b = el('button', 'm3d-choice ' + cls);
      b.type = 'button';
      b.append(el('span', 'm3d-choice-l', label), el('span', 'm3d-choice-n', note));
      b.addEventListener('click', fn);
      return b;
    };

    if (mode === 'career') {
      panel.appendChild(el('p', 'm3d-text', 'La partita 3D è ancora in prova: il punteggio in campo non conta per la carriera.'));
      panel.append(
        choice('Simula risultato', 'Il risultato si calcola come sempre e va in classifica', 'primary', () => this.on.simulate()),
        choice('Torna indietro', 'Nessun risultato: la partita resta da giocare', 'ghost', () => this.on.back())
      );
    } else {
      panel.appendChild(el('p', 'm3d-text', 'Partita di prova, senza carriera.'));
      panel.appendChild(choice('Chiudi la prova', 'Torni al gioco normale', 'primary', () => this.on.back()));
    }
    const resume = el('button', 'm3d-resume', 'Riprendi la partita');
    resume.type = 'button';
    resume.addEventListener('click', () => this.on.resume());
    panel.appendChild(resume);
    wrap.appendChild(panel);
    return wrap;
  }

  setScore(h, a) {
    this.hg.textContent = String(h);
    this.ag.textContent = String(a);
  }

  showGoal(name) {
    this.bannerTeam.textContent = name;
    this.banner.hidden = false;
  }

  hideGoal() { this.banner.hidden = true; }

  hideHint() { this.hint.classList.add('off'); }

  get exitOpen() { return !this.dialog.hidden; }

  openExit() {
    this.dialog.hidden = false;
    const first = this.dialog.querySelector('button');
    if (first) first.focus();
  }

  closeExit() { this.dialog.hidden = true; }

  destroy() { this.node.remove(); }
}
