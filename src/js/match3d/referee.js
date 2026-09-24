import * as THREE from 'three';
import { REFEREE, KIT, PITCH } from './config.js';
import { Player, headingOf } from './player.js';
import { kitMaterial } from './avatar.js';
import { RefSignal } from './moves.js';
import { whistle } from './audio.js';

// Arbitro in campo: stesso player.glb con la divisa nera, segue l'azione a
// distanza (di lato e un po' dietro), fischia e fa il gesto a ogni
// interruzione, mostra i cartellini con il cartoncino in mano.

const HL = PITCH.length / 2, HW = PITCH.width / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CARD = { yellow: 0xf2c230, red: 0xd8323a };

export class Referee {
  constructor(match, tpl, shadowTex) {
    this.m = match;
    const kit = KIT.referee;
    this.p = new Player({ id: 'arbitro', name: 'Arbitro', number: null, role: 'ARB', overall: 70, attrs: REFEREE.attrs }, kit, tpl, kitMaterial(tpl, kit), shadowTex, 1);
    this.p.referee = true;
    const [w, h] = REFEREE.cardSize;
    this.card = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: CARD.yellow, side: THREE.DoubleSide }));
    this.card.visible = false;
    this.card.renderOrder = 5;
    this.cardT = 0;
  }

  get mesh() { return this.p.mesh; }
  get shadow() { return this.p.shadow; }

  place(x, z) { this.p.place(x, z, headingOf(0, -1)); }

  // Di lato alla palla, dalla parte lontana dalla telecamera se c'e' spazio,
  // e un po' dietro rispetto a chi attacca.
  update(dt) {
    const m = this.m, p = this.p, b = m.ball.pos, R = REFEREE;
    const team = m.poss.team;
    const d = team ? m.dirOf(team) : 0;
    let tz = b.z - R.side;
    if (tz < -HW + 2) tz = b.z + R.side;
    const tx = clamp(b.x - d * R.behind, -HL + 4, HL - 4);
    tz = clamp(tz, -HW + 1.5, HW - 1.5);
    const dx = tx - p.pos.x, dz = tz - p.pos.z, dist = Math.hypot(dx, dz);
    const face = { x: b.x - p.pos.x, z: b.z - p.pos.z };
    // mai addosso alla palla
    const bd = Math.hypot(face.x, face.z);
    if (bd < R.minDist) { p.drive(dt, -face.x, -face.z, 0.8, { face }); return; }
    if (dist < 1) p.drive(dt, 0, 0, 0, { face });
    else p.drive(dt, dx, dz, Math.min(1, dist / 3), { face, sprint: dist > R.sprintDist });
  }

  // Fischio e gesto. kind: 'point' | 'up' | 'advantage' | 'spot'; toward: punto
  // del campo verso cui indica.
  signal(kind, toward, sound = 'short') {
    if (sound) whistle(sound);
    const p = this.p;
    const dir = toward ? { x: toward.x - p.pos.x, z: toward.z - p.pos.z } : { x: p.dirX, z: p.dirZ };
    if (Math.hypot(dir.x, dir.z) < 1e-3) { dir.x = p.dirX; dir.z = p.dirZ; }
    p.avatar.playProc(new RefSignal(REFEREE, kind, dir));
  }

  // Cartellino: braccio alzato con il cartoncino del colore giusto.
  showCard(type, toward) {
    this.card.material.color.setHex(CARD[type] || CARD.yellow);
    this.cardT = REFEREE.signal.rise + REFEREE.signal.hold;
    this.signal('up', toward, null);
  }

  // Dopo il disegno del corpo: il cartoncino sopra la mano destra, rivolto
  // alla telecamera.
  sync(alpha, dt, cam) {
    this.p.sync(alpha, dt);
    if (this.cardT > 0) {
      this.cardT -= dt;
      const hand = this.p.avatar.rig.RightHandMiddle1 || this.p.avatar.rig.RightHand;
      this.p.mesh.updateMatrixWorld(true);
      hand.getWorldPosition(this.card.position);
      this.card.position.y += REFEREE.cardSize[1] * 0.5;
      this.card.quaternion.copy(cam.quaternion);
      this.card.visible = true;
    } else this.card.visible = false;
  }
}
