# Partita 3D: riferimento video, stadio, Meshy e piano di upgrade

Analisi del 16/10/2026, misure del riferimento ripetute il 17/10/2026 sui
video originali a risoluzione piena (sezione 0). Le misure di KFM27 vengono
dal working tree del 16/10 (HEAD 23b8932 piu' le modifiche non ancora
committate in 12 file di `src/js/match3d/`).

Le immagini citate stanno in `debug/` e restano fuori da git (cartella
ignorata): sono fotogrammi di un gioco commerciale e del progetto stadio
acquistato, non vanno nel repository pubblico.

## 0. Misure ripetute il 17/10/2026 sui video a risoluzione piena

I video nuovi (`DBYN9587.MP4` = v1, `UEJC3760.MP4` = v2) sono le stesse
registrazioni dei file WhatsApp: stesso numero di fotogrammi (31.126 e
8.357), stessi tempi. Sono registrazioni dello schermo di un iPhone, HEVC
2622 x 1206 a pixel quadrati, 60 fps, colore BT.709 a gamma piena. I tempi
citati in questo documento valgono per entrambe le copie.

La copia WhatsApp aveva due difetti che falsavano alcune misure del 16/10:

- **pixel non quadrati**: WhatsApp aveva stirato l'immagine del 2,3% in
  orizzontale (registrazione ECC fra le due copie a 64,9 s: x 0,32837 e y
  0,32086 per pixel). Il calcolo della telecamera supponeva pixel quadrati,
  quindi altezza, distanza e campo visivo uscivano sbagliati di qualche
  percento. La taratura su KFM27 non poteva accorgersene: le catture di
  KFM27 hanno pixel quadrati.
- **radar a bassa risoluzione**: a 848 x 384 un metro valeva un pixel e il
  radar sembrava aggiornarsi a 12 Hz. A piena risoluzione (2,83 pixel per
  metro in lunghezza, 2,99 in larghezza) si aggiorna a 30 Hz e da' le
  velocita' della palla con un errore del 3%: sul passaggio misurato sul
  campo il 16/10 (16,7 m/s) il radar da' 16,2 m/s.

