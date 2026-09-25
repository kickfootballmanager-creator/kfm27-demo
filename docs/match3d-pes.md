# PES 2021: come funzionano le meccaniche che replichiamo

Riassunto delle fonti in fondo, poi come ogni meccanica diventa codice in
`src/js/match3d/`. Dove le guide non danno numeri, i numeri sono nostri e
stanno in `config.js`.

## Comandi di PES 2021: schema predefinito verificato

Verificato il 24/09/2026 su FIFPlay, RealSport101 (schema Standard), PES
Mastery e sul manuale Konami di PES 2019 (stessi comandi). La skill match3d
scriveva Quadrato = cross e Cerchio = tiro: lo schema ufficiale e' il
contrario, Quadrato tiro e Cerchio cross/lancio. Seguiamo lo schema ufficiale.

| PlayStation | Xbox | Attacco | Difesa |
|---|---|---|---|
| X | A | Passaggio rasoterra | Pressing (tenuto); due volte: contrasto in piedi |
| Quadrato | X | Tiro | Raddoppio: un compagno va in pressione (tenuto) |
| Cerchio | B | Cross dalla fascia, lancio altrove | Scivolata |
| Triangolo | Y | Filtrante rasoterra | Uscita del portiere (tenuto) |
| R1 | RB | Scatto | Scatto |
| R2 | RT | Controllo stretto (con la levetta) | Jockey (con la levetta, rivolti al portatore) |
| L1 | LB | (in PES modifica passaggi: uno-due, filtrante alto; non fatto) | Cambio giocatore |
| Levetta destra | Levetta destra | Finte (skill_spin) | Cambio manuale verso la direzione |
| Levetta sinistra | Levetta sinistra | Movimento: inclinazione = velocita' | Movimento |
| Options | Menu | Pausa | Pausa |

Calci piazzati (PES): rigore con levetta sinistra per la direzione e
Quadrato tenuto per la potenza, L1 + Quadrato cucchiaio, R1 guida alla mira;
il portiere si tuffa spingendo la levetta. Punizione: Quadrato tiro con la
barra, X e Cerchio per passaggio e cross, R1 mostra o nasconde la
traiettoria; la barriera salta con Triangolo.

### Touch

Joystick a sinistra con l'origine dove si appoggia il pollice. A destra i
quattro tasti del pad a rombo come sul controller (Triangolo sopra, Quadrato
a sinistra, Cerchio a destra, X sotto), con icona e nome dell'azione del
momento; Scatto (R1) accanto al rombo; sopra di lui Finta in attacco e Cambio
giocatore (L1) in difesa, sempre visibile. Il doppio tocco su X in difesa e'
il contrasto, come sul pad.

### Tastiera (prova da PC)

WASD o frecce muovono. J = X, U = Quadrato, K = Cerchio, I = Triangolo,
L = R1, Q = L1, E = R2, O = finta (la levetta destra). Quindi in attacco
J passaggio, U tiro, K cross, I filtrante; in difesa J pressing (due volte
contrasto), U raddoppio, K scivolata, I portiere, Q cambio.

### Cambio giocatore

L1 passa al compagno piu' vicino alla palla; la levetta destra al compagno
nella direzione spinta. Cambio automatico: in attacco dopo un passaggio al
ricevente; in difesa quando la palla passa agli avversari o torna libera e
quando entra in un'altra zona del campo (6 fasce per 3), mai mentre si
tiene premuto Pressing o R2.

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

### Difesa dell'IA e disciplina

Come una squadra vera (skill match3d, "Difesa IA e disciplina"), in
`team-ai.js` (`defend`) con i numeri in `AI.defense`, `AI.tackle`, `AI.rash`,
`AI.slide`, `DUEL` e `FOUL`:

- Un solo difensore in pressione, scelto fra chi sta lato porta (chi e'
  dietro al portatore costa `behindCost` metri in piu'): temporeggia a
  1,5-2 m fra il portatore e la porta, spostato verso la sua corsa, rivolto
  alla palla. Un secondo in copertura 6 m dietro di lui. Chi e' stato saltato
  insegue il portatore affiancandolo. Gli altri in zona: la linea difensiva
  tiene la linea (sempre almeno 7 m dietro la palla) e marca lato porta chi
  le arriva addosso; i centrocampisti si mettono sulle linee dei passaggi in
  avanti. Chi e' davanti alla palla rientra di scatto. I posti cambiano con un
  filtro, niente inversioni di corsa a ogni decisione.
- Contrasto solo quando conviene: mai da dietro, palla dalla parte del
  difensore e lontana dal piede, appena ricevuta, oppure sul tentativo di
  dribbling. Finita la pazienza si entra anche su chi protegge palla di
  spalle, con molto rischio di fallo.
- Scivolata solo come ultima risorsa: portatore lanciato verso la porta,
  arrivo di lato o di fronte, nessun compagno in copertura.
- Falli come nel regolamento: contrasto che prende l'uomo invece del pallone,
  carica o spinta alle spalle di chi corre addosso al portatore, scivolata
  sull'uomo. Giallo da dietro, in scivolata o per fermare un'azione
  promettente; rosso per la chiara occasione da gol o per un intervento
  violento. Un ammonito e l'ultimo uomo rischiano meno (niente scivolate,
  meno contatti).
