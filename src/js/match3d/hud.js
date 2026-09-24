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
  // cartellini della squadra: si riempie con setCards
  const cards = el('span', 'm3d-cards');
  cards.hidden = true;
  box.appendChild(cards);
  box._cards = cards;
  return box;
}

// Un gruppo di cartellini dello stesso colore: il rettangolo e, oltre uno, il numero.
function cardChip(type, n) {
  const g = el('span', 'm3d-card-g');
  g.appendChild(el('span', 'm3d-card ' + type));
  if (n > 1) g.appendChild(el('span', 'm3d-card-n', String(n)));
  return g;
}

export class Hud {
  constructor(root, { home, away, exitMode, overPower }, on) {
    this.on = on;
    this.home = home;
    this.away = away;
    this.overPower = overPower;

    const hud = el('div', 'm3d-hud');
    const score = el('div', 'm3d-score');
    score.setAttribute('role', 'status');
    this.hg = el('span', 'm3d-g', '0');
    this.ag = el('span', 'm3d-g', '0');
    const goals = el('div', 'm3d-goals');
    goals.append(this.hg, el('span', 'm3d-sep', '-'), this.ag);
    this.clock = el('span', 'm3d-clock', '00:00');
    this.halfTag = el('span', 'm3d-half', '1T');
    const clock = el('div', 'm3d-time');
    clock.append(this.clock, this.halfTag);
    const homeBox = team(home, 'home'), awayBox = team(away, 'away');
    this.cardBoxes = { home: homeBox._cards, away: awayBox._cards };
    score.append(homeBox, goals, awayBox, clock);

    const exit = el('button', 'm3d-exit');
    exit.type = 'button';
    exit.setAttribute('aria-label', 'Esci dalla partita');
    exit.innerHTML = ICON_EXIT;
    exit.addEventListener('click', () => on.openExit());

    this.banner = el('div', 'm3d-banner');
    this.banner.hidden = true;
    this.bannerTitle = el('span', 'm3d-banner-t', 'Gol');
    this.bannerTeam = el('span', 'm3d-banner-team');
    this.banner.append(this.bannerTitle, this.bannerTeam);

    // avviso breve per le riprese: rimessa, angolo, rinvio
    this.toastEl = el('div', 'm3d-toast');
    this.toastEl.hidden = true;

    this.hint = el('div', 'm3d-hint', 'WASD muovi · J passa/cambio · I filtrante/pressing · U cross/scivolata · K tiro/contrasto · L scatto · O finta');

    this.tag = el('div', 'm3d-tag');
    this.tagNum = el('span', 'm3d-tag-n');
    this.tagName = el('span', 'm3d-tag-name');
    this.tag.append(this.tagNum, this.tagName);

    this.power = el('div', 'm3d-power');
    this.power.hidden = true;
    this.power.setAttribute('aria-hidden', 'true');
    this.powerFill = el('div', 'm3d-power-fill');
    const track = el('div', 'm3d-power-track');
    const mark = el('div', 'm3d-power-mark');
    mark.style.left = (overPower * 100) + '%';
    track.append(this.powerFill, mark);
    this.power.append(el('span', 'm3d-power-l', 'Potenza'), track);

    this.layer = el('div', 'm3d-controls');

    this.dialog = this._dialog(exitMode);
    this.dialog.hidden = true;

    const rotate = el('div', 'm3d-rotate');
    rotate.innerHTML = ICON_ROTATE;
    rotate.appendChild(el('span', null, 'Gira il telefono in orizzontale'));

    hud.append(score, this.tag, exit, this.layer, this.power, this.banner, this.toastEl, this.hint, this.dialog, rotate);
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
    this.dialogTitle = title;
    this.finalScore = el('p', 'm3d-final');
    this.finalScore.hidden = true;
    panel.appendChild(this.finalScore);

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
    this.resumeBtn = resume;
    wrap.appendChild(panel);
    return wrap;
  }

  setScore(h, a) {
    this.hg.textContent = String(h);
    this.ag.textContent = String(a);
  }

  // Cartellini mostrati finora: gialli e rossi per squadra accanto al nome.
  setCards(cards) {
    for (const side of ['home', 'away']) {
      const box = this.cardBoxes[side];
      const y = cards.filter((c) => c.team === side && c.type === 'yellow').length;
      const r = cards.filter((c) => c.team === side && c.type === 'red').length;
      box.textContent = '';
      if (y) box.appendChild(cardChip('yellow', y));
      if (r) box.appendChild(cardChip('red', r));
      box.hidden = !y && !r;
      box.setAttribute('aria-label', (y ? y + (y === 1 ? ' ammonizione' : ' ammonizioni') : '') + (y && r ? ', ' : '') + (r ? r + (r === 1 ? ' espulsione' : ' espulsioni') : ''));
    }
  }

  showGoal(name, scorer) {
    this.showBanner('Gol', scorer ? scorer + ' · ' + name : name);
  }

  showBanner(title, sub) {
    this.bannerTitle.textContent = title;
    this.bannerTeam.textContent = sub || '';
    this.banner.hidden = false;
  }

  hideGoal() { this.banner.hidden = true; }

  toast(text) {
    this.toastEl.textContent = text;
    this.toastEl.hidden = false;
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { this.toastEl.hidden = true; }, 1800);
  }

  // mm:ss di gioco e tempo (1T, 2T)
  setClock(text, half) {
    if (text !== this.lastClock) { this.clock.textContent = text; this.lastClock = text; }
    if (half !== this.lastHalf) { this.halfTag.textContent = half + 'T'; this.lastHalf = half; }
  }

  // Fine partita: la finestra di uscita con il risultato e senza "Riprendi".
  openEnd(hg, ag) {
    this.banner.hidden = true;
    this.dialogTitle.textContent = 'Fine partita';
    this.finalScore.textContent = this.home.name + ' ' + hg + ' - ' + ag + ' ' + this.away.name;
    this.finalScore.hidden = false;
    this.resumeBtn.hidden = true;
    this.openExit();
  }

  hideHint() { this.hint.classList.add('off'); }

  setPlayer(number, name) {
    this.tagNum.textContent = number ? String(number) : '';
    this.tagName.textContent = name || '';
    this.tag.hidden = !number && !name;
  }

  // Barra del tiro: p in 0..1, null la nasconde.
  setPower(p) {
    if (p == null) { this.power.hidden = true; return; }
    this.power.hidden = false;
    this.powerFill.style.transform = `scaleX(${p})`;
    this.power.classList.toggle('over', p > this.overPower);
  }

  get exitOpen() { return !this.dialog.hidden; }

  openExit() {
    this.dialog.hidden = false;
    const first = this.dialog.querySelector('button');
    if (first) first.focus();
  }

  closeExit() { this.dialog.hidden = true; }

  destroy() { clearTimeout(this.toastT); this.node.remove(); }
}
