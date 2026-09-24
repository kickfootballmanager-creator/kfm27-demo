# PES 2021: come funzionano le meccaniche che replichiamo

Riassunto delle fonti in fondo, poi come ogni meccanica diventa codice in
`src/js/match3d/`. Dove le guide non danno numeri, i numeri sono nostri e
stanno in `config.js`.

## Comandi di PES 2021 (pad PlayStation) e i nostri pulsanti

| PES 2021 | Cosa fa | KFM27 (touch / tastiera) |
|---|---|---|
| X | Passaggio rasoterra ai piedi | Passa / J |
| Triangolo | Filtrante rasoterra nello spazio | Filtrante / I |
| L1 + Triangolo | Filtrante alto | non previsto |
| Cerchio | Cross dalla fascia, lancio altrove | Cross / U |
| Cerchio x2 | Cross basso | non previsto |
| Quadrato | Tiro | Tiro / K |
| R1 | Scatto | Scatto / L |
| X (difesa, tenuto) | Pressione sul portatore | Pressing / I (tenuto) |
| X x2 (difesa) | Contrasto in piedi | Contrasto / K |
| Cerchio (difesa) | Scivolata | Scivolata / U |
| L1 (difesa) | Cambio giocatore | Cambio / J |
| R2 + levetta | Jockey: si segue il portatore guardandolo | levetta con Pressing tenuto |

In PES il passaggio e la pressione stanno sullo stesso tasto; da noi le etichette
cambiano col possesso ma ogni pulsante fa una cosa sola (regola della skill).

## Passaggio rasoterra

- Si tiene premuto e si carica la barra di potenza; la direzione viene dalla
  levetta. Con l'assistenza (livello 2 di serie) il gioco sceglie il compagno
  nella direzione indicata; la lunghezza della barra dice quanto lontano va il
  pallone, quindi con due compagni nella stessa direzione la barra decide chi
  lo riceve. Con l'assistenza alta il passaggio puo' finire al compagno
  sbagliato se due giocatori sono nella stessa direzione.
- Passaggi corti e veloci sono la base del gioco. Piu' potenza vuol dire palla
  piu' veloce; troppo forte su un compagno vicino e il controllo e' piu' duro.

Da noi: `choosePass` prende i compagni nel cono della levetta e trasforma la
potenza in una distanza voluta, fra il piu' vicino (potenza zero) e il piu'
lontano (potenza piena). La velocita' della palla cresce con la potenza e con
la distanza (`PASS.speed*`, 14-26 m/s) e non scende mai sotto quella che serve
per arrivare. Mentre si carica, l'anello sul compagno si sposta dal vicino al
lontano.

## Filtrante

- Triangolo: palla rasoterra davanti al compagno, non ai suoi piedi. Le guide
  consigliano 5/8-7/8 della barra per i filtranti lunghi: la potenza decide
  quanto la palla va avanti nello spazio.
- L1 + Triangolo: filtrante alto sopra la difesa (non lo facciamo).

Da noi: `THROUGH.lead` passa da 4 a 16 metri davanti alla corsa del compagno
con la potenza; la palla arriva lenta nello spazio (`THROUGH.arrive`).

## Cross

- Cerchio dalla fascia. La barra sceglie il punto: 1/4 primo palo, 1/2 centro
  della porta, 3/4 secondo palo. Due tocchi: cross basso; R2: parabola alta;
  L1: cross anticipato dalla trequarti.

Da noi: `chooseCross` in fascia nell'ultimo terzo sposta il punto d'arrivo
dal primo palo al secondo con la potenza e alza la parabola. Altrove il
pulsante fa un lancio lungo, con il compagno scelto dalla potenza come nel
passaggio.

## Tiro

- Quadrato con la barra. In modalita' di base la potenza decide l'altezza del
  tiro: poca potenza palla bassa e piazzata, fra meta' e tre quarti la zona
  giusta, troppa potenza e la palla va sopra la traversa. L'attributo
  "potenza di tiro" alza la velocita'. R2 + Quadrato: tiro a giro, meno forte e
  piu' preciso. Due tocchi (Quadrato poi Triangolo): tiro rasoterra.