Strumenti nuovi in `debug/riferimenti/strumenti/` (dati in
`debug/riferimenti/misure_hi/`): `hires.py` (formato e maschera dell'HUD),
`fit_pts.py` (telecamera esatta da punti del campo, poi rifinita sulle
linee), `track_hi.py` e `cam_summary.py` (telecamera a 5 Hz), `radar_hi.py`,
`flights_hi.py` e `shape_hi.py` (palla, voli, squadre dal radar),
`color_hi.py` e `stripes_hi.py` (colore e strisce), `strip.py` (strisce di
fotogrammi del giocatore comandato), `kfm_frame.mjs` (fotogrammi di KFM27
ripetibili: seme fisso, passo fisso, stesso istante prima e dopo una
modifica).

### Cosa cambia per le tappe 1-3

| Tappa | Misura | 16/10 (WhatsApp) | 17/10 (risoluzione piena) |
|---|---|---|---|
| 1 Prato e luce | colore dell'erba | #497638, tinta 104, saturazione 53% | #497838, tinta 104, saturazione 53%: invariato |
| | bianchi (L* al 99,7 percentile) | 87-91 | 92,5 (v1), 94,5 (v2) |
| | strisce di taglio | 7,5 punti di L*, bordi morbidi | larghe 6,0 m, un bordo sulla linea di meta' campo, 7,5 punti di L* fra chiara e scura |
| | ombre | corte, morbide | 0,7-1,05 m per un giocatore di 1,8 m: sole alto 60-70 gradi. Cadono verso sinistra sullo schermo e un po' lontano dalla telecamera |
| 2 Telecamera | altezza | 22,4 m | 24,8 m a centrocampo (calcolo esatto); 22,0 m al limite dell'area; 18,1 m con la palla in area sul lato della telecamera |
| | inclinazione | 25-26 gradi | 25,7 a centrocampo; 21,8-23,7 vicino alle aree |
| | campo visivo | 22-23 gradi verticali | 21,4 verticali, 44,7 orizzontali sullo schermo 2,17:1 |
| | distanza dal punto inquadrato | 49,6 m | 57,2 m a centrocampo; 49-55 m vicino alle aree |
| | larghezza inquadrata | 46 m | 46,9 m a centrocampo, 41-43 m vicino alle aree: la stretta vale l'8-13%, non il 4% |
| | in larghezza | segue il 40% della palla | confermato: la telecamera si sposta del 39-43% della palla, e scende di 0,16-0,24 m per metro di palla verso di lei; la mira sta a 0,76 volte la palla piu' 1,1 m verso la telecamera |
| | inseguimento | ritardo 0,1 s | ritardo 0,08-0,16 s, nessun anticipo; con la palla oltre 6 m/s la mira resta 1,4-1,7 m indietro |
| | calcio d'inizio | 25,5 m, 58 m, 23,6 gradi, campo visivo 18,4 | 24,6 m, 64 m dal centro, 22,7 gradi, campo visivo 24,2 verticale: inquadra 59,5 m |
| 3 Ritmo e IA | passaggio, partenza | 16,6 m/s (11 dal radar) | 16,4 m/s (29 passaggi col tasto, 13,5-21,7); cresce di 0,27 m/s per metro: 15 m/s a 10 m, 18 a 20 m |
| | passaggio, rallentamento | 3-4 m/s² | 6,1 m/s² (mediana di 72 voli, 4,2-7,7): arriva al compagno a circa 11 m/s dopo 1 s e 12 m |
| | filtrante | non separabile dal passaggio | 15,1 m/s in partenza (27 filtranti), 14 m, arriva a 8 m/s |
| | tiro | stima 28-30 m/s su un gol | 27,8 m/s mediana su 6 tiri di v1 (23,4-28,3), 28,6 in v2; velocita' orizzontale dal radar |
| | lancio oltre 30 m | non misurato | 22 m/s (4 lanci), 34 m in 2,25 s |
| | dal tasto al calcio | 0,3-0,55 s | 0,40 s dal tasto alla palla in movimento sul radar (62 calci, 0,20-0,67); tolto il ritardo del radar, 0,35-0,37 s al contatto |
| | durata della pressione | 0,08-0,21 s | passaggio 0,07 s, filtrante 0,08, tiro 0,22 |
| | barra di potenza | nessuna visibile | c'e': una barretta verde fra il triangolo e la testa del giocatore, compare alla pressione e resta fino al calcio; dopo 0,17 s di pressione arriva a meta' |
| | blocco della squadra | 40,6 m di larghezza, 30,4 di lunghezza | 38,9 m (p10 29,9, p90 52,2) e 33,3 m |
| | velocita' dei giocatori su 2 s | 2,9 m/s, 12% sopra 5 | 3,2 m/s, 19% sopra 5 |

In sintesi: la tappa 1 resta con gli stessi colori, ma con righe piu'
bianche, strisce di 6 m e il sole da destra. La tappa 2 cambia nei numeri:
la telecamera va piu' in alto e piu' lontano con un obiettivo un po' piu'
lungo, e si avvicina e si abbassa vicino alle aree. Nella tappa 3 entrano due
fatti nuovi: i passaggi rallentano il doppio dei nostri e il tiro parte piu'
veloce del nostro (27,8 contro 25,8 m/s).

### Animazioni, piedi e tiri (le misure che mancavano)

A piena risoluzione i giocatori sono alti 85-90 pixel: 1 pixel vale circa
2 cm a centrocampo.

- **Velocita' dei tiri**: vedi la tabella sopra. La palla di un tiro si vede
  nitida fotogramma per fotogramma (niente scia): la striscia del 16/10 era
  un effetto della compressione.
- **Gesto del calcio**: passaggio a 64,51 s, contatto a 64,90 s (0,39 s);
  tiro a 117,68 s, contatto a 118,09 s (0,41 s). In quel tempo il giocatore
  continua la conduzione e calcia al tocco successivo: il passo d'appoggio e
  la gamba che carica si vedono solo negli ultimi 0,10-0,13 s. Dopo il
  passaggio il comando passa al ricevente entro un fotogramma dal contatto.
  Strisce in `debug/riferimenti/anim/pass_64.png` e `shot_117.png`.
- **Ricevente**: appena parte il passaggio rallenta e si gira verso la palla
  in circa 0,3 s (65,10-65,40 s, `anim/run10_64.png`), con una frenata a
  passi e non con una rotazione sul posto.
- **Conduzione**: in corsa normale la palla sta 0,3-0,6 m davanti al piede;
  in scatto 1-1,5 m (`anim/sprint_159.png`).
- **Piedi**: in 30 fotogrammi consecutivi del giocatore n. 10 che corre
  accanto alla linea di meta' campo il piede d'appoggio resta fermo per 3-4
  fotogrammi a ogni passo; nessuno scivolamento visibile oltre 1 pixel
  (2 cm).
- **Transizioni**: corsa, calcio e ritorno alla corsa scorrono senza scatti
  visibili fra un fotogramma e l'altro a 60 fps.
- **Non misurato**: la cadenza dei passi. Il conteggio automatico
  (apertura delle gambe, `cadence.py`) sbaglia con giocatori di 85 pixel che
  si sovrappongono; per contarla serve un replay ravvicinato di una corsa
  senza palla.

### HUD a risoluzione piena

Le posizioni di punteggio, pausa, levetta, tasti e radar coincidono con la
tabella A7 entro un punto percentuale. Si vedono in piu':

- la barra di potenza sopra il giocatore comandato (larga il 3,4% dello
  schermo);
- un anello bianco a terra con un arco verde rivolto dove punta la levetta;
- i nomi (testo bianco alto l'1,8% dello schermo) sopra il comandato, il
  destinatario del passaggio e i giocatori vicini alla palla;
- la linea tratteggiata del tiro, dal giocatore verso la porta, che compare
  durante la pressione.

## A. Video di riferimento

### Cosa contengono

| | v1 (`19.36.38`) | v2 (`19.37.45`) |
|---|---|---|
| Gioco | Total Football (mobile, comandi touch a schermo) | stesso gioco |
| Durata | 8:42 | 2:20 |
| Formato | 848 x 384, 60 fps (59,7 medi), H.264 da WhatsApp; dal 17/10 anche l'originale 2622 x 1206 HEVC (`DBYN9587.MP4`) | uguale; originale `UEJC3760.MP4` |
| Contenuto | caricamento, presentazione prepartita, primo tempo con 3 gol, intervallo, ripresa con altri gol | altro stadio (pista rossa, bandiere italiane), 3 gol con replay |
| Gioco effettivo | 372 s con l'HUD di gioco | 85 s |

Copie con nome breve per gli strumenti: `debug/riferimenti/v1.mp4` e `v2.mp4`.
Strumenti e dati grezzi: `debug/riferimenti/strumenti/` e `debug/riferimenti/misure/`.

Il riferimento serve per ritmo e qualita' percepita. Grafica, loghi,
interfaccia e modelli dell'altro gioco non si copiano (regola della skill).

### Metodo

- **Telecamera**: modello prospettico senza distorsione con rollio zero,
  adattato alle linee del campo (105 x 68, misure FIFA) rilevate nel
  fotogramma. Due modi: un calcolo esatto da quattro misure (bordo alto e
  basso del cerchio di centrocampo, linea laterale lontana sulla linea di
  meta' campo, larghezza del cerchio) e un inseguimento a 10 Hz su tre tratti
  di v1 (746 fotogrammi validi) e tre di v2.
- **Taratura del metodo sul mio gioco**: stesso calcolo su un fotogramma di
  KFM27 di cui conosco la telecamera vera. Altezza 15,8 m contro 16,0;
  distanza 42,6 contro 42,0; inclinazione 18,5 gradi contro 18,9; campo
  visivo verticale 25,2 contro 26,0. Errore sotto il 2% sulle distanze e
  sotto 1 grado sugli angoli. L'inseguimento a 10 Hz tiene la posizione lungo
  il campo entro 1 m, ma nei fotogrammi con poche linee confonde distanza e
  zoom: per altezza, inclinazione e campo visivo valgono il calcolo esatto e
  le mediane, non il singolo fotogramma.
- **Palla**: macchia chiara inseguita fotogramma per fotogramma e riportata a
  terra con la telecamera del fotogramma; poi il radar del riferimento, il cui
  quadrato rosso e' la palla (verificato: stesso passaggio, 8,1 m misurati in
  campo contro 8,8 m sul radar). Il radar si aggiorna ogni 0,083 s (12 Hz)
  con circa 1 m di risoluzione.
- **Comandi**: i tasti touch si illuminano quando l'utente li preme. Ho letto
  l'istante di ogni pressione (verde nell'anello del tasto) e distinto
  attacco e difesa dal tasto piccolo "Chiamata corsa", presente solo in
  attacco.
- **KFM27**: catture da Chrome headless alla stessa risoluzione con il
  registro esatto di telecamera, palla e giocatori; due partite IA contro IA
  con sonde che registrano ogni pallone calciato e le posizioni a 5 Hz.

Limite del 16/10: a 848 x 384 i giocatori sono alti 28-32 pixel e la
compressione di WhatsApp cancella i piedi. Il 17/10 le stesse misure sono
state ripetute sugli originali a risoluzione piena (sezione 0), che coprono
anche transizioni, piedi e tiri. Le tabelle di questa sezione riportano i
valori del 17/10 dove sono cambiati.

### Differenze ordinate per quanto si notano

| # | Aspetto | Riferimento | KFM27 | Effetto a schermo |
|---|---|---|---|---|
| 1 | Prato e luce | verde pieno, tinta 104 gradi, saturazione 53%, giorno, righe a L* 92-95, strisce di 6 m | verde oliva, tinta 75 gradi, saturazione 41%, notte, righe a L* 84, strisce di 5,25 m | il campo occupa il 90% dello schermo: e' la prima cosa che vedi |
| 2 | Telecamera | alta 24,8 m, inclinata 25,7 gradi, campo visivo 21,4 gradi, 57 m dal punto inquadrato | alta 16 m, inclinata 21,5 gradi, campo visivo 26 gradi, 43,5 m | da noi le tribune lontane riempiono il 15-20% alto dello schermo e la profondita' si schiaccia |
| 3 | HUD | barra punteggio con stemmi e colori, radar, nomi sopra i giocatori, tasti con pittogrammi che cambiano fra attacco e difesa | pillola scura col testo, niente radar, nome solo del giocatore comandato in alto a sinistra, 6 tasti con glifi | l'HUD resta sempre davanti agli occhi |
| 4 | Dopo il gol | 32 s: diretta, esultanza ravvicinata, stacco col logo, replay di 20 s da 4 inquadrature, stacco, calcio d'inizio con il punteggio grande | 12,5 s: esultanza 3 s, replay da 2 inquadrature, dissolvenza | capita 3-5 volte a partita |
| 5 | Stadio e pubblico | tribune piene in 3D con molte varianti, tabelloni LED animati, tetto aperto col cielo | sagome a sprite ripetute, cartelloni fissi, cielo notturno a tinta unita | si vede nei replay, nelle esultanze, nei calci piazzati |
| 6 | Presentazione | 47 s saltabili (stadio, tunnel, schieramento, formazioni, primi piani) | nessuna | una volta a partita |
| 7 | Tempo dal tocco al calcio | 0,35-0,40 s, la palla parte al tocco di conduzione successivo; tasti solo toccati (0,07-0,22 s) con una barretta di potenza sopra il giocatore | 0,22 s dal rilascio, dopo aver tenuto premuto per la potenza | il tempo totale e' simile; cambia dove lo spendi |
| 8 | Velocita' dei passaggi | 16,4 m/s alla partenza, rallentano di 6 m/s² e arrivano a 11 | 19,8 m/s alla partenza, rallentano di 2-3 m/s² | da noi piu' secchi e piu' veloci all'arrivo |
| 9 | Forma delle squadre | blocco largo 39 m | 34 m | da noi le squadre stanno piu' strette in larghezza |
| 10 | Movimento dei giocatori | 3,2 m/s medi su finestre di 2 s | 2,6 m/s | un po' piu' mosso il riferimento |
| 11 | Velocita' dei tiri | 27,8 m/s alla partenza | 25,8 m/s | da noi un po' piu' lenti |

Confronti visivi: `debug/riferimenti/confronto/a_confronto_centro.png`
(stessa inquadratura di centrocampo), `b_confronto_hud.png` (HUD in un
telefono orizzontale), `c_confronto_v2.png`, `kfm_stills.jpg` (30 momenti di
una partita KFM27).

### A1. Telecamera di gioco

Valori del 17/10 a risoluzione piena. "Esatto": calcolo da 5-7 punti del
campo presi a mano e rifinito sulle linee, errore 0,6-1,6 pixel (64,9 s,
117,0 s, 255,0 s di v1; 5,0 s di v2). "Tracce": 431 campioni buoni a 5 Hz in
v1 e 91 in v2. Le tracce confondono altezza, distanza e zoom (a 65,0 s
danno 53,1 m e 22,9 gradi dove il calcolo esatto da' 57,2 m e 21,4 gradi,
con la stessa larghezza inquadrata): per i valori assoluti valgono i calcoli
esatti, per il comportamento le tracce.

| Misura | Riferimento | KFM27 |
|---|---|---|
| Altezza | 24,8 m a centrocampo (esatto); 22,0 al limite dell'area; 18,1 con la palla in area verso la telecamera; tracce: 22,5 m piu' 0,16-0,24 m per metro di palla lontano dalla telecamera | 16 m |
| Distanza dall'asse del campo | 47,2 m a centrocampo; la telecamera si sposta del 39-43% della palla in larghezza, nei due versi | 42 m, fino a +12 con la palla verso la tribuna (`nearBack`) |
| Inclinazione verso il basso | 25,7 gradi a centrocampo (tracce 25,5-25,7, costante in larghezza); 21,8-23,7 vicino alle aree | 21,5 gradi |
| Campo visivo | 21,4 verticali, 44,7 orizzontali a 2,17:1 (esatto); 20,5-21,7 vicino alle aree | 26 verticali, 23 vicino alle aree |
| Distanza dal punto inquadrato | 57,2 m a centrocampo; 48,8-54,8 vicino alle aree | 43,5 m |
| Larghezza di campo inquadrata al centro | 46,9 m (tracce 46,7, p10 43,2, p90 50,6) | 44 m |
| Stretta vicino alle aree | larghezza 40,7-43,3 m: -8/-13%, ottenuta avvicinandosi e abbassandosi, con lo zoom quasi fermo | -12% con lo zoom (da 26 a 23 gradi) |
| Movimento | carrello lungo la linea laterale, rotazione sotto 1 grado (2,7 in area) | carrello, smorzamento 2,6/s piu' anticipo 0,35 s |
| Punto inquadrato rispetto alla palla | segue la palla con 0,08-0,16 s di ritardo (scarto mediano 1,1-1,7 m); con la palla oltre 6 m/s resta 1,4-1,7 m indietro; nessun anticipo | 1,4 m mediani; a palla veloce 0,9 m avanti (campione di 4 s) |
| In larghezza | mira = 0,76 volte la palla piu' 1,1 m verso la telecamera (v1 0,74, v2 0,78) | mira 1,5 m dalla palla verso il lato della telecamera e segue l'80% della palla; arretra di 1 m per metro solo quando la palla viene verso la telecamera |
| Calcio d'inizio | 24,6 m di altezza, 64 m dal centro, 22,7 gradi, campo visivo 24,2 verticali (50 orizzontali): inquadra 59,5 m | stessa telecamera di gioco |

v2 (altro stadio, 5,0 s, limite dell'area): 20,3 m, 53,8 m dall'asse, 22,7
gradi, campo visivo 21,5, 52,6 m dal punto inquadrato, 43,3 m di larghezza.
Le tracce di v2 danno lo stesso comportamento di v1.

In pratica il riferimento inquadra la stessa larghezza di campo da piu' in
alto e con un obiettivo un po' piu' lungo: la prospettiva si appiattisce, vedi
piu' profondita' e il bordo alto dello schermo arriva appena ai tabelloni
della tribuna lontana. Da noi, a 16 m, le tribune occupano il 15-20% alto
(vedi `a_confronto_centro.png`). Le due telecamere restano a 1,4-1,6 m dalla
palla; quella del riferimento la segue con 0,1 s di ritardo e senza
anticipo, la nostra la anticipa di circa 1 m. Vicino alle aree il
riferimento stringe dell'8-13% avvicinandosi e abbassandosi, con lo zoom
quasi fermo (il 16/10, dal video WhatsApp, sembrava il 4%).

### A2. Velocita' della palla

Riferimento dal radar a piena risoluzione (`flights_hi.py`): partenza = la
massima velocita' media su 0,2 s nei primi 0,35 s del volo.

| | Riferimento | KFM27 (partita IA, 109 palloni) |
|---|---|---|
| Passaggio rasoterra | partenza 16,4 m/s (29 passaggi col tasto, 13,5-21,7; 24 dell'IA: 16,4), cresce di 0,27 m/s per metro (v0 = 12,3 + 0,27 x distanza); media in volo 14,1; rallenta di 6,1 m/s² (72 voli, 4,2-7,7) e arriva a 10,9 | partenza 19,8 m/s (16,8-22,5), media in volo 18,8, arrivo 6,0 |
| Distanza tipica | 12,1 m in 1,0 s | 12,8 m, 0,68 s |
| Filtrante | partenza 15,1 m/s (27), 14,1 m in 1,4 s, arrivo 8,4 | partenza 21,7 m/s, media 18,3 |
| Tiro | partenza 27,8 m/s (6 tiri di v1, 23,4-28,3; 28,6 in v2), 17,8 m in 0,8 s; velocita' orizzontale | partenza 25,8 m/s (23-26,7) |
| Lancio | partenza 22,1 m/s (4 voli oltre 30 m), 33,6 m in 2,25 s | partenza 24,3 m/s, 40 m in 2,8 s, culmine 8,8 m |

I passaggi del riferimento partono il 17% piu' lenti dei nostri e rallentano
il doppio: arrivano al compagno a 11 m/s dopo circa 1 s. I tiri partono
l'8% piu' veloci.

### A3. Comandi e tempi

Uso dei tasti in v1 (164 s di attacco): 47 filtranti, 33 passaggi, 10-14
tiri, 60 pressioni di Scatto (molte tenute 1-4 s). Chi gioca usa il
filtrante piu' del passaggio: il comportamento del filtrante pesa molto.

| | Riferimento | KFM27 |
|---|---|---|
| Durata della pressione | passaggio 0,07 s (p90 0,19), filtrante 0,08, tiro 0,22 (tocchi); una barretta di potenza sopra il giocatore si riempie mentre il tasto e' premuto, a meta' dopo 0,17 s | si tiene premuto per la potenza: 1 s per la piena |
| Dal comando al contatto | dal tasto alla palla in movimento sul radar: passaggio 0,43 s (0,26-0,76), filtrante 0,35 (0,20-0,57), tiro 0,50 (0,32-0,53); il radar arriva 0,03-0,06 s dopo il contatto. Contatto visto nei fotogrammi: 0,39 s (passaggio a 64,5 s) e 0,41 s (tiro a 117,7 s) | dal rilascio: passaggio e filtrante 0,22 s, cross 0,27, tiro 0,25 piu' 0,15 a piena potenza |
| Comando prima di ricevere | in due casi visti la pressione arriva con la palla ancora in avvicinamento e il calcio parte al primo tocco (passaggio di prima) | |

Il riferimento mostra il caricamento del gesto (passo d'appoggio, gamba che
carica) e la palla parte 0,3-0,5 s dopo il tocco. Da noi la stessa attesa
la passi a tenere premuto, poi il calcio e' quasi immediato. Al tiro il
riferimento disegna una linea tratteggiata dal giocatore verso la porta.

Il radar a piena risoluzione si aggiorna ogni 0,033 s e arriva 0,03-0,06 s
dopo il contatto (passaggio di 64,9 s).

### A4. Squadre e IA

Dal radar pieno di v1 (1713 campioni a 5 Hz nei tratti con l'HUD di gioco,
portieri esclusi, `shape_hi.py`) e dalle posizioni esatte di una partita
KFM27 (969 campioni). Il radar pieno trova in mediana 8 giocatori per
squadra su 11: i segni sovrapposti si fondono.

| | Riferimento | KFM27 |
|---|---|---|
| Lunghezza del blocco | 33,3 m (21,7-71,0; il p90 risente dei portieri non riconosciuti) | 30,1 m (23,9-37,1) |
| Larghezza del blocco | 38,9 m (29,9-52,2) | 34,4 m (28,0-40,9) |
| Velocita' su finestre di 2 s | 3,2 m/s medi, 6,0 al 90%, 19% sopra 5 m/s | 2,6 m/s, 4,8, 8% |

Visto nei fotogrammi: un solo difensore va sul portatore, gli altri chiudono
le linee; l'IA alza la linea difensiva e lascia spazio dietro, e l'utente lo
sfrutta con i filtranti. Il numero di difensori vicino alla palla non si
legge dal radar: i punti dei giocatori finiscono sotto il quadrato della
palla e spariscono proprio dove servirebbero.

In KFM27 il giocatore piu' veloce arriva a 8,8 m/s (mediana dei massimi) e i
giocatori passano il 16% del tempo sopra 6,5 m/s.

### A5. Portiere

Nei replay del riferimento (per esempio 146-148 s) il portiere fa un tuffo a
tutto corpo, rallentato, con le mani che arrivano sulla linea della palla.
I gol visti arrivano su tiri angolati dal limite dell'area. A questa
risoluzione non riesco a misurare tempi di reazione o portata del tuffo.

### A6. Luce, colore, contrasto, ombre

Statistiche del 17/10 (`color_hi.py`, stesse definizioni del 16/10) sugli
stessi 29 fotogrammi di v1 e 14 di v2, presi dagli originali e ridotti a
1311 x 603; KFM27 su 13 fotogrammi ripetibili (`kfm_frame.mjs`, livello Alto,
874 x 402 CSS a 3x come l'iPhone del riferimento), HUD esclusa:

| | Riferimento | KFM27 |
|---|---|---|
| Colore medio dell'erba | #497838 (v1), #497837 (v2) | #687344 |
| Tinta | 104,3 gradi (v1), 103,7 (v2) | 74,8 gradi |
| Saturazione | 53,0% (v1), 53,2% (v2) | 41,0% |
| Luminosita' (L*) | 47,4 (v1), 45,7 (v2) | 46,8 |
| Strisce di taglio (L* 85-15 percentile) | 7,8; larghe 6,0 m con un bordo sulla linea di meta' campo (`stripes_hi.py` a 64,9 s: bordi a 0, 5,9, 11,8, 18,0, 23,9, 30,1, 36,0 m) | 8,6; larghe 5,25 m, bordi netti |
| Bianchi (L* al 99,7 percentile) | 92,5 (v1), 94,5 (v2); 87-91 sulla copia WhatsApp | 84,3 |
| Contrasto della scena (deviazione di L*) | 6,5 (v1), 9,6 (v2) | 5,8 senza tribune in quadro, 17 con |
| Ora | giorno, tetto aperto con cielo (v1), luce piena (v2) | notte, sfondo #0a111c, riflettori |
| Ombre | 0,7-1,05 m per un giocatore di 1,8 m (sole alto 60-70 gradi), morbide, piu' scure attorno ai piedi; cadono verso sinistra sullo schermo e un po' lontano dalla telecamera | ombra dinamica attorno alla palla (24 m), blob fuori; cadono verso destra |

La luminosita' delle strisce del riferimento scende con la distanza: 52 di
L* sulla striscia chiara vicina, 48 su quella lontana.

La luminosita' dell'erba e' la stessa; cambiano tinta e saturazione. La
causa sta nella texture: Grass003 ha l'albedo a 71 gradi (giallo-verde, 59%
di saturazione). Ho simulato il tone mapping ACES di three.js su quell'albedo:
sposta la tinta di 1-2 gradi, quindi non e' il tone mapping. Il riferimento ha
anche righe e maglie piu' brillanti.

### A7. HUD

Posizioni in percentuale dello schermo. Riferimento a 848 x 384 (telefono
orizzontale), KFM27 in un viewport da telefono 896 x 414 CSS.

| Elemento | Riferimento | KFM27 |
|---|---|---|
| Punteggio | in alto a sinistra, x 7-47%, alto 7%: stemma, nome, punteggio in riquadri lime, stemma centrale, nome, stemma, tempo in riquadro lime | in alto a sinistra, x 1-33%, alto 9,7%: pillola scura, nomi e punteggio in Anton, tempo e "1T" |
| Pausa/uscita | in alto a destra, 3% di lato | in alto a destra, 4,9% x 10,6% |
| Radar | in basso al centro, 12% x 19%, semitrasparente, punti per squadra, palla rossa, giocatore comandato blu, aggiornato a 12 Hz | assente |
| Levetta | anello con frecce, diametro 32% dell'altezza, pomello lime 14%; centro a (16%, 76%) | cerchio grigio, diametro 27%, pomello 12%; centro a (11%, 77%) |
| Tasti | 4 grandi (20% dell'altezza) a rombo fra x 73-97% e y 45-100%, piu' uno piccolo (12,5%); pittogrammi del gesto e scritta sotto; cambiano fra attacco (Passaggio, Passa filtrante, Tiro, Scatto, Chiamata corsa) e difesa (Pressing, Tackle, Cambia, Scatto); verde chiaro quando premuti | 6 tasti (15,5%) fra x 64-96%: Finta, Filtrante, Tiro, Cross, Scatto, Passaggio; glifi semplici; Finta finisce verso il centro dello schermo |
| Giocatore comandato | triangolo lime sopra la testa, nome, anello a terra; cerchio a terra sul compagno destinatario | anello a terra, cartellino "10 Prova A 10" sotto il punteggio |
| Nomi | sopra i giocatori vicini all'azione, testo bianco piccolo | assenti |
| Gol | scritta GOAL nella barra, carta del marcatore, punteggio grande al centro alla ripresa | banner "Gol" |
| Replay | solo il pulsante Salta in basso a destra, comandi nascosti | etichetta Replay e Salta; nella mia cattura i tasti touch restavano visibili (da verificare su telefono) |

### A8. Ritmo della partita e sequenze

- **Presentazione** (v1 6-53 s, saltabile con SALTA): sorvolo dello stadio
  e del tetto, nomi delle squadre in sovrimpressione, campo largo, primi
  piani nel tunnel, ingresso in campo, squadre schierate in linea, carrellata
  sui volti, rete e cielo con le formazioni, formazioni disegnate sul campo,
  primi piani di due stelle davanti ai LED, palla sul dischetto sotto la
  scarpa, inquadratura di gioco col punteggio in basso al centro.
- **Gol** (primo gol di v1): tiro a 117,9 s; la diretta continua 4 s con i
  comandi nascosti, la carta del marcatore a 120,5 s e GOAL nella barra a
  121 s; esultanza con telecamera ravvicinata 123-127 s; stacco col logo
  127-128,2 s; replay 128,5-148,5 s (alta larga, laterale bassa, laterale
  dall'altro lato, dietro la porta al rallentatore, con dissolvenze);
  stacco col logo 149-150,2 s; calcio d'inizio con il punteggio grande al
  centro. Circa 32 s, saltabili.
- **KFM27**: esultanza 3 s, replay di circa 9 s (laterale basso, poi dietro
  la porta al rallentatore 0,45x), dissolvenza 0,35 s, calcio d'inizio.
- **Intervallo**: schermata con punteggio, piano di partita, statistiche,
  highlights, impostazioni, continua.
- **Cronometro**: lettura sfocata, circa 11 minuti di gioco in 53 s, quindi
  90 minuti in 7 minuti reali circa. KFM27: 6 minuti.

### A9. Stadio e pubblico

Il riferimento ha due stadi diversi con identita' forte (viola con tetto
aperto; pista rossa con bandiere), pubblico fitto con colori misti,
tabelloni LED a striscia continua lungo tutto il campo, personale a bordo
campo e fotografi. Con la telecamera alta, in gioco la tribuna lontana
compare solo come striscia LED in cima allo schermo; il pubblico si vede nei
replay, nelle esultanze e nei calci piazzati.

### A10. Partita intera: eventi, ritmo, forma (blocco A, 17/10 sera)

`riferimento-1.mp4` e `riferimento-2.mp4` sono le copie a risoluzione piena
gia' usate (rinominate da `DBYN9587.MP4` e `UEJC3760.MP4`, stessa
dimensione al byte). Misure automatiche dal radar a 30 Hz e controllo a vista
dei momenti chiave; KFM27 dalle stesse misure in 4 partite IA contro IA
(ultimo commit, senza i 12 file del 04/10).

Strumenti (`debug/riferimenti/strumenti/`): `radar30.py` (palla, comandato e
segni delle due squadre a ogni aggiornamento del radar; colori di v1 e v2:
in v2 cerchi grigi, triangoli lime, comandato verde), `eventi.py` (voli
della palla, squadra di chi calcia e di chi riceve, riprese), `analisi_a.py`
(tiri, forma, ricezioni), `hook-eventi.js` (le stesse misure in KFM27 con
`tools/match3d/probe.mjs`). Dati in `debug/riferimenti/eventi/`.

Il segno di chi ha la palla e' sempre coperto dal quadrato rosso della palla:
la squadra di chi calcia e' quella col segno piu' vicino al punto di partenza
0,25 s dopo il calcio, quella di chi riceve col segno piu' vicino al punto
d'arrivo 0,25 s prima.

| | Riferimento (v1, 318 s di radar) | KFM27 (4 partite) |
|---|---|---|
| Calci al minuto | 12,7 (v2 11,2) | 30 |
| Tenuta palla dalla ricezione al calcio successivo | 2,1 s di mediana (0,6-3,4); utente 2,06, IA 2,3 | 0,5 s |
| Distanza dei passaggi | 13,3 m (11,2-19,5) | |
| Passaggi riusciti | 81% (35 su 43); i persi sono corti, 12,8 m di mediana | 60% |
| Cambi di possesso a terra | 11 in 318 s, 2,1 al minuto | 4,8 al minuto |
| Falli | nessuno in 7,6 minuti di gioco (v1 e v2) | 3,6-7,4 al minuto |
| Tiri | v1: 6 da 15-20 m, 21-28 m/s, verso il palo (z 2,8-4,4 m sulla linea), 5 gol e 1 parata; v2: 2 gol e 1 parata | 4-10 a partita da 17-22 m, 30-31 m/s; quasi tutti respinti dai difensori o persi |
| Ricezione: palla all'arrivo, 0,3 s e 0,8 s dopo il controllo | 11,5 / 3,4 / 5,1 m/s | 11,9 / 3,0 / 7,3 m/s |
| Chi attacca: lunghezza, larghezza | 36 x 38 m | 32 x 41 m |
| Chi attacca: ultimo uomo dietro la palla, quota davanti alla palla | 26 m, 22% | 27 m, 20% |
| Chi difende: lunghezza, larghezza | 24 x 29 m | 27 x 38,5 m |
| Chi difende: ultimo uomo dietro la palla, quota davanti alla palla | 22 m, 29% | 11 m, 40-50% |

Visti nei fotogrammi:

- **Soste**: quasi nessuna. In v1, fra un calcio d'inizio e il gol
  successivo il radar non si interrompe mai: niente rimesse, angoli, rinvi o
  falli in 372 s di gioco. Le uniche soste sono un fuorigioco a 316 s
  (replay col VAR e la linea del fuorigioco, due stacchi col logo, poi la
  punizione indiretta da ferma a 334,7 s) e l'intervallo (schermata del
  piano di partita a 352 s, calcio d'inizio del secondo tempo a 358,4 s).
  In v2 un angolo (dopo una parata, con un replay corto e la traiettoria
  tratteggiata sulla battuta) e una rimessa.
- **Contrasti**: il difensore si affianca al portatore e toglie la palla col
  piede, a volte di spalla, oppure la palla si stacca e la prende lui.
  Nessuna scivolata, nessuna caduta, nessun fischio.
- **Gol**: tiri piazzati dal limite dell'area verso il palo; il portiere si
  tuffa e non ci arriva. In v1 5 gol su 6 tiri: il riferimento lascia
  segnare chi tira bene da 15-20 m.
- **Replay**: dopo il gol, dopo una grande occasione (v2 56-68 s) e dopo il
  fuorigioco (VAR).
- **Lanci**: il radar non distingue un pallone alto da un rasoterra che
  rotola a lungo (i "lanci" da 25-50 m in 2-4 s sono quasi tutti filtranti a
  terra); a questa scala la palla in aria e' di pochi pixel. Quasi tutto il
  gioco del riferimento e' a terra.

Cosa ne segue per i blocchi B-D:

- **Ritmo** (blocco C): KFM27 calcia due volte e mezzo piu' spesso e tiene
  la palla un quarto del tempo. Il portatore deve condurre circa 2 s prima
  di passare, i passaggi devono riuscire 4 volte su 5.
- **Falli** (blocco C): quasi assenti. Gli obiettivi del test di durata
  (18-28 falli, 2-6 gialli, scivolate 4-10) vengono da PES, non dal
  riferimento.
- **Difesa** (blocco C): stretta (29 m) e bassa, con l'ultimo uomo 22 m
  dietro la palla; KFM27 difende larga e alta.
- **Portieri** (blocco C): sui tiri piazzati dal limite verso il palo il
  riferimento para circa 1 volta su 4.
- **Ricezione** (blocco B): le velocita' coincidono gia'; quello che non va
  e' l'aspetto del controllo, da guardare da vicino.

## B. Stadio (Soccer Stadium CF, 3ds Max)

Cartella `D:\Soccer_Stadium_\Soccer Stadium CF\`, 1,4 GB, 331 file. Non ho
spostato ne' modificato nulla: date e dimensioni di tutti i 331 file sono
identiche prima e dopo (controllato).

### Stato degli strumenti

**Aggiornamento del 17/10/2026**: dopo l'apertura manuale di 3ds Max,
`3dsmaxbatch.exe` parte. Uno script di prova (versione e renderer) esce con
codice 0 in 63 s, "Task Completed Successfully", versione 2027.2
(29.2.0.20588). Renderer disponibili: Scanline, ART, Arnold, Quicksilver;
V-Ray resta assente. Nessun file della cartella dello stadio aperto o
toccato. Situazione del 16/10:

- **3ds Max 2027** installato in `F:\3dsmax\3ds Max 2027\`. Il 16/10 non partiva:
  `3dsmaxbatch.exe` e anche `3dsmax.exe -silent` escono dopo 3 secondi con
  codice -12, e `Max.log` registra "ADP Failed to start" prima del controllo
  della licenza. Il 26/09 la stessa installazione partiva ("Authorize for
  license 3DSMAX2027 successful"). La licenza e' a utente (accesso con
  Autodesk Access): probabilmente l'accesso o la prova sono scaduti. Serve
  aprire 3ds Max una volta a mano e verificare l'accesso.
- **V-Ray non installato** (nessun plugin, nessuna cartella Chaos). Le scene
  sono state salvate con V-Ray Adv 2.10.01.
- **MultiScatter non installato**: le scene lo usano per distribuire
  seggiolini e pubblico ("MS Seats ...", "MS Fans ..."). Senza il plugin
  quella distribuzione non si ricostruisce; restano le spline di
  distribuzione.

### Inventario letto dai file (senza 3ds Max)

Ho letto le proprieta' che 3ds Max salva dentro ogni `.max` (flusso OLE, in
sola lettura): versione, totali, oggetti, materiali, plugin e file esterni.
Script e risultati: `debug/stadio/strumenti/`.

| File | Versione | Vertici | Facce | Note |
|---|---|---|---|---|
| Stadium_CF_Daylight.max (123 MB) | 3ds Max 2010 | 1.569.312 | 1.168.112 | 141 oggetti, 1 luce (VRaySun), cielo V-Ray, 1 telecamera |
| Stadium_CF_Evening.max (125 MB) | 3ds Max 2010 | 1.569.312 | 1.168.112 | stessa geometria; 770 luci (gruppi Main Lighting, Middle Tier Lights, Spot Lights, Under Roof Omni), VRayLightMtl |
| Light_Effects.max (25 MB) | 3ds Max 2010 | 415.590 | 409.726 | 512 luci, proxy e MultiScatter: effetti luce |
| Fans_BIPED: 45 tifosi (15 F, 30 M; bandiere, sciarpe) | 2010 | 4.000-7.000 | 5.778-8.046 | Biped + Skin, VRayMtl |
| Players_Refs_BIPED: 22 giocatori, 3 arbitri | 2010 | 4.283-4.772 | 5.952-6.379 | Biped + Skin, VRayMtl |
| Seat_01a, Seat_01b, Coach_Area_Seat | 2010 | 1.173-3.294 | 1.211-3.298 | seggiolini e panchina |
| Camera_Flash.max | 2010 | 4 | 2 | flash dei fotografi |

Le facce delle scene principali escludono i proxy: seggiolini, pubblico e
giocatori in campo sono proxy V-Ray (75 `.vrmesh`, fra cui 45 tifosi
animati) generati a render time.

**Gruppi della scena (giorno e sera)**: anelli Bottom, Middle, Top e VIP
Tier con scale e barriere; Pillars; Stadium to Field Steps; Gates e Back
Fence; Window Blinds; Ground e Field Lines; Corner Flag 1-4; Goal 1 e 2
(pali, rete, contorno rete, tiranti); Coach Area e relativi sedili; Stadium
Banners e Ground Banners; Roof Top, Roof Glass Plates, Roof Rigging, Roof
Scaffolding; Outside Glass e Outside Metal Plates; Tv Bim 1 e 2 (maxischermi);
Spot Lights e Under Roof Lighting; 22 giocatori, 3 arbitri e il pallone come
proxy; tre distribuzioni MultiScatter di tifosi e cinque per tipo di
seggiolino (aperto e chiuso).

**Materiali**: VRayMtl, VRay2SidedMtl, VRayNormalMap, Multi/Sub-Object, piu'
VRayLightMtl la sera. **Texture**: 130 file. Erba 6706 x 3353, cielo 4096 x
1060, quasi tutto il resto 640-1200 px (tifosi e giocatori 800 x 800).
I percorsi salvati puntano a `E:\PROJEKTY MAX\Castelao\...`: serve una
rimappatura delle cartelle all'apertura.

**Animazioni**: 21 file `.bip` (tifosi: applauso, bandiere, sciarpe), 27
pose `.fig`. La durata delle clip si legge solo con 3ds Max.

**Contenuti da sostituire prima di usare lo stadio nel gioco**: i banner
riportano i loghi TurboSquid e DTP.3D; `bim_screen.jpg` e' la foto di una
partita vera; le maglie dei giocatori di riferimento hanno marchi
riconoscibili (baffo sulle maglie, tre strisce sugli scarpini).

### Anteprime

Senza 3ds Max non posso renderizzare le 4-6 anteprime. Per ora:

- `D:\...\Preview.jpg` (del venditore): interno di sera, esterno di giorno;
- `debug/stadio/miniature_scene.png`: le miniature che 3ds Max salva nei
  file (giorno, sera, effetti luce, un tifoso, un giocatore, un seggiolino),
  128 x 71 ingrandite;
- `debug/stadio/texture_campione.jpg`: 16 texture del progetto.

Lo script d'inventario completo (`debug/stadio/strumenti/inventory.ms`:
oggetti con triangoli, layer, istanze, materiali, mappe, luci, telecamere,
Biped con chiavi) e' pronto: parte appena 3ds Max si apre.

## C. Meshy

### Verifica della chiave

**Aggiornamento del 17/10/2026**: la chiave c'e' (variabile dell'utente,
40 caratteri) e funziona. `GET /openapi/v1/balance` risponde HTTP 200:
saldo 2.992 crediti (2.972 mensili, 20 permanenti), rinnovo mensile il
28/10/2026. La lettura del saldo non spende crediti; nessuna generazione
avviata. Situazione del 16/10:

`MESHY_API_KEY` non c'era in quella sessione: mancava nelle variabili del
processo, dell'utente e del sistema. L'endpoint gratuito risponde
(`GET https://api.meshy.ai/openapi/v1/balance` senza chiave: HTTP 401
"Missing API key"), quindi il controllo e' pronto. Per farlo:

1. in un terminale: `setx MESHY_API_KEY "la-tua-chiave"`;
2. riavvia Claude Code (le variabili arrivano solo ai processi nuovi);
3. il controllo legge il saldo e non spende crediti:
   `curl -s -H "Authorization: Bearer $MESHY_API_KEY" https://api.meshy.ai/openapi/v1/balance`.

### Prova pilota proposta (non generata)

Listino API di oggi (docs.meshy.ai): Text to 3D preview 20 crediti
(meshy-7.1 e meshy-6), refine 10 crediti a 2K o 4K, 15 a 8K.

Ogni pezzo: preview con `ai_model: "meshy-7.1"`, `should_remesh: true`,
`topology: "quad"`, `target_polycount: 30000` (master, poi ridotto in
Blender a 2-3 mila triangoli per la testa e 1-2 mila per i capelli), poi
refine con `enable_pbr: true`, `texture_resolution: "4k"`,
`remove_lighting: true`. Master in `src/assets/match3d/source/meshy/`.

| Pezzo | Prompt della preview | Prompt della texture |
|---|---|---|
| Testa A | Game asset: realistic head and neck of a generic adult male athlete, around 25 years old, oval face, straight nose, neutral relaxed expression, mouth closed, eyes open looking straight ahead, completely bald smooth scalp, no hair, no beard, no accessories, symmetrical face, natural proportions, short neck ending in a clean flat horizontal cut at the base of the neck, front facing | light olive skin with subtle pores, even matte skin, natural dark eyebrows, no stubble, no makeup, flat even lighting without shadows |
| Testa B | Game asset: realistic head and neck of a generic adult male athlete, around 30 years old, broad square jaw, wide nose, full lips, neutral relaxed expression, mouth closed, eyes open looking straight ahead, completely bald smooth scalp, no hair, no beard, no accessories, symmetrical face, short neck ending in a clean flat horizontal cut at the base of the neck, front facing | deep brown skin with subtle pores, even matte skin, natural black eyebrows, no stubble, flat even lighting without shadows |
| Capelli 1 | Game asset: short crew cut hairstyle as a separate hair cap mesh sized for an average adult male head, hollow inside, no head, no face, no scalp skin, 2 cm on the sides and 4 cm on top, clean hairline on the forehead and around the ears, symmetrical | uniform neutral light grey hair with fine strand detail, no color variation, no shadows |
| Capelli 2 | Game asset: medium length wavy hair swept back as a separate hair cap mesh sized for an average adult male head, hollow inside, no head, no face, hair reaching the nape, ears half covered, natural volume, symmetrical | uniform neutral light grey hair with wavy strand detail, no color variation, no shadows |
| Capelli 3 | Game asset: short tight afro hairstyle as a separate hair cap mesh sized for an average adult male head, hollow inside, no head, no face, rounded volume about 4 cm thick, short faded sides, clean hairline, symmetrical | uniform neutral light grey hair with tight coil texture, no color variation, no shadows |

Capelli in grigio neutro: il colore lo da' il gioco moltiplicando
l'albedo, cosi' una mesh vale per tutte le tinte. Le due teste coprono due
toni di pelle; gli altri toni vengono dalla palette del gioco.

Crediti: 5 pezzi x (20 + 10) = **150 crediti**. Con un secondo tentativo
per ogni pezzo il tetto e' **300**. Il texture a 8K costerebbe 5 crediti in
piu' a pezzo; per i master basta il 4K (regola della skill).

Cosa deve dimostrare la prova: giunzione del collo identica a quella del
Calciatore (taglio piano, stesso anello di vertici dopo il ritocco in
Blender), capelli che stanno sulla testa senza attraversarla, peso dopo la
riduzione, aspetto a 30 pixel e in primo piano.

### Varianti di corporatura sul Calciatore

`player.glb` oggi: 6 mesh (pelle, capelli, maglia, scarpini, pantaloncini,
calzettoni), 9.848 triangoli, 65 ossa `mixamorig5`, una texture 1024, nessun
morph target.

Proposta:

1. **Morph target per la corporatura** (shape key in Blender, esportati nel
   GLB): tre forme, magro, robusto e muscoloso, combinabili con pesi 0-1
   calcolati da peso e altezza del database. Il morph sposta i vertici nella
   posa di riposo, prima dello skinning: ossa, clip, Ball_Bone, IK e
   FootLock restano validi. Le stesse forme vanno su maglia, pantaloncini e
   calzettoni (Surface Deform in Blender), con i pesi delle ossa che
   `player_mesh.py` gia' limita ai soli bacino, schiena e braccia per la
   maglia.
2. **Altezza con una scala uniforme** dell'avatar, da 0,95 a 1,05 (1,71-1,89
   m). La scala uniforme non deforma le articolazioni; il codice deve
   correggere la velocita' di riproduzione della corsa (passo piu' lungo del
   5%: corsa piu' lenta del 5% alla stessa velocita') e le soglie in metri di
   FootLock, contatto palla e ricezione. Le misure dei calci (Ball_Bone)
   scalano da sole con l'avatar.
