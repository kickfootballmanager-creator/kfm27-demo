# KFM27

Gioco manageriale di calcio. Nessun framework: DOM e CSS scritti a mano.
- index.html: sola struttura
- src/data/eadb.json: 1031 club, 27.000 giocatori
- src/js/: un file per blocco, in ordine numerico
- src/styles/: CSS per area

Si apre da http://localhost:8080 (python3 -m http.server 8080),
non con doppio clic: il fetch del database non funziona da file://

## Regole non negoziabili
- Mai sostituzioni automatiche (sed, regex, replace globali) su stringhe
  che contengono URL o HTML: nel codice sono spezzate e concatenate in piu'
  punti, e si rompono in silenzio.
- Dopo OGNI modifica passa i file toccati a node --check. Zero errori
  prima di dire che hai finito.
- Mai emoji nell'interfaccia: solo SVG scritti a mano.
- Modifiche puntuali, mai riscritture integrali.
- Prima di toccare l'interfaccia leggi le skill in .claude/skills

## Regole visive gia' decise
- Titoli: Anton maiuscolo. Testo: Inter.
- Pannelli: rgba(10,17,28,.72), bordo rgba(255,255,255,.08), raggio 16px.
- Oro #dcb264 per classifica e premi, verde #3fe08f per statistiche
  e allenamento.
- Sfondi stadio con velatura fra 42% e 78%, mai oltre.
- Giocatore senza foto: la variabile AVP, gia' dentro il progetto.
- Il colore segnala uno stato, non decora.
