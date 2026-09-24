// Stato del possesso: uno solo alla volta, esplicito.
//   POSSEDUTA(giocatore)       la palla segue il giocatore, sempre
//   IN_VOLO(tipo, destinatario) calciata: passaggio, filtrante, cross, lancio, tiro...
//   LIBERA                     nessuno la controlla
// Ogni cambio passa da qui e finisce nel registro del debug (F3).

export const OWNED = 'POSSEDUTA';
export const FLIGHT = 'IN_VOLO';
export const LOOSE = 'LIBERA';

// Le sole cause per cui chi ha la palla la perde.
export const LOSS = new Set(['passaggio', 'filtrante', 'cross', 'lancio', 'tiro', 'contrasto', 'scivolata', 'intercetto', 'fuori', 'rimessa', 'rinvio', 'colpo di testa', 'parata']);

const LOG_MAX = 40;

export class Possession {
  constructor() {
    this.state = LOOSE;
    this.owner = null;     // POSSEDUTA
    this.kind = null;      // IN_VOLO: tipo
    this.to = null;        // IN_VOLO: destinatario (puo' mancare: tiro, lancio nello spazio)
    this.from = null;      // chi l'ha calciata o persa per ultimo
    this.team = null;      // squadra dell'ultimo tocco
    this.age = 0;          // secondi nello stato attuale
    this.seq = 0;          // numero di cambi di stato: identifica un pallone in volo
    this.log = [];
    this.clock = 0;
  }

  _set(state, cause, fields) {
    const prev = this.describe();
    this.state = state;
    this.owner = fields.owner || null;
    this.kind = fields.kind || null;
    this.to = fields.to || null;
    if (fields.from !== undefined) this.from = fields.from;
    if (fields.team !== undefined && fields.team !== null) this.team = fields.team;
    this.age = 0;
    this.seq++;
    this.log.push({ t: this.clock, from: prev, to: this.describe(), cause });
    if (this.log.length > LOG_MAX) this.log.shift();
  }

  // POSSEDUTA(p). Il cambio di possessore fra due giocatori passa sempre da
  // una causa ammessa (contrasto, intercetto...): chi chiama la dichiara.
  own(p, cause) {
    if (this.state === OWNED && this.owner === p) return;
    if (this.state === OWNED && this.owner && !LOSS.has(cause)) console.warn('match3d possesso: causa non ammessa "' + cause + '"');
    this._set(OWNED, cause, { owner: p, from: this.state === OWNED ? this.owner : this.from, team: p.team });
  }

  // IN_VOLO(tipo, destinatario): parte dal piede (o dalle mani) di `from`.
  fly(kind, from, to, cause = kind) {
    this._set(FLIGHT, cause, { kind, to, from, team: from ? from.team : null });
  }

  loose(cause, from) {
    this._set(LOOSE, cause, { from: from !== undefined ? from : (this.owner || this.from), team: from ? from.team : null });
  }

  tick(dt) { this.age += dt; this.clock += dt; }

  get owned() { return this.state === OWNED; }
  get flying() { return this.state === FLIGHT; }
  get free() { return this.state === LOOSE; }

  describe() {
    if (this.state === OWNED) return OWNED + '(' + tag(this.owner) + ')';
    if (this.state === FLIGHT) return FLIGHT + '(' + this.kind + ', ' + (this.to ? tag(this.to) : '-') + ')';
    return LOOSE;
  }
}

function tag(p) { return p ? (p.team ? p.team[0] : '') + p.number : '-'; }