3. **Niente scala diversa per osso**: in three.js la scala di un osso passa
   ai figli e con le rotazioni crea taglio (shear); IK e FootLock
   leggerebbero lunghezze sbagliate.

Controlli: il test di durata con i due invarianti del corpo (bacino sul
punto di gioco, piedi a terra) per ogni corporatura e per le altezze
estreme, piu' le pose chiave di `pose-shots.mjs`.

## Piano

Una tappa per sessione, ognuna con il proprio commit dopo `node --check` sui
file toccati, il test di durata (10 partite, circa 12 minuti con 4 in
parallelo) e la stessa misura di questo documento ripetuta sul gioco.

Ordine approvato dall'utente il 17/10/2026. Valori aggiornati con le misure
a risoluzione piena (sezione 0).

| # | Tappa | Cosa cambia | Rischi | Tempo |
|---|---|---|---|---|
| 1 | Prato e luce | albedo dell'erba portato a tinta 104 gradi, saturazione 53%, L* 47; strisce di 6 m con un bordo sulla linea di meta' campo, 7,5 punti di L*, bordi morbidi; righe a L* 92-95; preset diurno: sole alto 60-70 gradi da destra (ombre di 0,7-1 m verso sinistra), emisferica, cielo, esposizione; la notte resta come seconda versione | nessuno sul gioco; i colori di maglie e kit vanno ricontrollati | mezza giornata |
| 2 | Telecamera | a centrocampo 24,8 m di altezza, 25,7 gradi, 57 m dal punto inquadrato, 44,7 gradi orizzontali (46,9 m di larghezza); vicino alle aree piu' vicina e bassa (22 m, 23 gradi, 42 m di larghezza); in larghezza la telecamera segue il 40% della palla e scende verso il proprio lato; inseguimento con 0,1 s di ritardo e senza anticipo; calcio d'inizio largo (24,6 m, 64 m, 22,7 gradi, 59,5 m di larghezza) | i tasti touch coprono piu' campo in basso a destra; telefono in verticale; calci piazzati da ricontrollare | mezza giornata |
| 3 | Ritmo e IA (prova A/B) | passaggio a 16,4 m/s con 0,27 m/s per metro e rallentamento di 6 m/s² (arrivo a 11 m/s), filtrante a 15 m/s, tiro a 28 m/s, gesto del calcio al tocco successivo (0,35-0,4 s dal tasto) con la potenza a tocco e la barretta sopra il giocatore, blocco difensivo largo 39 m, tasto Chiamata corsa | il gioco puo' sembrare meno reattivo; statistiche del test di durata da riequilibrare | un giorno |
| 4 | HUD (prima il bozzetto da approvare) | barra del punteggio con stemmi e colori dei club, radar in basso al centro, nomi sopra i giocatori vicini, triangolo sul comandato, anello con l'arco della direzione, barretta di potenza sopra il giocatore, cerchio sul destinatario, linea tratteggiata del tiro, set di tasti per attacco e difesa con pittogrammi SVG, levetta piu' grande, comandi nascosti nei replay | cambia struttura e posizione degli elementi: prima un bozzetto da approvare (regola di CLAUDE.md); schermi piccoli e safe area | un giorno |
| 5 | Dopo il gol | diretta 3-4 s con GOAL e carta del marcatore, esultanza ravvicinata, stacco col logo KFM27, replay di 12-20 s da 3-4 inquadrature con rallentatore, stacco, punteggio grande al calcio d'inizio; tutto saltabile | buffer del replay da allungare (oggi 10 s); memoria su telefono | un giorno |
| 6 | Stadio dal progetto 3ds Max | inventario con `inventory.ms` (3ds Max ora parte), esportazione FBX per gruppi, proxy sostituiti dai `.max` sorgente di seggiolini e tifosi, materiali V-Ray rifatti in PBR, LOD e fusione per materiale, texture fino a 2048, lightmap con Cycles per giorno e sera, banner e maxischermi sostituiti, pubblico instanziato dai 45 tifosi | senza V-Ray i proxy non si convertono; senza MultiScatter seggiolini e pubblico vanno ridistribuiti in Blender lungo le spline; 1,17 milioni di facce da ridurre sotto 200 draw call. Licenza confermata dall'utente il 17/10 | 3-5 giorni |
| 7 | Aspetto dei giocatori (Meshy) | prova pilota Meshy (150-300 crediti su 2.992, dopo il tuo via), poi teste e capelli intercambiabili sull'osso della testa, morph di corporatura, altezza in scala | collo e spalle in movimento; memoria con 22 giocatori; la prova puo' bocciare i capelli di Meshy | pilota mezza giornata, integrazione 2-3 giorni |
| 8 | Presentazione prepartita | sequenza di 30-45 s nello stadio nuovo: sorvolo, tunnel, schieramento, formazioni, primi piani, palla sul dischetto; saltabile | dipende dalla tappa 6; caricamento e memoria | 2-3 giorni |

