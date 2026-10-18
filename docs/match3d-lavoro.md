# Diario del lavoro lungo (dal 17/10/2026)

Richiesta: blocchi A-F (analisi dei video, palla e gesti, equilibrio, gol e
calcio d'inizio, stadio, Meshy), ognuno con test di durata (violazioni non
oltre le 7 di partenza), commit e push separati. Ci si ferma solo per
decisioni irreversibili, per superare 1500 crediti Meshy o se 3ds Max e
V-Ray non funzionano. Risposte del 17/10: triangolo lime come nel
riferimento; capriola e ruota con Meshy; calcio d'inizio dal video, con la
skill aggiornata.

## Da dove ripartire

18/10: seconda richiesta lunga, blocchi 0-6 (vedi "Blocchi 0-6" in fondo al
registro). Blocchi 0 e 1 fatti; poi 2 (pelle e teste Meshy), 3 (texture e
porte dello stadio), 4 (divise), 5 (caricamento e presentazione), 6 (solo
bozzetto della modalita' Calcio d'inizio, poi fermarsi). Resoconto finale per
blocco con come provarlo. Meshy: al piu' 1500 crediti senza chiedere.

## Come e' organizzato

- **Dal 18/10 si lavora solo in `C:\Users\UTENTE\Desktop\kfm27`**, ramo
  `main`, push con `git push origin main`. La worktree `kfm27-lavoro` non si
  usa piu'. I 12 file del 04/10 stanno sul ramo locale
  `salvataggio/modifiche-04-10` (736d37d, non pubblicato): non toccarlo.
- Per provare il gioco: `python -m http.server 8080` dentro `kfm27`, poi
  http://localhost:8080/?match3d (o dalla carriera, "Gioca ora").