Da noi: `shotVelocity` fissa la velocita' fra `SHOT.minSpeed` e l'attributo
del giocatore, e l'altezza sulla linea di porta fra `SHOT.height`, con la
traversa superata oltre `SHOT.overPower` (tacca rossa sulla barra).

## Difesa: pressione e contrasto

- X tenuto: il difensore va sul portatore e lo pressa. Arrivato vicino gli
  resta addosso e il contrasto parte da solo quando e' abbastanza vicino: non
  serve un altro tasto. L'esito dipende dagli attributi di chi difende e di chi
  attacca (forza fisica ed equilibrio nei contrasti a spallate).
- Levetta lontano dall'attaccante con X tenuto: il difensore rallenta e lo
  accompagna qualche passo indietro; mollando la levetta torna a stringere.
- R1 + X: pressione in scatto. X due volte: contrasto in piedi subito.
- Cerchio: scivolata, piu' portata del contrasto in piedi e piu' rischio di
  fallo. Quadrato tenuto: un compagno controllato dal computer va in pressione;
  Quadrato due volte e poi tenuto: due o tre compagni in pressione.
- R2 + levetta (jockey): il difensore resta rivolto al portatore e si sposta
  con lui; per contrastare si molla R2 e si preme X due volte.

Da noi (difesa stile PES della skill): Pressing tenuto porta il giocatore sul
portatore; da vicino entra in marcatura stretta e con la levetta gira attorno
al portatore restando rivolto verso di lui. Il contrasto parte da solo quando
distanza e angolo lo permettono. L'esito (palla recuperata, il portatore la
passa prima, il portatore salta l'uomo, fallo) dipende da difesa del
difensore, dribbling del portatore, tempismo e difficolta'.

## Arbitro, falli, cartellini, rigori, fuorigioco

- L'arbitro di PES 2020/2021 e' noto per fischiare molto, anche falli leggeri
  che potrebbero lasciar correre con il vantaggio, e per ammonire spesso
  contrasti e scivolate. Noi teniamo la regola del vantaggio vera: si gioca se
  la squadra che ha subito il fallo tiene palla, e il cartellino arriva alla
  prima interruzione.
- Regolamento (IFAB): vantaggio quando fermare il gioco favorirebbe chi ha
  commesso il fallo; si puo' tornare al fallo se il vantaggio non arriva
  subito. Rosso per il grave fallo di gioco (intervento che mette a rischio
  l'avversario, a gamba tesa o in velocita'); un fallo da rigore con tentativo
  vero sul pallone vale il giallo.
- Rigore in PES: si carica il tiro e la levetta sceglie il lato; l'altezza
  dipende dalla potenza (piu' barra, piu' alto), circa il 90% della barra e'
  il tiro difficile da parare. Il portiere sceglie il lato con la levetta
  mentre il tiratore prende la rincorsa.

## Fonti

- PES Mastery, passaggi: https://pesmastery.com/pes-passing-tutorial/
- PES Mastery, filtrante: https://pesmastery.com/pes-2011-through-pass/
- PES Mastery, cross: https://pesmastery.com/pes-crossing-tutorial/
- PES Mastery, tiro: https://pesmastery.com/pes-shooting-tutorial/
- PES Mastery, difesa: https://pesmastery.com/pes-defending-tutorial/
- PES Mastery, rigori: https://pesmastery.com/pes-penalty-kick-tutorial/
- Manuale ufficiale Konami (PES 2019, comandi uguali): https://dds.konami.com/games/manual/pes2019/PS4/en/control_player.html
- Manuale Konami, comandi di squadra: https://dds.konami.com/games/manual/pes2019/PS4/en/control_team.html
- Comandi PES 2021: https://realsport101.com/article/pes-2021-controls-complete-guide-goalkeeper-defence-attack-on-ps4-and-xbox-one-dribbling-passing-shooting-tactics-gameplay-season-update
- Discussione Steam sull'arbitro di PES 2020/2021: https://steamcommunity.com/app/996470/discussions/0/2518023667588674849/
- IFAB, vantaggio: https://www.footballrules.com/offences-sanctions/advantage/