## D. Tappe eseguite

Misure di KFM27 con `kfm_frame.mjs`: stesso seme, stesso passo di 1/60 s e
stessa lista di istanti prima e dopo (4, 7, 13, 16, 19, 25, 28, 31, 34, 40 s
di gioco), viewport 874 x 402 a 3x come l'iPhone del riferimento, livello
Alto. Con la stessa lista prima e dopo la partita passa per gli stessi
istanti; con liste diverse diverge (una cattura in piu' cambia la partita
anche se il gioco vero non cambia). Il 17/10 ho tolto da `game_shots.mjs` e
`kfm_frame.mjs` un secondo aggiornamento della telecamera per passo:
`advance()` la muove gia', e la doppia chiamata la faceva inseguire al doppio
della velocita' (le cifre KFM27 di "punto inquadrato rispetto alla palla" del
16/10 ne risentono).

### Tappa 1: prato e luce

Cosa cambia (`config.js` PITCH e LIGHT, `pitch.js`, `main.js`, `render.js`,
`stadium.js`):

- **Erba**: l'albedo di Grass003 moltiplicato per `PITCH.grassColor`
  (0,37, 1, 0,75) porta la tinta da 75 a 104 gradi.
- **Strisce**: calcolate nello shader dell'erba invece del velo bianco sul
  canvas delle righe. Bande di 6 m con un bordo sulla linea di meta' campo,
  la scura a 0,78 della chiara (stessa tinta, meno luce), bordo sfumato su
  1 m. Prima: 20 bande da 5,25 m, la chiara sbiadita (saturazione 32%).