- File esclusi da git copiati nella worktree: `anims-*.glb`, `player.glb`,
  `ball/ball.glb`, `ball/soccerball.fbx`, `coach_start_reference.png`,
  `src/assets/sponsor/` (non tracciato, dell'utente: non committarlo).
  Collegati con una giunzione: `src/assets/match3d/source/` (Studio33, 1,5 GB),
  `src/assets/players/`, `debug/` (video di riferimento e strumenti).
- Gli strumenti in `debug/riferimenti/strumenti/*.mjs` servono la cartella di
  `KFM_ROOT` (di base `kfm27`).
- Le skill stanno in `kfm27/.claude/skills` (non tracciate).

## Stato

| Blocco | Stato | Commit |
|---|---|---|
| Preparazione (worktree, diario, test di partenza) | fatta | |
| A, analisi dei video | fatto: `docs/match3d-riferimento.md` A10 | vedi registro |
| B, palla e gesti | fatto | vedi registro |
| C, equilibrio | fatto | vedi registro |
| D, gol e calcio d'inizio | fatto | vedi registro |
| E, stadio | fatto | vedi registro |
| F, Meshy | fatto | vedi registro |

Crediti Meshy spesi: 0 (saldo 2992 il 17/10).

## Registro

### 17/10, sera (interrotto per i limiti di utilizzo)

Fatto:
- Worktree `kfm27-lavoro` (ramo `lavoro` da `8019126`), asset e strumenti
  collegati, diario, memoria `lavoro-lungo-diario`.
- Test di partenza nella worktree (ultimo commit, senza i 12 file del 04/10):
  5 violazioni (piedi 3, portiere 2), rossi 0, statistiche nell'obiettivo,
  2,8 gol a partita. `debug/riferimenti/soak_lavoro_base.log`.
- Blocco A, misure (strumenti in `debug/riferimenti/strumenti/`):
  `radar30.py` (radar a 30 Hz, colori di v1 e v2: in v2 cerchi grigi,
  triangoli lime, comandato verde), `eventi.py` (voli, squadre di chi calcia
  e riceve dai segni vicini al punto di partenza e d'arrivo: il segno di chi
  ha la palla e' sempre coperto), `analisi_a.py`, `hook-eventi.js` (stesse
  misure in KFM27 con probe.mjs), dati in `debug/riferimenti/eventi/`.

Risultati (riferimento v1, 318 s di radar; KFM27, 4 partite IA contro IA):

| | Riferimento | KFM27 |
|---|---|---|
| Calci al minuto | 12,7 | 30 |
| Tenuta palla dalla ricezione al calcio | 2,1 s (utente 2,06, IA 2,3) | 0,5 s |
| Passaggi riusciti | 81% (persi a 12,8 m di mediana) | 60% |
| Cambi di possesso a terra | 2,1 al minuto, puliti (piede o spalla, nessuna caduta) | 4,8 |
| Falli | 0 in 7,6 minuti di gioco (v1 e v2); un fuorigioco con VAR (316-336 s v1) | 3,6-7,4 al minuto |
| Tiri | da 15-20 m, 21-28 m/s, vicino al palo (z 2,8-4,4); v1 5 gol e 1 parata su 6 | 17-22 m, 30-31 m/s, quasi tutti respinti o altro |
| Ricezione (arrivo, +0,3 s, +0,8 s) | 11,5 / 3,4 / 5,1 m/s | 11,9 / 3,0 / 7,3 |
| Attacco: lunghezza, larghezza, ultimo uomo dietro la palla, quota davanti alla palla | 36 / 38 / 26 m / 22% | 32 / 41 / 27 m / 20% |
| Difesa: stesse misure | 24 / 29 / 22 m / 29% | 27 / 38,5 / 11 m / 40-50% |
| Passaggi: distanza mediana | 13,3 m | non misurata |

- Soste nel riferimento: quasi nessuna. Fra calcio d'inizio e gol il radar non
  si interrompe; in v2 un angolo (dopo una parata, con replay) e una rimessa.
- Replay anche dopo una grande occasione (v2 56-68 s) e dopo un fuorigioco (VAR).
- L'altezza dei lanci non si misura dal radar (non distingue alto e rasoterra).

Cause gia' trovate per il blocco B:
- `main.deflect()`: i palloni sotto 0,45 m e sotto 12 m/s non toccano mai i
  corpi; l'intercetto in `contacts()` e' un sorteggio una volta per pallone:
  se fallisce la palla attraversa le gambe.
- Barra di potenza bloccata: quando la carica si annulla senza calcio
  (possesso perso, cambio di modo, colpo di testa) `charging` va a null senza
  `barTimer`, e `syncMarkers` lascia la barra col vecchio valore.

Da dove ripartire:
1. Scrivere la sezione "A10. Partita intera" in `docs/match3d-riferimento.md`
   con la tabella qui sopra; commit e push del blocco A (solo documento: vale
   il test di partenza). Push: `git push origin lavoro:main`, poi verificare
   GitHub Pages ("Gioca ora" invariato).
2. Blocco B: collisione di ogni pallone basso con le sfere del corpo
   (controllo o deviazione), barra di potenza, ricezione (aspetto visivo:
   catturare da vicino), palla che fluttua (ombra di contatto, rotazione,
   lanci).
3. Blocco C: tenuta palla 2 s e 12-13 calci al minuto, passaggi riusciti
   80%, falli quasi assenti (nuovi obiettivi del test di durata e della
   skill), difesa stretta e bassa, portieri: 1 parata su 4 sui tiri piazzati
   dal limite; test 90 contro 60 per ogni attributo.
4. Blocco D: triangolo lime, compagni che non attraversano chi esulta, skill
   del calcio d'inizio (un solo giocatore al centro, passaggio indietro).
5. Blocchi E (stadio, 3ds Max e V-Ray) e F (Meshy, al massimo 1500 crediti,
   pilota prima): non iniziati. Crediti Meshy spesi: 0.

### 17/10, notte: blocco A chiuso

- Sezione A10 in `docs/match3d-riferimento.md` con la tabella del registro
  sopra e le conseguenze per i blocchi B-D. Il blocco cambia solo documenti:
  il test di durata che vale e' quello di partenza (5 violazioni).
- Commit `f8b1ba4`, push `23b8932..f8b1ba4` (con i 5 commit delle tappe
  1-5). GitHub Pages (`strumenti/pages_check.mjs`): manager caricato,
  MATCH3D_ENABLED spento anche con ?match3d, nessun file match3d scaricato,
  nessun errore.

### Blocco B (in corso)
- Barra di potenza: una carica annullata senza calcio la lasciava a schermo
  ferma (main.syncMarkers); ora sparisce subito.
- Rasoterra contro i corpi (main.deflect, trapLow): un pallone basso che
  prende piede o tibia viene controllato (AI.intercept, compagni 85%) o
  rimbalza a terra; prima sotto 12 m/s attraversava le gambe.
- Ricezione (main.preTrap, startTrap, contacts): la clip di stop parte prima
  dell'arrivo con il tocco nel fotogramma giusto, la cattura avviene alla
  distanza del tocco, la palla resta almeno 0,6 m davanti (RECEIVE.trap
  minAhead, keepRate). Prima: palla fermata a 0,6-0,78 m in un fotogramma,
  tocco a vuoto dopo, palla a 0,2 m dal corpo. Catture in
  `debug/riferimenti/tappe5/ricez/` (ko7 prima, ko7e dopo).
- Palla che fluttua: con le ombre vere l'ombra a disco spariva (ora sempre,
  BALL.shadowWithMap 0,7); rotazione disegnata limitata a 55 rad/s
  (BALL.visualSpin). Lanci misurati: plausibili (21,7 m, 1,48 s, 4,85 m).
