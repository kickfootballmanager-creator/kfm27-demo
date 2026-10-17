# Diario del lavoro lungo (dal 17/10/2026)

Richiesta: blocchi A-F (analisi dei video, palla e gesti, equilibrio, gol e
calcio d'inizio, stadio, Meshy), ognuno con test di durata (violazioni non
oltre le 7 di partenza), commit e push separati. Ci si ferma solo per
decisioni irreversibili, per superare 1500 crediti Meshy o se 3ds Max e
V-Ray non funzionano. Risposte del 17/10: triangolo lime come nel
riferimento; capriola e ruota con Meshy; calcio d'inizio dal video, con la
skill aggiornata.

## Da dove ripartire

Leggere "Stato" qui sotto: l'ultimo blocco "in corso" e la sua lista "manca".

## Come e' organizzato

- **Si lavora in `C:\Users\UTENTE\Desktop\kfm27-lavoro`**, una worktree di
  git sul ramo `lavoro`, nata da `8019126`. In `kfm27` restano intatti i 12
  file modificati e non committati del 04/10 (pressing come PES 2021,
  pallonetto L1 + tiro, culmine del tiro, portiere rilassato e retropassaggio,
  rotazione e ombra della palla, note PES): l'utente ha chiesto di non
  toccarli. Cosi' quello che si prova e' identico a quello che si committa.
- Push: `git push origin lavoro:main` (fast-forward). Il `main` locale di
  `kfm27` resta indietro: per provare in `kfm27` bisogna prima decidere cosa
  fare dei 12 file.
- Per provare il gioco: `python -m http.server 8080` dentro `kfm27-lavoro`,
  poi http://localhost:8080/?match3d.
- File esclusi da git copiati nella worktree: `anims-*.glb`, `player.glb`,
  `ball/ball.glb`, `ball/soccerball.fbx`, `coach_start_reference.png`,
  `src/assets/sponsor/` (non tracciato, dell'utente: non committarlo).
  Collegati con una giunzione: `src/assets/match3d/source/` (Studio33, 1,5 GB),
  `src/assets/players/`, `debug/` (video di riferimento e strumenti).
- Gli strumenti in `debug/riferimenti/strumenti/*.mjs` servono la cartella di
  `KFM_ROOT` (di base `kfm27-lavoro`).
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
| F, Meshy | da fare | |

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