- Il giocatore dell'utente, dopo 0,6 s senza comandi in difesa, difende da
  solo con le stesse regole.

Obiettivi per partita, entrambe le squadre, verificati con
`node tools/match3d/soak.mjs`: scivolate 4-10, falli 18-28, gialli 2-6, rossi
circa uno ogni 8-10 partite.

## Punizioni

- In PES la punizione vicina alla porta si batte con la telecamera dietro al
  tiratore: la levetta destra sposta la direzione, la levetta sinistra da'
  effetto e traiettoria (anche durante la rincorsa), Quadrato riempie la
  barra della potenza. Le guide consigliano da meta' a due terzi della barra:
  con troppa potenza la palla va alta. Una linea tratteggiata mostra il primo
  tratto della traiettoria; R1 la toglie. La barriera salta con Triangolo.

Da noi (`setpieces.js`, numeri in `FK`): sotto i 30 m dalla porta la
punizione diretta ha la barriera a 9,15 m, da 2 a 5 uomini secondo distanza
e angolo, messa sul palo vicino mentre il portiere copre l'altro; al calcio la
barriera salta (clip header_jump, il punto piu' alto quando la palla le
arriva) e se la palla la tocca rimbalza. Telecamera bassa dietro al tiratore,
con transizione dalla visuale di gioco e ritorno un secondo dopo il calcio.
Come chiede la skill la levetta sinistra muove la mira (a destra e sinistra e
in altezza sulla linea di porta) e la levetta destra da' l'effetto; come in
PES la levetta sinistra durante la rincorsa aggiunge effetto e R1 mostra o
nasconde la traiettoria, disegnata per il primo mezzo secondo di volo alla
potenza caricata. Oltre i 30 m: telecamera alta e le scelte della punizione
indiretta (passaggio, cross, filtrante).

## Rigori

- PES 2021 (PES Mastery): si spinge la levetta sinistra verso l'angolo scelto
  (i quattro angoli o il centro) e la si tiene mentre si carica la potenza
  con Quadrato; da meta' a tre quarti della barra, di piu' per gli angoli
  alti, verso il 90% la palla va alta. L1 prima di caricare: cucchiaio. R1
  tenuto: un cerchio mostra dove andra' il tiro. Il portiere si tuffa
  spingendo la levetta dalla parte scelta: presto sui tiri forti, all'ultimo
  su quelli piano; la levetta va spinta fino in fondo.

Da noi (`setpieces.js`, numeri in `RULES.penalty`): telecamera bassa dietro
al tiratore, per i rigori a favore e contro. La levetta, tenuta anche durante
la rincorsa, sceglie l'angolo in larghezza e in altezza; con meno di meta'
barra l'angolo alto resta basso, oltre il 90% la palla sale sopra la
traversa. L1 + tiro fa il cucchiaio, R1 tenuto mostra il cerchio della mira
(largo quanto l'errore del tiratore). Il portiere IA indovina il lato con una
probabilita' che cresce con difficolta' e attributo. Sul rigore avversario
l'utente comanda il portiere: durante la rincorsa spinge la levetta e il
portiere si sposta da quella parte e poi si tuffa li'; chi si butta troppo
presto (oltre 0,35 s prima del calcio) puo' essere visto dal tiratore IA, che
cambia lato; entro 0,3 s dopo il calcio ci si puo' ancora tuffare in
ritardo; senza levetta il portiere resta al centro.

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
- Rigore: vedi la sezione Rigori.

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
- Comandi PES 2021, schema predefinito: https://www.fifplay.com/pes-2021-controls/
- PES Mastery, punizioni: https://pesmastery.com/pes-free-kick-tutorial/
- Discussione Steam sull'arbitro di PES 2020/2021: https://steamcommunity.com/app/996470/discussions/0/2518023667588674849/
- IFAB, vantaggio: https://www.footballrules.com/offences-sanctions/advantage/