- Test di durata del blocco B: 5 violazioni (piedi 2, portiere 2, osso 1),
  statistiche nell'obiettivo.

Prossimo (blocco C), cause trovate: DUEL.contact side 0,9 e back 1,0 (quasi
ogni avvicinamento laterale diventa trattenuta o spinta: 84% dei falli);
carrierThink decide appena ricevuta palla (tenuta 0,5 s); difesa larga
(SHAPE.defend width 28,5) e alta (behindBall 7).

### Blocco C (fatto)

- Falli rari, ritmo e forma del riferimento, scelta del passaggio con la
  gara d'intercetto, portieri tarati (8 parate su 30 tiri al palo dal
  limite), attributi che si sentono (banco `strumenti/attributi.js`, tabella
  in `docs/match3d-riferimento.md`, Blocco C). Obiettivi del test di durata e
  skill match3d aggiornati (calcio d'inizio dal video, falli rari).
- Test di durata: 3 violazioni, statistiche nei nuovi obiettivi.

### Blocco D (fatto)

- clearWay (nessuno attraversa chi esulta), triangolo lime #7fd34e, skill
  aggiornata. Test di durata: 5 violazioni, statistiche nell'obiettivo.
- Restano: replay dopo una grande parata, VAR sul fuorigioco.

### Blocco E (fatto)

- 3ds Max 2027 in `F:\3dsmax\3ds Max 2027\`, V-Ray 7 in
  `C:\Program Files\Chaos\V-Ray\3ds Max 2027`; MultiScatter assente.
  Lancio in batch: `debug/stadio/strumenti/run_batch.ps1 -Script <.ms> -Scene <.max> -Out <cartella> [-Bip <.bip>]`
  (mette le variabili di V-Ray e risponde "No" all'avviso di aggiornamento;
  il 3ds Max aperto a mano non si tocca). `ok` in MAXScript e' riservata.
- Esportati (in `kfm27/debug/stadio/`, fuori da git):
  `export/stadium.fbx` (strutture, senza luci, proxy, personaggi e oggetti
  di MultiScatter), `export/splines.json` (spline di distribuzione: 2789 file
  di seggiolini, 2789 di tifosi), `asset/Seat_01a|b.fbx` e 9 tifosi con un
  movimento .bip ciascuno (`run_assets.ps1`).
- Visibilita' misurata (`strumenti/visibili.py`): la telecamera di gioco
  vede quasi solo la tribuna bassa di fronte; replay e primi piani il resto.
  Budget per oggetto in `tools/match3d/stadium_build.py` (KEEP).
- `tools/match3d/stadium_sprites.py`: `sprites/crowd.png` (9 persone, braccia
  giu' e su, maschera di maglia, sciarpa e bandiera per i colori della
  squadra) e `sprites/seats.png` (fila di 32 posti aperti e chiusi).
- `tools/match3d/stadium_build.py` -> `src/assets/match3d/stadium/stadium-high|low.glb`
  (gitignored): pezzi minuscoli tolti, riduzione per oggetto, fusione per
  materiale, texture 1024/512, banner neutri, AO di Cycles nei vertici,
  seggiolini a strisce lungo le file, 51.000 tifosi nelle extras.
- `stadium.js`: carica il modello se c'e' (altrimenti lo stadio semplice),
  taglio 8 m davanti alla telecamera, banner con gli sponsor della palla e
  KFM27, maxischermi col risultato, pubblico instanziato dall'atlante reso.
- Controllo a occhio fatto (banner leggibili, maxischermo col risultato,
  terreno erboso dietro i cartelloni), disegno misurato ai tre livelli.
- Test di durata: 6 violazioni in 10 partite (limite 7), 0 errori,
  statistiche nell'obiettivo. Commit e push del blocco E.

### Blocco F (fatto)

- Crediti Meshy: 587 in tutto (2992 -> 2405), sotto i 1500 concessi.
  Registro di ogni compito in `src/assets/match3d/source/meshy/registro.json`;
  la chiave sta solo in MESHY_API_KEY (`tools/match3d/meshy.py` non la stampa).
- Animazioni, pilota poi serie: rigging del Calciatore (5), capriola dalla
  libreria (azione 452, 3), "ruota poi pugni al cielo" e "capriola poi braccia
  alzate" da testo (10 + 3 l'una; la ruota rifatta una volta), 47 crediti.
  `tools/match3d/meshy_build.py` le porta sul Calciatore (stesse ossa per
  nome, rotazioni nel mondo rispetto alla posa di riposo, corsa nei metadati)
  in `anims-meshy.glb`, ruolo celebrate: entrano nel mazzo delle esultanze
  (livello alto subito, medio in secondo piano, pacchetto facoltativo).
- Teste: pilota (30) poi 16 teste (480) e una rifatta (30). Meshy restituisce
  sempre una testa intera anche chiedendo "solo capelli": teste, capigliature
  e barbe arrivano insieme, 17 combinazioni (carnagioni chiare, olivastre,
  scure, est asiatica; rasato, cresta, ricci, treccine, grigi, crocchia;
  barba corta, piena, rossa, pizzetto). Master 4K in `source/meshy`.
  `tools/match3d/meshy_heads.py`: testa del Calciatore proiettata su quella di
  Meshy (peso da 0 sopra il colletto a 1 sotto la mascella: giunzione
  identica), colore trasferito nelle UV del corpo (punto piu' vicino),
  riquadro di 512 px, tinta della pelle del corpo. `heads.glb` (6,4 MB,
  ignorato da git). In gioco (`avatar.headVariant`, `headOf`): testa stabile
  per giocatore, una draw call come prima.
- Esultanze: il cerchio dei compagni sta dove la clip porta chi esulta, un
  posto sulla sua corsa va di lato, la corsa della clip del compagno si
  accorcia a 0,8 m da lui (prima la 052 lo portava dentro chi esulta).
  Distanza minima misurata con gol forzati: 0,54-0,72 m.
- Come nel riferimento le acrobazie di Meshy si vedono nel primo piano: chi
  segna corre 7 m durante la diretta e la clip parte 0,2 s prima dello
  stacco (`RULES.celebration.late`, `rules.lateCelebration`).
- Il primo test di durata del blocco ha dato 10 violazioni: 6 erano il
  controllo "clip con ossa senza traccia" (glb_pack toglieva le tracce delle
  ossa ferme nella posa di riposo; ora `keep_rest` le tiene per le clip di
  Meshy). Senza quelle, 4.
- Il secondo test di durata: 8 violazioni, 3 del controllo del braccio sulle
  clip di Meshy (capriola: un gomito piegato al contrario per 2 fotogrammi;
  ruota: gomito 1-3 gradi fuori dalla cerniera). `meshy_build.elbow` ora
  raddrizza l'avambraccio fino a 20 gradi di piega quando la cerniera supera
  30 gradi (45 fotogrammi): misurato col `rig.armAngles` del gioco su ogni
  fotogramma, cerniera massima 30,5 gradi (limite 35), torsione 49 (70).
- Test di durata finale del blocco F: 5 violazioni (portiere 4, osso 1),
  0 errori, statistiche nell'obiettivo. Commit e push del blocco F.
- Video affiancati del resoconto: `debug/riferimenti/gesti2/video/` (7 gesti
  e 2 esultanze).

## Blocchi 0-6 (dal 18/10, solo in `kfm27`)

Richiesta: blocco 0 (esultanza in rules.js), 1 (gameplay come il
riferimento, punto per punto con misure, differenze nel diario e video
affiancati), 2 (pelle e teste), 3 (stadio), 4 (divise), 5 (caricamento e
presentazione), 6 (bozzetto della modalita' Calcio d'inizio, poi fermarsi).
Ogni blocco: test di durata, commit e push. Meshy al piu' 1500 crediti.

### Blocco 0 (fatto)

- `rules.lateCelebration`: il via del gesto lo da' l'orologio della regia
  (`m.show.t`), non il tempo della simulazione: a pochi fps la corsa finiva
  dopo lo stacco sul primo piano. Commit `d7a3155`.

### Blocco 1 (fatto)

Strumenti nuovi in `debug/riferimenti/strumenti/`: `possesso_rif.py`
(possesso nel riferimento: piedi sotto il triangolo lime, palla vicina,
telecamera del momento), `hook-possesso.js` e `possesso_modi.py` (stesse
misure in KFM27, per modo della conduzione), `possesso_conf.py`,
`kstrip.py` (strisce di KFM27 come `strip.py`), `scena-filtrante.js`,
`scena-pressing.js`, `scena-portiere.js` (scene ripetibili con comandi
simulati), `palla_anomalie.py`, `palla_accel.py`, `hook-nastri.js`,
`affianca.py` e `prima_dopo.py` (video), `replay-debug.mjs --clean`.
Video: `debug/riferimenti/blocco1/video/1-8_*.mp4`, riferimento (o prima)
sopra e KFM27 sotto, a velocita' vera e poi rallentati.

**Possesso dopo la ricezione** (2 s dalla ricezione, riferimento v1 con la
telecamera inseguita, KFM27 4 partite IA contro IA):

| | Riferimento | KFM27 prima | KFM27 dopo |
|---|---|---|---|
| Distanza palla-piede, mediana / 90% | 0,41-0,55 / circa 1,0 m | 0,71 / 1,09 m | 0,59 / 0,93 m |
| Velocita' della palla rispetto al giocatore, mediana / 90% | 1,8 / 3,4 m/s (con il rumore della misura) | 3,2 / 6,2 nella conduzione continua, fino a 13 | 1,4 / 3,5 m/s |
| Ricezioni con la palla oltre 1,2 m dal piede | 33% (rumore) | 49% | 14-26% |
| Tocchi al secondo | 2-4 (a vista, 112,2 s: tocchi ogni 0,15-0,55 s) | 1,5 | 1,1-1,2 |
| Velocita' della palla in possesso p50 / p75 / p90 | 4,4 / 6,0 / 7,8 m/s (radar) | | 4,8-5,0 / 6,4-6,7 / 8,2-8,9 |

Cause e correzioni:
- La palla "volava": durante lo stop l'IA girava subito verso la sua meta e
  la palla, mandata dritta, finiva 1,9 m di lato; la conduzione continua poi
  la riportava ai piedi a 13 m/s. Ora durante lo stop il corpo segue la
  direzione del tocco (`main.trapMove`, `p.trap.hE`), e rispetto al
  giocatore la palla non va oltre 3,5 m/s (`DRIBBLE.maxRel`, prima 9) ne'
  cambia velocita' oltre 25 m/s^2 (`relAcc`, prima 70).
- Palla lenta presa a 1,25 m: la clip di stop toccava l'aria e la palla
  restava 1,2 m davanti per tutto lo stop. Ora solo entro 0,85 m
  (`RECEIVE.slowReach`).
- Due tocchi di conduzione in fotogrammi consecutivi (replay del 18/10
  14:22, f40-f41): un tocco al piu' ogni 0,6 x `roll.minT`.
- Conduzione a tocchi anche piano (`roll.minSpeed` 1,4, prima 2,2).
- Differenza che resta: i tocchi. Le clip di conduzione Studio33 toccano la
  palla una volta per ciclo di passo (0,57-0,7 s); il riferimento a passo
  lento tocca anche a ogni passo. Servirebbero clip con due tocchi per ciclo.

**Filtrante** (replay dell'utente del 18/10 14:22: a10 calcia a 15,5 m/s, a7
corre oltre la linea della palla e torna indietro, intercetta h2): la scelta
del punto sulla traiettoria scartava i punti "dietro di lui lungo la strada
della palla" anche quando la palla gli arrivava di traverso, e lo mandava in
fondo alla traiettoria. Ora lo scarto vale solo con la palla nel suo verso
(`THROUGH.sameDir`). Velocita' come nel riferimento (31 filtranti di v1:
9-14 m/s sui corti, 20-24 m/s sui 22-36 m, `THROUGH.speedBase/speedPerM`),
arrivo 8,4 m davanti al ricevente, chi corre non scatta prima del
passaggio. Scena del replay: ricevuto dopo 1,2 s. Test di durata: filtranti
riusciti 4,2 a partita (prima 2,3).

**Pressing con X tenuto** (riferimento 78,4-82,0 s e 258,6-262,1 s: il
difensore chiude a meno di un metro, accompagna e toglie la palla col piede,
senza cadute): prima correva sul corpo del portatore e da 4 m gli girava
attorno a 1,35 m verso la porta, arrivava di lato e gli passava accanto; in
piu' l'IA della squadra azzerava a ogni decisione il tempo di marcatura del
giocatore dell'utente, e il suo contrasto automatico non partiva mai. Ora
(`defense.pressBall`, `PRESS.user`) corsa sul punto d'intercetto della
palla, davanti fra palla e porta a 0,8 m, di lato o da dietro a 0,55 m,
frenata e passo del portatore, piede sulla palla con le clip piccole.
Scene (`scena-pressing.js`): di fronte palla rubata in 2,5 s, di lato
(taglia la strada) in 2,5 s, da dietro un portatore piu' veloce non si
prende (come nel calcio vero), portatore fermo: la passa prima.

**Falli** (replay del 18/10 14:21: a19 dell'utente preme X due volte, parte
l'affondo 738_Tackles_Stand_90 mentre home 6 fa la finta 557_Tricks a gambe
in aria; il piede prende la caviglia, reazione 267, e nello stesso
fotogramma la palla passa a chi ha fatto fallo, poi il fischio dopo 0,75 s):
- contrasti automatici (pressing, IA) solo con le clip piccole
  (`TACKLE.pressClips`); il contrasto premuto mai con gli affondi di lato
  738/739 (`TACKLE.manualSkip`);
- l'IA non fa la finta col difensore gia' a meno di 1,6 m e la fa meno
  (6% invece del 25%): nel riferimento il portatore pressato protegge o passa;
- chi fa fallo non tocca la palla per 0,85 s (`foulLock`): la palla resta a
  chi ha subito il fallo e l'arbitro decide vantaggio o punizione.
  Test di durata: 1,4 falli a partita (obiettivo 0-4), nessun cartellino.

**Palla**: nei replay dell'utente nessun teletrasporto ne' strappo
(`palla_anomalie.py`); quello che si vede e' la conduzione. Accelerazione
orizzontale della palla a terra in possesso fuori dai tocchi
(`palla_accel.py`; una palla vera fra due tocchi rallenta di 2-5 m/s^2):
prima p90 73 m/s^2 e 29% dei fotogrammi oltre 30; dopo p90 34 e 15%. Resta
la conduzione continua (da fermi, in protezione, nelle svolte strette), che
porta la palla senza tocchi veri. Costanti della palla gia' vicine al vero
(resistenza dell'aria 0,013 come un pallone reale, attrito a terra dal
riferimento).

**Esultanza**: nei 4 gol di v1 chi segna si allontana dalla porta verso la
linea laterale e la bandierina; il primo piano lo mostra coi cartelloni
dietro. Prima correva 7 m dritto davanti a se'. Ora (`rules.flagCelebration`)
corre di scatto verso la bandierina dalla sua parte (4 m dentro le linee) e
la clip finisce li'; i compagni vanno dove la clip lo porta (`main.cheer`).
Gol forzato: arrivo alla bandierina in 3,7 s a 8,7 m/s, gesto all'arrivo.

**Calcio d'inizio** (richiesta dell'utente): chi batte girato verso la
propria porta passa in avanti rispetto al corpo (504_Pass_Stand_0) al
compagno 11,7 m dietro; prima guardava avanti e colpiva all'indietro
(445_KickOff_180). Nota in `docs/match3d-pes.md`.

**Portiere** (comandi di PES 2021 in `docs/match3d-pes.md`): prima il
portiere dell'utente non si comandava mai (decideva l'IA, rinvio dal fondo
sempre lungo e dritto). Ora con la palla in mano o al piede lo comanda
l'utente: si muove in area, X lancio, Triangolo nello spazio, Cerchio e
Quadrato rinvio al volo (potenza = distanza), R1 + Cerchio rinvio alto, R1 a
levetta ferma palla a terra; rinvio dal fondo con X, Triangolo, Cerchio,
Quadrato. Sei scene provate (`scena-portiere.js`): tutte vanno; lanci con le
mani 14-20 m/s (prima della correzione dell'arco 32 m/s). Nei video di
riferimento l'utente non rinvia mai col portiere: il video 7 e' solo KFM27.

Test di durata del blocco 1 (`soak_blocco1.log`): 4 violazioni in 10 partite
(limite 7: 3 gol parabili, 1 posa ferma che trasla, gia' presenti prima),
0 errori; 2,3 gol, 5,4 tiri, 1,4 falli, 0,6 scivolate a partita, contrasti
vinti 10,8 (prima 9,7).