- **Luce**: `LIGHT.preset` sceglie `day` o `night`. Giorno: sole alto 65
  gradi dalla destra dello schermo e un po' dal lato della telecamera (ombre
  di 0,84 m verso sinistra), emisferica 1,0, sole 2,4, esposizione 1,32,
  cielo azzurro, fari quasi spenti, pubblico piu' chiaro. Sera: i valori di
  prima (luci, esposizione 1,05, cielo notturno, fari a 4).
- **Righe**: un po' di luce propria (`PITCH.lineGlow` 0,3) per arrivare al
  bianco del riferimento.

Misure (10 fotogrammi senza HUD, `color_hi.py`; ombre con `kfm_shadow.py`
sui giocatori entro 20 m dalla palla):

| | Prima | Dopo | Riferimento |
|---|---|---|---|
| Colore medio dell'erba | #687345 | #4c7c3b | #497838 |
| Tinta | 74,8 | 104,4 | 104,3 (v1), 103,7 (v2) |
| Saturazione | 41,0% | 53,1% | 53,0%, 53,2% |
| L* dell'erba | 46,9 | 47,2 | 47,4, 45,7 |
| Strisce (L* 85-15 percentile) | 8,6 | 7,5 | 7,8 |
| Bianchi (L* 99,7 percentile) | 83,7 | 91,8 | 92,5, 94,5 |
| Contrasto della scena | 5,8 | 6,1 | 6,5, 9,6 |
| Ombra / erba (L*) | 0,74-0,76, verso destra | 0,72-0,73, verso sinistra | 0,67-0,71, verso sinistra |

Confronti: `debug/riferimenti/confronto/tappe/tappa1_centro.png` (prima,
dopo, riferimento a 64,9 s), `tappa1_area.png`, `tappa1_replay.png`.

### Tappa 2: telecamera

Cosa cambia (`config.js` CAMERA, `camera.js`, una riga in `main.js`):

- **Geometria**: la telecamera guarda il punto inquadrato da 55,6 m con 25,7
  gradi di inclinazione (24,1 m di altezza con la palla al centro in
  larghezza) e tiene fisso il campo visivo orizzontale, 44,7 gradi: su ogni
  schermo orizzontale vedi la stessa larghezza di campo. Prima: altezza 16
  m, 42 m dall'asse, 26 gradi verticali (53 orizzontali sul telefono).
- **In larghezza**: la mira sta a 0,76 volte la palla piu' 1,1 m verso la
  telecamera; la telecamera si avvicina di 0,4 m per metro di palla verso di
  lei, quindi si sposta del 40% della palla e si abbassa (21 m con la palla
  a 19 m verso la telecamera). Prima arretrava solo quando la palla veniva
  verso la tribuna.
- **Aree**: con la mira oltre 22 m dal centro la telecamera scende di 3
  gradi e si avvicina di 1,5 m (completo a 34 m), zoom fermo: 41-44 m di
  campo in larghezza, come nei calcoli esatti del riferimento vicino alle
  aree (40,7-43,3 m, 21,8-23,7 gradi). Una prima prova con 5 m e 2,5 gradi
  stringeva a 39-41 m. Prima della tappa stringeva lo zoom da 26 a 23 gradi.
- **Inseguimento**: smorzamento 7/s (0,14 s di ritardo), nessun anticipo.
  Prima: 2,6/s piu' 0,35 s di anticipo filtrato.
- **Calcio d'inizio**: finche' si aspetta il calcio, visuale larga sul
  cerchio (64 m, 22,7 gradi, 50 gradi orizzontali, 60 m di campo); dopo il
  tocco torna alla visuale di gioco in 1,2 s, come nel riferimento.
- **Calci piazzati e schermi stretti**: le pose dietro al tiratore
  (setpieces.js) non cambiano; in verticale il campo visivo arriva al
  massimo di 75 gradi come prima.

Misure dal registro di `kfm_frame.mjs` (`kfm_cam.py`), stessi istanti prima
e dopo:

| | Prima | Dopo | Riferimento |
|---|---|---|---|
| Altezza a centrocampo | 16,0 m | 24,2-24,5 m | 24,8 m |
| Inclinazione | 21,4 gradi | 25,6-25,7 | 25,7 |
| Campo visivo (schermo 2,17:1) | 26,0 verticali, 53,3 orizzontali | 21,4 e 44,7 | 21,4 e 44,7 |
| Distanza dal punto inquadrato | 43,8 m | 55,7-56,7 m | 57,2 m |
| Larghezza inquadrata al centro | 44,0 m | 45,8-46,8 m | 46,9 m |
| Palla a 19 m verso la telecamera | 16 m, 56,9 m dall'asse, 43,8 m di larghezza | 21,1 m, 58,3 m dall'asse, 39,9 m | 18-19 m, 59-60 m dall'asse, 41-48 m |
| Palla a 13 m verso la telecamera (03:39) | 16 m, 52,2 m dall'asse, 43,8 m di larghezza | 21,8 m, 56,6 m dall'asse, 41,3 m | tracce: 19,5-20,4 m e 54-55 m dall'asse; corrette per il -7% delle tracce, 21-22 m e 58 m |
| Limite dell'area (palla a 34-48 m dal centro, 01:32-01:49) | 16 m, 21,5 gradi, 40,6-43,8 m di larghezza (zoom) | 19,4-20,5 m, 22,7-22,8 gradi, 41,2-43,8 m | 18,1-22,0 m, 21,8-23,7 gradi, 40,7-43,3 m |
| Calcio d'inizio | uguale al gioco | 24,7 m, 22,7 gradi, 24,2 verticali, 64 m, 59,7 m di campo | 24,6 m, 22,7, 24,2, 63,8 m, 59,5 m |

Confronti: `debug/riferimenti/confronto/tappe/tappa2_centro.png` (prima,
dopo, riferimento a 64,9 s), `tappa2_calcio_inizio.png` (con il
riferimento a 56,0 s), `tappa2_area.png` (con il riferimento v2 a 5,0 s),
`tappa2_verso_tribuna.png` (con il riferimento a 255,0 s). Il caso
dell'area viene da una lista d'istanti diversa (4, 7, 8,5, 9,2, 9,6 s), la
stessa prima e dopo.

Con la telecamera piu' alta le tribune lontane escono dall'inquadratura di
gioco: in cima allo schermo restano i cartelloni, come nel riferimento. Con
la palla verso la telecamera la linea laterale vicina resta appena fuori
dal bordo basso, come nel riferimento a 255 s; i tasti touch in basso a
destra coprono la stessa parte di campo di prima.

### Tappa 3: ritmo e IA

Applicata direttamente (non in prova A/B), su richiesta del 17/10.

Cosa cambia (`config.js` BALL, KICK, POWER, PASS, THROUGH, SHOT, ATTR,
RECEIVE, SHAPE, ANIM, FOUL; `main.js`; `player.js`; `team-ai.js`):

- **Palla a terra**: rallenta di circa 6 m/s² (attrito 4,6 m/s² piu' 0,1
  per la velocita'). Prima 2,5.
- **Passaggio**: 11,2 m/s piu' 0,27 per metro piu' 1,5 con la potenza (piu'
  0,5 sotto pressione), fra 12 e 24 m/s. **Filtrante** fra 10 e 15,5 m/s: il
  punto nello spazio va piu' avanti, il compagno lo prende in corsa.
- **Tiro**: da 21 m/s a potenza zero all'attributo (30-35) a potenza piena.
- **Dal comando al contatto**: il calcio parte dopo `KICK.setup` 0,25 s di
  corsa o conduzione (per l'utente dal tasto, per l'IA dalla scelta), e il
  gesto della clip mostra solo gli ultimi 0,12-0,13 s (passaggio, filtrante,
  tiro; 0,15 cross e pallonetto). La barra si riempie in 0,35 s. Il
  passaggio d'urgenza sotto contrasto e quello di prima restano immediati.
- **Ricevente**: con il punto d'intercetto entro 6 m aspetta la palla di
  fronte, frena a 24 m/s² e gira il busto fino a 14 rad/s (8 a 5 m/s).
- **Squadre**: mezza larghezza 32 m in attacco e 28,5 in difesa (prima 30 e
  22).
- **Rossi**: soglia 1,45 (prima 1,35) per restare nell'obiettivo.
- **Spinta a due mani da fermo**: chi la fa non viene piu' spostato dal
  portatore che gli corre addosso (la posa sul posto traslava a 5 m/s).

Misure (`hook-ritmo.js` con `probe.mjs`, 4 partite IA contro IA dopo la
taratura; prima: 2 partite):

| | Prima | Dopo | Riferimento |
|---|---|---|---|
| Passaggio: partenza | 19,6 m/s | 16,3 m/s | 16,4 m/s |
| Passaggio: arrivo | 18,0 m/s | 10,9 m/s | 11 m/s |
| Rallentamento a terra | 2,5 m/s² | 6,0 m/s² | 6,1 m/s² |
| Filtrante: partenza | 22,1 m/s | 15,4 m/s | 15,1 m/s |
| Tiro: partenza | 24,3 m/s | 27,8 m/s | 27,8 m/s |
| Dal comando al contatto | passaggio 0,22 s, tiro 0,33 | 0,38 s, 0,42 | 0,35-0,42 s |
| Ricevente girato verso la palla (oltre 1 rad al passaggio) | 0,48 s | 0,23 s | circa 0,3 s |
| Larghezza del blocco | 34,4 m | 39,6 m | 38,9 m |

Ricontrollo del riferimento con le fasi di gioco (`fase_tasti.py`: il tasto
in basso a sinistra e' "Passa" in attacco e "Cambia" in difesa): dei 29
"passaggi col tasto" della sezione 0, 15 sono in attacco; per loro il tasto
precede la palla in movimento di 0,42 s (0,27-0,50) con pressioni di 0,13
s. Gli altri erano passaggi dell'IA avversaria mentre l'utente premeva
Cambia. Le conclusioni non cambiano.

**Animazioni**: non le ho estratte dal video ne' fatte a mano (regola della
skill: niente animazioni dell'altro gioco, niente movimenti a tutto corpo
scritti a mano; da giocatori di 85 pixel una posa 3D ricostruita sarebbe
inservibile). Restano le clip Studio33, scelte per corrispondenza e portate
ai tempi misurati. Video affiancati, riferimento sopra e KFM27 sotto, stessa
durata, prima a velocita' vera e poi a 0,4x:
`debug/riferimenti/gesti/video/` 1_passaggio, 2_ricezione, 3_tiro,
4_conduzione, 5_pressing, 6_contrasto, 7_parata (con un'immagine
`_foto.png` di inizio, meta' e fine). I gesti di KFM27 vengono da una
partita IA contro IA ripetibile (`hook-gesti.js` trova gli istanti); il
riferimento segue il giocatore comandato (triangolo) o, per il portiere, un
percorso preso a mano.

Test di durata (10 partite): prima prova 4 violazioni (portiere 2, posa
ferma che trasla 2: una era la spinta da fermo, corretta); dopo la
correzione 3 (piedi 2, portiere 1), rossi 0,2 a partita. Lo stato di
partenza ne faceva 7.

### Tappa 4 (parziale): indicatori sopra i giocatori

Bozzetto: `debug/riferimenti/bozzetto/bozzetto_indicatori.png` (fotogramma
vero di KFM27 a 874 x 402 con gli indicatori disegnati sopra; sorgente
`indicatori.html`). Applicato com'era (`hud.js`, `match3d.css`, `config.js`
MARKS, `main.js` syncMarkers):

- **Triangolo** bianco come l'anello a terra, 12 x 9 px, 12 px sopra la testa
  (1,95 m proiettati con la telecamera di gioco), solo sul comandato. Il
  riferimento lo fa lime: qui resta bianco perche' il lime non e' nella
  palette e l'anello a terra e' gia' bianco.
- **Barretta di potenza** 36 x 5 px fra triangolo e testa: compare quando
  carichi passaggio, filtrante, cross o tiro, diventa rossa oltre la soglia
  del tiro alto e resta 0,45 s dopo il calcio. In campo aperto prende il
  posto della barra in basso; nei calci piazzati resta quella in basso.
- **Nome** (Inter 13 px, bianco con alone scuro) per 1,6 s sopra chi prende
  palla, di tutte e due le squadre, poi sfuma in 0,3 s. Oltre 14 caratteri
  diventa iniziale e cognome.
- Nel replay i tre indicatori spariscono.

Verifica: sequenza in modalita' utente `debug/riferimenti/bozzetto/seq_tile.jpg`.
Test di durata (10 partite): 6 violazioni (portiere 2, piedi 2, osso 1,
posa ferma che trasla 1: una partenza in conduzione subito dopo un contrasto
vinto, 510_Run_Tackles_01 poi 195_Dribble_Start; la tappa non tocca il
gioco), rossi 0,2 a partita.

### Tappa 5: gol e calcio d'inizio

Misure sui 4 gol di v1 (stacchi col logo trovati con `stacchi.py`, cambi di
inquadratura con `tagli.py`, calcio d'inizio dal radar; secondi dal gol, cioe'
dall'istante in cui spariscono i comandi):

| | Gol 1 | Gol 2 | Gol 3 | Gol 4 | KFM27 |
|---|---|---|---|---|---|
| Gol | 118,6 s | 272,6 | 385,7 | 451,5 | |
| Diretta, comandi nascosti | 4,35 s | 4,15 | 4,2 | 4,2 | 4,2 s |
| Primo piano dell'esultanza | 4,3 s | 5,05 | 5,1 | 8,1 | 5 s |
| Stacco col logo | 1,05 s | 1,05 | 1,0 | 1,0 | 1,05 s |
| Replay | 20,9 s | 20,7 | 21,2 | 20,8 | 21 s |
| Stacco col logo | 1,0 s | 1,05 | 1,0 | 1,0 | 1,05 s |
| Dalla fine dello stacco al calcio | 2,7 s | 2,7 | 2,7 | 2,7 | 2,75 s |

- **Replay** (gol 1, a 2 fotogrammi al secondo): alta e larga dalla tribuna
  che segue l'azione dal centrocampo all'area (8,6 s), laterale bassa sugli
  ultimi 3-4 s fino alla palla in rete (3,8 s), alta dall'altro lato verso la
  porta sugli stessi secondi (3,8 s, stacco netto), dietro la porta al
  rallentatore (4,75 s). Fra la prima e la seconda e fra la terza e la quarta
  una dissolvenza. KFM27 (`REPLAY.shots`): alta da 11,9 a 3,3 s prima del gol,
  laterale bassa e dall'altro lato da 3,3 s prima a 0,5 dopo, dietro la porta
  da 1,9 prima a 0,25 dopo a 0,45x. Un'inquadratura con meno di 1,5 s
  registrati si salta (gol subito dopo un calcio d'inizio). Il registratore
  tiene 13 s e smette 0,6 s dopo il gol.
- **Esultanze del riferimento**: corsa, salto con mezzo giro e atterraggio a
  braccia larghe; ruota acrobatica, poi pugni al cielo; capriola all'indietro,
  poi braccia alzate; piegato con le mani sulle ginocchia, poi mano alla
  testa. Primo piano con la telecamera bassa davanti al giocatore e i
  cartelloni dietro.
- **Calcio d'inizio** (radar, uguale nei 4): al centro solo chi batte, che
  passa all'indietro di circa 11,5 m al centrocampista (palla a 15 m/s,
  ricevuta a 11 m dopo 1 s). Chi batte: 4 sulla linea a 2,9 m dalla meta'
  campo (z -24,5, -10,2, 12,2, 26,2), 3 a 11,7 m (z -15,9, 0,8, 18), 2 a 17,6
  m (z -2,9, 5). Chi difende: 2 appena fuori dal cerchio, 4 fra 6 e 12 m, 4
  fra 14,7 e 17,5 m. Le z non si specchiano fra i tempi: lo schieramento e'
  fisso rispetto allo schermo.
- **Inquadratura del calcio d'inizio dopo il gol**: e' quella di gioco, non
  quella larga dell'inizio dei tempi (tappa 2). Dal cerchio di centrocampo
  (`ko_cam.py`, 4 parametri risolti, errore sotto il pixel): inclinazione
  25,7 gradi e, col campo di gioco di 44,7 gradi, 56,3 m (gioco: 55,6 m,
  25,7). Il campo visivo e la distanza non si separano: con 50 gradi viene
  49,6 m, stesso risultato a schermo. I 4 calci d'inizio hanno il cerchio
  negli stessi pixel.

Cosa cambia (`config.js` REPLAY, RULES.celebration, RULES.kickoff,
SHAPE.kickoff; `main.js` goalShow, startSting, cheer, placeKickoff;
`replay.js` Replay, CloseCam; `rules.js` goal, celebrate; `hud.js` e
`match3d.css` stacco e dissolvenza; `tools/match3d/studio33_select.py`):

- **Regia**: diretta 4,2 s con la telecamera di gioco su chi esulta, senza
  comandi, anelli, triangolo e nomi; poi stacco netto sul primo piano
  (`CloseCam`): telecamera a 1,4 m di altezza e 5 m davanti al bacino, che
  gira attorno al giocatore al massimo a 1,2 rad/s e sceglie fra 10
  direzioni quella senza corpi in mezzo o accanto all'obiettivo. Dopo 5 s
  lo stacco col logo (`src/img/logo.png` sul fondo dei pannelli, entra da
  destra ed esce a sinistra in 0,3 s; senza animazioni in dissolvenza),
  sotto il quale parte il replay. Alla fine del replay, o con Salta, un
  altro stacco; sotto, le squadre gia' schierate.
- **Dissolvenze del replay**: subito dopo il disegno dell'ultimo fotogramma
  di un'inquadratura, `hud.dissolve` lo copia a meta' risoluzione su una tela
  sopra il 3D, che sfuma in 0,4 s sulla nuova. Sostituisce la dissolvenza al
  nero.
- **Esultanza**: le 26 clip Studio33 (le 20 scartate sono tornate nel
  pacchetto extra: regola in `studio33_select.py`, pacchetto da 0,5 a 2,7 MB)
  in un mazzo mischiato a ogni partita, intere e con la loro corsa. Se la
  clip finisce prima dello stacco segue 059_Ceremony. Fino a 4 compagni entro
  40 m raggiungono chi esulta dopo 0,8 s, gli si fermano attorno a 2,4 m
  (piu' 0,3 a testa) ed esultano con 052, 033, 059, 034. Su un autogol esulta
  il giocatore della squadra che segna piu' vicino alla palla. Al livello
  basso, senza pacchetto extra, resta la clip Mixamo.
- **Calcio d'inizio**: ognuno al punto dello schieramento del riferimento
  piu' vicino al suo posto nel modulo (assegnazione con scambi), al centro
  solo l'attaccante piu' avanzato; il passaggio va al giocatore del punto a
  11,7 m (clip 445_KickOff_180) e arriva a 10 m/s. L'IA tocca la palla 2,75 s
  dopo che lo stacco e' uscito. Dopo un gol la telecamera resta quella di
  gioco; la visuale larga della tappa 2 resta all'inizio dei tempi.
- **Test di durata**: la sequenza dopo il gol puo' durare fino a 40 s (prima
  20) e al calcio d'inizio al centro deve esserci solo chi batte (prima "due
  giocatori al centro", la regola della skill).
- **Portatore fermo** (`team-ai.js`, correzione legata alla tappa 3): l'IA
  che ha appena vinto palla da ferma non riparte finche' il gesto del
  contrasto sfuma (circa 0,2 s), e resta ferma durante i 0,25 s di
  `KICK.setup` se ha un calcio in coda (la clip del calcio fa il giro).
  Ripartiva subito, quando la partenza della libreria era ancora bloccata dal
  gesto: "posa ferma che trasla" nei test delle tappe 4 e 5. Dalla tappa 3
  succedeva piu' spesso, perche' il passaggio non parte piu' da fermo.
- **A gioco fermo** (`main.js` stepAside): chi ha addosso un corpo che
  separate() non sposta (chi ha subito il fallo e cade, un gesto con la
  radice) se ne allontana a passo. Dopo una spinta o una trattenuta fischiate,
  chi aveva commesso il fallo veniva traslato all'indietro in piedi a 0,5-0,75
  m/s (prove 1 e 3 sotto).

Le 26 esultanze (`debug/riferimenti/esultanze/foglio_1-3.jpg`, 5 pose per
clip; lettura dalle pose, la corsa e' quella della radice):

| Clip | Durata | Corsa | Gesto |
|---|---|---|---|
| 033 Celebration_01 | 8,3 s | sul posto | si gira verso il pubblico, piccoli gesti |
| 034 Celebration_02 | 6,3 s | sul posto | cammina e guarda in alto |
| 035 Ceremony_001 | 8,3 s | 2,9 m | come 033, fatta per tenere la palla (qui senza) |
| 036 Ceremony_002 | 6,3 s | 2,2 m | come 034, fatta per tenere la palla |
| 038 | 3 s | 3,8 m | corsa, salto con mezzo giro e braccia alzate |
| 039 | 5,2 s | 9,1 m | corsa e scivolata in ginocchio a braccia aperte |
| 040 | 8,4 s | 6,1 m | corsa larga con ampi gesti delle braccia |
| 041 | 11 s | 9,3 m | aeroplano, braccia larghe |
| 042 | 6 s | 5,7 m | corsa con i pugni |
| 043 | 8,9 s | 4,6 m | corsa, mano all'orecchio |
| 044 | 10,5 s | 5,2 m | corsa, braccia al cielo e mano all'orecchio |
| 045 | 8,6 s | 2,6 m | corsa, indice al cielo |
| 046 | 12,2 s | 3 m | corsa con un giro su se stesso, mani al viso |
| 047 | 8,7 s | 3,5 m | mani al petto, poi saluto al pubblico |
| 048 | 9,4 s | 3,1 m | giro su se stesso col braccio alzato |
| 049 | 11,8 s | 2,6 m | in ginocchio su una gamba, braccia al cielo |
| 050 | 10,6 s | 2,4 m | passi di danza |
| 051 | 11,5 s | 3 m | braccia alzate, poi saluto |
| 052 | 13,2 s | 1,4 m | braccia alzate verso il pubblico |
| 053 | 9,9 s | 4,6 m | mani al petto, poi braccia larghe |
| 054 | 12,6 s | 5 m | affondo coi pugni, poi braccia aperte |
| 055 | 9,8 s | 2,6 m | mano alla fronte, poi braccio al cielo |
| 056 | 9,5 s | 2 m | in ginocchio, mani in testa, poi braccia al cielo |
| 057 | 9,8 s | 2,7 m | piegato col pugno, poi braccio al cielo |
| 058 | 5,2 s | sul posto | scivolata in ginocchio (come 039) |
| 059 | 10,5 s | sul posto | gesti con le braccia, fatta per tenere la palla |

Mancano, rispetto al riferimento, la **capriola all'indietro** e la **ruota
o capriola in avanti**: nessuna delle 907 clip Studio33 e nessun FBX in
`source/` ha un salto mortale. Il salto con mezzo giro (038) e
l'aeroplano (041) sono i piu' vicini al primo gol del riferimento, 057 e 043
al quarto. Meshy non e' stato usato.

Verifica: sequenza su un gol vero (seme 7, punizione a 38,6 s)
`debug/riferimenti/tappe5/seq2_tile.jpg`; gol forzato
`tappe5/seq1_tile.jpg` (`strumenti/gol_prova.js`); in tempo reale con
stacco e dissolvenza `tappe5/tempo_reale_tile.jpg`
(`strumenti/prova_dissolvenza.mjs`: la foto della dissolvenza ha l'immagine,
non una tela vuota); schieramento e riferimento
`tappe5/kickoff_confronto.jpg`.

Test di durata, 10 partite per prova; lo stato di partenza ne faceva 7
(portiere 4, piedi 2, osso 1) in una prova sola:

| Prova | Violazioni | Portiere | Piedi | Osso | Posa ferma | Rossi | Gialli | Scivolate |
|---|---|---|---|---|---|---|---|---|
| 1, regia e calcio d'inizio | 8 | 4 | 1 | 1 | 2 | 0,1 | 2,7 | 3,6 (fuori, 4-10) |
| 2, piu' fermo col calcio in coda | 4 | 1 | 2 | 0 | 1 | 0,1 | 2,7 | 4,3 |
| 3, piu' fermo mentre il gesto sfuma | 9 | 5 | 3 | 0 | 1 | 0,2 | 2,8 | 4,5 |
| 4, piu' a gioco fermo (codice del commit) | 5 | 1 | 2 | 1 | 1 | 0,4 (fuori, 0-0,2) | 3,5 | 4,2 |

Nessuna violazione cade nella regia del gol o nel calcio d'inizio; ogni gol
ha avuto il suo replay e tutti i passaggi del calcio d'inizio sono stati
ricevuti (uno interrotto dal fischio di fine tempo nella prova 3). Le prove
oscillano molto: media 6,5 violazioni contro le 7 di partenza, misurate una
volta sola. La posa ferma rimasta nella prova 4 e' un passaggio di prima da
fermo (502_Nonstop_Pass_Stand_270) subito dopo un contrasto vinto. I rossi
della prova 4 sono doppie ammonizioni, 2 nella stessa partita con 8 gialli;
la quota di falli da dietro resta fra il 60 e il 69 per cento in tutte le
prove. Su 50 partite (tappe 4 e 5) i rossi sono 10, 0,2 a partita: sul
limite dell'obiettivo.

### Blocco B: palla e gesti (17/10)

- **Barra di potenza bloccata**: una carica annullata senza calcio (possesso
  perso mentre si tiene premuto, passaggio in difesa, colpo di testa) non
  avviava il timer che la nasconde, e la barra restava ferma sull'ultimo
  valore. Ora sparisce subito (`main.syncMarkers`). Il difetto c'era gia'
  con la barra in basso.
- **Passaggi che attraversano gli avversari**: `main.deflect` ignorava i
  palloni sotto 0,45 m e sotto 12 m/s, e l'anticipo era un sorteggio una
  volta per pallone. Ora un rasoterra che tocca le sfere di piede o tibia
  di chi non lo aspettava viene controllato (`trapLow`: probabilita'
  dell'anticipo dalla difesa e dalla velocita' della palla rispetto a lui; un
  compagno all'85%) o rimbalza sulla gamba restando a terra
  (`BALL.deflect` legY, mateTrap).
- **Ricezione** (confronto con A10: palla a 11,5 m/s, 3,4 dopo 0,3 s): la
  palla veniva fermata in un fotogramma a 0,6-0,78 m dal corpo, la clip di
  stop partiva solo allora e il piede la toccava 0,2-0,4 s dopo; poi la palla
  finiva a 0,2 m dal corpo, fra le gambe. Ora `main.preTrap` fa partire la
  clip prima dell'arrivo, con il tocco (`ev.touch` della clip) nel
  fotogramma in cui arriva la palla; il destinatario la controlla alla
  distanza del tocco (`RECEIVE.pre`); dopo il tocco la palla resta almeno
  0,6 m davanti al busto (`RECEIVE.trap` minAhead, keepRate). Catture prima
  e dopo: `debug/riferimenti/tappe5/ricez/` (ko7, ko7e).
- **Palla che fluttua**: con le ombre vere accese l'ombra a disco sotto la
  palla veniva nascosta e restava solo quella del sole, piccola e spostata di
  lato: in campo la palla non aveva appoggio. Ora l'ombra a disco c'e'
  sempre (`BALL.shadowWithMap` 0,7). La rotazione disegnata e' limitata a
  55 rad/s (`BALL.visualSpin`): a 18 m/s la palla girava di 2,7 rad a
  fotogramma e sembrava ferma o girare all'indietro. Fisica invariata e
  realistica (resistenza 6,3 m/s^2 a 22 m/s, un pallone vero 6,4); lanci
  misurati in partita: 21,7 m in 1,48 s, culmine 4,85 m.
- Le stesse diagnosi su ombra e rotazione erano nei 12 file non committati
  del 04/10; qui sono riscritte sopra l'ultimo commit.

Test di durata (10 partite): 5 violazioni (piedi 2, portiere 2, osso 1),
statistiche nell'obiettivo (falli 21,8, gialli 3, rossi 0,1, scivolate 4).

### Blocco C: equilibrio del gioco (17/10)

Misure con `strumenti/hook-eventi.js` (4 partite IA contro IA per ogni
prova, le stesse grandezze di A10), `strumenti/portiere-rif.js` (tiri come
nel riferimento contro il portiere) e `strumenti/attributi.js` (ogni
attributo a 90 contro 60).

| | Prima | Dopo | Riferimento |
|---|---|---|---|
| Calci al minuto | 30 | 14-18 | 12,7 |
| Tenuta palla dalla ricezione al calcio | 0,5 s | 1,6-2,0 s | 2,1 s |
| Passaggi riusciti | 60% | 77-89% | 81% (sottostima delle perdite: vedi sotto) |
| Cambi di possesso a terra al minuto | 4,8 | 1,4-2,4 | 2,1 |
| Falli a partita | 18-33 | 0-4 | nessuno in 7,6 minuti |
| Chi difende: larghezza, ultimo uomo dietro la palla | 38,5 m, 11 m | 29-30 m, 18-21 m | 29 m, 22 m |
| Chi attacca: lunghezza, larghezza | 32 x 41 m | 38 x 39-40 m | 36 x 38 m |
| Tiri al palo dal limite: parate del portiere | 27 su 30 | 8 su 30 | 2 su 9 |
| Tiri centrali: parate | 10 su 10 | 10 su 10 | |

L'81% dei passaggi riusciti del riferimento conta solo i 43 voli (su 67) in
cui il radar riconosce sia chi calcia sia chi riceve; i palloni persi in
mischia hanno spesso il ricevente incerto, quindi il valore vero e' piu'
basso.

Cosa cambia:

- **Falli** (`DUEL.contact`, `DUEL.foul`, `DUEL.missFoul`, `AI.rash`,
  `PRESS.autoReact`, `PRESS.autoEvery`, `AI.slide.chance`): l'84% dei falli
  erano trattenute, spinte e cariche dell'IA, che partivano da quasi ogni
  avvicinamento di lato (0,9) o da dietro (1). Ora 0,01 e 0,025; contrasti
  automatici meno frequenti e quasi sempre puliti; scivolate dell'IA un
  quarto di prima. Il contrasto premuto dall'utente resta rischioso (0,15).
- **Ritmo** (`AI.carrier.hold`): l'IA decideva appena presa palla e passava
  dopo 0,5 s. Ora conduce per un tempo come nel riferimento (mediana 2,6 s
  di decisione, un tocco rapido una volta su cinque, al piu' 1,1 s se ha un
  avversario entro 3 m).
- **Scelta del passaggio** (`team-ai.passRisk`, `AI.carrier.passV`,
  `AI.carrier.lane`): il rischio era la distanza degli avversari dalla linea;
  ora e' una gara sul punto della linea piu' vicino a ogni avversario (la
  palla ci arriva a 11 m/s medi, lui dopo 0,3 s di reazione all'80% della sua
  velocita', e la tocca da 0,9 m). Anticipo meno probabile (`AI.intercept`).
- **Forma** (`SHAPE.defend`, `SHAPE.attack`): chi difende stretto (21) e basso
  (ultimo uomo 19 m dietro la palla, prima 7), chi attacca piu' lungo (42) e
  stretto (30).
- **Portieri** (`KEEPER.react`, `KEEPER.plan.rateMax`, `KEEPER.plan.shortGap`,
  `KEEPER.reach.dive`, `keeper.save`, `keeper.plan`): la lettura del tiro
  (parabile o no per gli attributi) non guidava la parata: clip di tuffo
  accelerata fino a 1,8 volte, radice allungata e IK prendevano anche i tiri
  giudicati imprendibili. Ora la reazione e' umana (0,32-0,2 s), il tuffo
  accelera al massimo 1,25 volte e, su un tiro non parabile, il portiere si
  tuffa verso il punto piu' lontano che raggiunge davvero: le mani restano
  corte di 0,35 m e la palla passa (skill: "il gol e' gol").
- **Attributi**: altezza ricavata (il database non la ha: ruolo principale,
  fisico, scarto fisso per giocatore; il manager puo' passare `height`),
  elevazione e forza dal fisico, controllo del primo tocco e agilita' con la
  palla dal dribbling; contrasto aereo (`gestures.aerialDuel`) e forza nei
  contrasti (`DUEL.strength`); forbice della forza del tiro allargata (27-36
  m/s, prima 30-35).
- **Test di durata**: obiettivi dal riferimento (falli 0-4, gialli 0-1,5,
  rossi 0-0,1, scivolate 0-3; prima quelli di PES 18-28, 2-6, 0-0,2, 4-10).
  Skill aggiornata di conseguenza.

Attributi, 90 contro 60 (gli altri a 75), con le funzioni del gioco:

| Attributo | Misura | 90 | 60 |
|---|---|---|---|
| Velocita' | 40 m da fermo; velocita' massima | 4,75 s; 9,2 m/s | 5,82 s; 7,6 m/s |
| Velocita' | 40 m con la palla | 5,1 s | 6,23 s |
| Tiro | velocita' a potenza 0,8; nello specchio; gol dal limite verso il palo (60 tiri, portiere 75) | 32 m/s; 30; 16 | 28,8 m/s; 21; 7 |
| Passaggio | scarto a 25 m; passaggi sbagliati (oltre 1,5 m) | 0,38 m; 0% | 1,27 m; 34% |
| Dribbling | primo tocco: palla piu' lunga del voluto | 0,11 m | 0,76 m |
| Dribbling | curva di 90 gradi con la palla a 7 m/s | 0,35 s | 0,43 s |
| Dribbling | palla persa nel contrasto di un difensore 75 | 28% | 41% |
| Difesa | contrasti vinti contro un portatore 75 | 41% | 25% |
| Fisico | contrasti vinti; duelli aerei vinti contro un 75 | 39%; 89% | 28%; 11% |
| Altezza (1,90 contro 1,70 m) | pallone piu' alto colpito di testa; duelli aerei vinti contro un 1,80 | 2,87 m; 88% | 2,58 m; 12% |

Test di durata (10 partite): 3 violazioni (portiere 2, piedi 1); falli 1,5,
gialli 0,3, rossi 0, scivolate 0,9 a partita; 2,8 gol a partita.

### Blocco D: gol e calcio d'inizio (17/10)

- **Nessuno attraversa chi esulta** (`main.clearWay`,
  `RULES.celebration.clear`): la corsa dell'esultanza (fino a 9 m) finiva
  addosso ai difensori, che la separazione fra corpi spostava in piedi. Ora,
  dal gol al replay, chi non partecipa all'esultanza (e l'arbitro) si scansa
  a passo quando sta entro 1,8 m dalla corsa di chi esulta, contando anche
  dove sara' fra 0,6 s. Sonda `strumenti/hook-esultanza.js` (4 partite):
  prima, in 7 gol su 11 un avversario arrivava a 0,68-0,75 m; dopo, dal
  primo mezzo secondo in poi, nessuno sotto 1,44 m in 7 gol.
- **Triangolo lime** come nel riferimento (`#7fd34e`, il colore pieno del
  triangolo a 64,6 s di riferimento-1, semitrasparente sul prato), su
  richiesta dell'utente; la barretta di potenza resta com'era.
- **Calcio d'inizio e regia**: come nella tappa 5 (schieramento, passaggio
  all'indietro, telecamera di gioco, tempi; diretta, primo piano, stacco,
  replay da quattro inquadrature). La skill `match3d` ora descrive il calcio
  d'inizio e la regia del riferimento al posto di quelli di PES.
- Non fatto: il replay corto dopo una grande parata (riferimento-2, 56-68 s)
  e la revisione del fuorigioco col VAR (riferimento-1, 316-336 s).

Test di durata (10 partite): 5 violazioni (portiere 3, piedi 1, osso 1),
falli 1,7, gialli 0,2, rossi 0, scivolate 0,6 a partita.

### Blocco E: stadio (18/10)

Il riferimento ha tribune piene in 3D con molte varianti, tabelloni e tetto
aperto col cielo (tabella A, riga 5). Ora KFM27 usa lo stadio Soccer Stadium
CF convertito (`tools/match3d/stadium_build.py`, file fuori da git):

- Strutture del progetto 3ds Max ridotte per oggetto in base a quanto si
  vedono dalle visuali di gioco e di replay: livello alto 272.000 triangoli
  (25 MB), basso 154.000 (15 MB); occlusione ambientale cotta nei vertici.
- Seggiolini e tifosi al posto di MultiScatter: strisce di posti lungo le 2789
  file di seggiolini e 51.000 tifosi sulle loro spline, sagome rese dai 9
  tifosi del progetto (braccia giu' e su) con maglia, sciarpa e bandiera nei
  colori della squadra; casa dietro una porta, ospiti dietro l'altra.
- Banner TurboSquid/DTP.3D sostituiti dagli sponsor della palla e dal marchio
  KFM27; i maxischermi mostrano squadre, risultato e minuto. Le maglie dei
  calciatori del progetto non si usano (giocano i nostri); tra le texture dei
  tifosi solo m_20 ha un marchio stampato e non e' fra le 9 rese.
- La telecamera di gioco vede quasi solo la tribuna bassa di fronte (come
  nel riferimento); le tribune piene si vedono nei replay, nei primi piani e
  sul lato lontano. Il modello si taglia 8 m davanti alla telecamera, che
  puo' stare dentro la tribuna VIP.
- Disegno: basso 112 chiamate e 538.000 triangoli (senza stadio 76 e
  246.000), alto 143 e 835.000. Test di durata: 6 violazioni in 10 partite,
  statistiche nell'obiettivo.

### Blocco F: Meshy (18/10)

- Mancavano la capriola all'indietro e la ruota (tabella delle esultanze,
  gol 2 e 3 di v1). Ora: capriola (libreria Meshy), ruota poi pugni al cielo
  e capriola poi braccia alzate (testo -> movimento), sul Calciatore.
  Come nel riferimento chi segna corre durante la diretta (4,2 s) e fa il
  gesto nel primo piano; i compagni lo raggiungono dove la clip finisce e
  si fermano a 0,8 m (prima uno gli entrava dentro).
  Confronto: `debug/riferimenti/gesti2/video/8_esultanza_ruota.mp4` e
  `9_esultanza_capriola.mp4` (riferimento sopra, KFM27 sotto, 8,5 s).
- Volti generici: 17 teste inventate (nessun volto reale, nessun marchio)
  con capelli e barba, come i giocatori senza licenza di PES.
- Gesti principali rifatti con la versione di oggi: `gesti2/video/`
  1_passaggio ... 7_parata, stessa finestra del riferimento di allora.
