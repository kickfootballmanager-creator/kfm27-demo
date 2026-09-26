# Catalogo animazioni Studio33 Soccer 8

Generato da `tools/match3d/studio33_catalog.py` con le misure di `tools/match3d/studio33_measure.py` (Blender, sugli FBX originali).
La libreria non si ridistribuisce: FBX, GLB e JSON derivati restano fuori dal repository (`.gitignore`). Qui ci sono solo nomi e misure.

## La libreria

- 907 clip, ognuna in un FBX; le cartelle `generic` e `humonoid` contengono gli stessi file byte per byte (cambiano solo le impostazioni di importazione di Unity).
- 30 fps. Scheletro Biped di 3ds Max (`Root`, `Bip001`, `Bip001-Pelvis`, `Bip001-L-Thigh`...): 52 ossa animate, piu' 21 ossa di torsione e del viso che solo la mesh usa. Nessuna clip usa ossa diverse.
- Personaggi inclusi: `Footballer.fbx` e `goalkeeper.fbx` (stesso scheletro, 73 ossa, circa 8.300 triangoli, una texture 1024 con la divisa dipinta, 25 varianti per il giocatore e 25 per il portiere).
- Root motion nell'osso `Root`: traslazione sul piano e rotazione attorno alla verticale, a scatti netti (45, 90, 180 gradi) nelle svolte. Il bacino non porta rotazioni nette.
- L'osso `Ball_Bone` porta la palla: segue i tocchi in conduzione, sta fermo sul punto della parata nelle clip del portiere e sul punto d'impatto nei colpi di testa.

## Convenzioni delle colonne

- Durata: secondi, dal primo all'ultimo fotogramma.
- Root motion: distanza netta del `Root` e, fra parentesi, (avanti, sinistra) in metri nel riferimento del giocatore al primo fotogramma.
- Rotazione: gradi netti del `Root`, positivi verso sinistra (antiorario visto dall'alto), come nei nomi della libreria: `_90` e' sinistra, `_270` destra.
- In place: si' se la radice si sposta meno di 10 cm in tutto.
- Stato: `core` (pacchetto essenziale, caricato all'avvio a ogni livello), `more` (varieta': all'avvio al livello alto, durante la partita al medio, mai al basso), `extra` (esultanze: come `more`; al basso resta quella Mixamo) o `scartata`, con l'azione del gioco che la usa o il motivo.
- Le clip che decidono il gioco (tempi, spostamenti, parate, conduzione) sono tutte in `core`: fisica, IA e comandi sono identici a ogni livello.

## Riepilogo

| Categoria | core | more | extra | scartate |
|---|---:|---:|---:|---:|
| locomozione | 33 | 14 | 0 | 5 |
| partenze e arresti | 2 | 45 | 0 | 0 |
| svolte | 3 | 37 | 0 | 6 |
| difesa | 25 | 7 | 0 | 10 |
| conduzione | 4 | 73 | 0 | 2 |
| passaggi | 10 | 23 | 0 | 13 |
| lanci e cross | 4 | 10 | 0 | 0 |
| tiri | 5 | 24 | 0 | 0 |
| colpi di testa | 2 | 0 | 0 | 3 |
| ricezioni | 5 | 110 | 0 | 0 |
| intercetti | 1 | 8 | 0 | 0 |
| contrasti | 5 | 5 | 0 | 0 |
| scivolate | 1 | 0 | 0 | 3 |
| cadute | 3 | 0 | 0 | 25 |
| portiere | 87 | 1 | 0 | 20 |
| finte | 1 | 0 | 0 | 99 |
| calci piazzati | 4 | 0 | 0 | 0 |
| esultanze | 0 | 0 | 6 | 20 |
| duelli di corpo | 0 | 0 | 0 | 60 |
| schivate | 0 | 0 | 0 | 8 |
| gesti | 0 | 0 | 0 | 6 |
| cerimonie | 0 | 0 | 0 | 4 |
| riscaldamento | 0 | 0 | 0 | 10 |
| menu e pose | 0 | 0 | 0 | 55 |
| **totale** | **195** | **357** | **6** | **349** |

Per livello: basso 195 clip (piu' 2 copie specchiate: finta e scivolata), medio e alto 558 (piu' le 3 copie specchiate: finta, scivolata, arresto laterale destro).

## Locomozione

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 004_Back steps_0 | 1.60 | 7.72 m (+7.72, -0.00) | -180 | no | scartata | corsa all'indietro con giro completo: nessuna situazione di gioco la chiede |
| 005_Back steps_Jogging_01 | 0.67 | 1.98 m (-1.98, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 006_Back steps_Jogging_01_135 | 0.67 | 1.98 m (-1.40, +1.40) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 007_Back steps_Jogging_01_225 | 0.67 | 1.98 m (-1.40, -1.40) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 008_Back steps_Jogging_02 | 0.60 | 2.30 m (-2.30, -0.00) | 0 | no | more | corsa (blend tree: velocita' e direzione) - alto all'avvio, medio in partita |
| 009_Back steps_Jogging_03 | 0.97 | 2.97 m (-2.97, -0.00) | 0 | no | more | corsa (blend tree: velocita' e direzione) - alto all'avvio, medio in partita |
| 010_Back steps_Jogging_04 | 1.00 | 3.08 m (-3.08, -0.00) | 0 | no | more | corsa (blend tree: velocita' e direzione) - alto all'avvio, medio in partita |
| 011_Back steps_Jogging_Stop_01 | 1.07 | 1.39 m (-1.39, -0.00) | 0 | no | more | arresto - alto all'avvio, medio in partita |
| 012_Back steps_Sprint_01 | 0.47 | 2.37 m (-2.37, +0.02) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 013_Back steps_Sprint_01_135 | 0.47 | 2.37 m (-1.66, +1.69) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 014_Back steps_Sprint_01_225 | 0.47 | 2.37 m (-1.69, -1.66) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 015_Back steps_Sprint_Stop | 1.10 | 2.33 m (-2.33, +0.02) | 0 | no | more | arresto - alto all'avvio, medio in partita |
| 016_Back steps_Walk_01 | 1.13 | 1.10 m (-1.10, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 017_Back steps_Walk_01_135 | 1.13 | 1.10 m (-0.78, +0.78) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 018_Back steps_Walk_01_225 | 1.13 | 1.10 m (-0.78, -0.78) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 256_FastJogging | 0.63 | 3.32 m (+3.32, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 257_FastJogging_45 | 0.63 | 3.32 m (+2.35, +2.35) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 258_FastJogging_315 | 0.63 | 3.32 m (+2.35, -2.35) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 287_Jogging | 0.60 | 2.70 m (+2.70, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 288_Jogging_45 | 0.67 | 2.70 m (+1.91, +1.91) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 289_Jogging_315 | 0.67 | 2.70 m (+1.91, -1.91) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 521_Sidestep_Fast_Jogging01_L | 1.87 | 6.69 m (+0.00, +6.69) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 522_Sidestep_Fast_Jogging01_R | 1.87 | 6.69 m (+0.00, -6.69) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 523_Sidestep_Jogging_Stop01_L | 0.97 | 0.78 m (-0.12, +0.77) | 0 | no | more | arresto - alto all'avvio, medio in partita |
| 524_Sidestep_Jogging_Stop01_R | 0.97 | 0.78 m (-0.12, +0.77) | 0 | no | scartata | stesso movimento di 523_Sidestep_Jogging_Stop01_L |
| 525_Sidestep_Jogging01_L | 1.83 | 3.82 m (+0.00, +3.82) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 526_Sidestep_Jogging01_R | 1.83 | 3.82 m (+0.00, -3.82) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 527_Sidestep_Sprint_Stop01_L | 1.27 | 2.03 m (+0.15, +2.02) | 0 | no | more | arresto - alto all'avvio, medio in partita |
| 528_Sidestep_Sprint_Stop01_R | 1.27 | 2.03 m (+0.15, -2.02) | 0 | no | more | arresto - alto all'avvio, medio in partita |
| 529_Sidestep_Sprint01_L | 0.93 | 5.29 m (-0.00, +5.29) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 530_Sidestep_Sprint01_R | 0.93 | 5.29 m (+0.00, -5.29) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 531_Sidestep_Walk01_L | 1.80 | 1.93 m (+0.00, +1.93) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 532_Sidestep_Walk01_R | 1.80 | 1.93 m (+0.00, -1.93) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 637_Slow_Jogging | 0.73 | 1.55 m (+1.55, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 638_Slow_Jogging_45 | 0.73 | 1.55 m (+1.09, +1.09) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 639_Slow_Jogging_315 | 0.73 | 1.55 m (+1.09, -1.09) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 646_Sprint_01 | 0.50 | 2.92 m (+2.92, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 647_Sprint_01_45 | 1.03 | 6.30 m (+4.45, +4.45) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 648_Sprint_01_315 | 1.03 | 6.30 m (+4.45, -4.45) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 649_Sprint_02 | 0.50 | 2.34 m (+2.34, +0.00) | 0 | no | more | corsa (blend tree: velocita' e direzione) - alto all'avvio, medio in partita |
| 650_Sprint_03 | 0.50 | 2.76 m (+2.76, +0.00) | 0 | no | more | corsa (blend tree: velocita' e direzione) - alto all'avvio, medio in partita |
| 685_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | core | fermo (blend tree, stile normale) - tutti i livelli, all'avvio |
| 686_Stand_01 | 2.47 | 0.00 m (+0.00, -0.00) | 0 | no | more | fermo (blend tree, stile normale) - alto all'avvio, medio in partita |
| 687_Stand_02 | 5.73 | 0.00 m (+0.00, -0.00) | 0 | si' | more | fermo (blend tree, stile normale) - alto all'avvio, medio in partita |
| 688_Stand_03 | 5.73 | 0.00 m (+0.00, -0.00) | 0 | si' | more | fermo (blend tree, stile normale) - alto all'avvio, medio in partita |
| 689_Stand_04 | 5.27 | 0.00 m (+0.00, -0.00) | 0 | si' | more | fermo (blend tree, stile normale) - alto all'avvio, medio in partita |
| 743_Tired_Jogging | 0.80 | 1.59 m (+1.59, -0.00) | 0 | no | scartata | corsa stanca: la stanchezza non cambia l'animazione |
| 744_Tired_JoggingArch_Turn_L | 0.80 | 2.15 m (+1.92, +0.95) | +45 | no | scartata | corsa stanca: la stanchezza non cambia l'animazione |
| 745_Tired_JoggingArch_Turn_R | 0.80 | 2.15 m (+1.92, -0.95) | -45 | no | scartata | corsa stanca: la stanchezza non cambia l'animazione |
| 873_Walk | 1.17 | 1.32 m (+1.32, -0.00) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 874_Walk_45 | 1.17 | 1.32 m (+0.94, +0.94) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |
| 875_Walk_315 | 1.17 | 1.32 m (+0.94, -0.94) | 0 | no | core | corsa (blend tree: velocita' e direzione) - tutti i livelli, all'avvio |

## Partenze e arresti

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 294_Jogging_Start_0 | 0.97 | 1.86 m (+1.86, -0.01) | 0 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 295_Jogging_Start_45 | 1.03 | 1.94 m (+1.35, +1.39) | +45 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 296_Jogging_Start_90 | 1.00 | 1.81 m (+0.00, +1.81) | +90 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 297_Jogging_Start_135 | 0.93 | 1.50 m (-0.95, +1.16) | +135 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 298_Jogging_Start_180 | 0.83 | 0.91 m (-0.91, +0.00) | +180 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 299_Jogging_Start_225 | 0.70 | 0.89 m (-0.51, -0.73) | -135 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 300_Jogging_Start_270 | 0.70 | 1.03 m (+0.03, -1.03) | -90 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 301_Jogging_Start_315 | 0.70 | 1.03 m (+0.69, -0.76) | -45 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 302_Jogging_Stop | 2.33 | 0.65 m (+0.65, -0.00) | 0 | no | core | arresto - tutti i livelli, all'avvio |
| 303_Jogging_Stop_45 | 1.47 | 1.19 m (+1.19, -0.00) | +45 | no | more | arresto - alto all'avvio, medio in partita |
| 304_Jogging_Stop_90 | 1.33 | 1.15 m (+1.15, -0.00) | +90 | no | more | arresto - alto all'avvio, medio in partita |
| 305_Jogging_Stop_135 | 1.33 | 1.23 m (+1.23, -0.00) | +135 | no | more | arresto - alto all'avvio, medio in partita |
| 306_Jogging_Stop_180 | 1.10 | 1.15 m (+1.15, +0.00) | -180 | no | more | arresto - alto all'avvio, medio in partita |
| 307_Jogging_Stop_225 | 1.33 | 1.23 m (+1.23, +0.00) | -135 | no | more | arresto - alto all'avvio, medio in partita |
| 308_Jogging_Stop_270 | 1.33 | 1.16 m (+1.15, -0.02) | -90 | no | more | arresto - alto all'avvio, medio in partita |
| 309_Jogging_Stop_315 | 1.47 | 1.19 m (+1.19, +0.00) | -45 | no | more | arresto - alto all'avvio, medio in partita |
| 651_Sprint_Start_0 | 0.90 | 2.40 m (+2.40, +0.02) | 0 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 652_Sprint_Start_45 | 1.10 | 2.30 m (+1.86, +1.36) | +45 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 653_Sprint_Start_90 | 1.10 | 2.00 m (+0.38, +1.96) | +90 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 654_Sprint_Start_135 | 1.03 | 1.74 m (-0.99, +1.43) | +135 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 655_Sprint_Start_180 | 1.40 | 2.54 m (-2.52, -0.31) | -180 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 656_Sprint_Start_225 | 1.23 | 2.54 m (-1.55, -2.00) | -135 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 657_Sprint_Start_270 | 1.33 | 2.98 m (+0.37, -2.96) | -90 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 658_Sprint_Start_315 | 1.33 | 3.29 m (+2.56, -2.06) | -45 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 659_Sprint_Stop | 1.47 | 2.30 m (+2.30, -0.00) | 0 | no | core | arresto - tutti i livelli, all'avvio |
| 660_Sprint_Stop_45 | 1.50 | 2.59 m (+2.59, -0.00) | +45 | no | more | arresto - alto all'avvio, medio in partita |
| 661_Sprint_Stop_90 | 1.30 | 2.04 m (+2.04, -0.00) | +90 | no | more | arresto - alto all'avvio, medio in partita |
| 662_Sprint_Stop_135 | 1.27 | 2.37 m (+2.37, -0.00) | +135 | no | more | arresto - alto all'avvio, medio in partita |
| 663_Sprint_Stop_180 | 1.33 | 1.94 m (+1.94, +0.04) | -180 | no | more | arresto - alto all'avvio, medio in partita |
| 664_Sprint_Stop_225 | 1.27 | 2.37 m (+2.37, +0.08) | -135 | no | more | arresto - alto all'avvio, medio in partita |
| 665_Sprint_Stop_270 | 1.33 | 1.16 m (+1.15, -0.02) | -90 | no | more | arresto - alto all'avvio, medio in partita |
| 666_Sprint_Stop_315 | 1.50 | 2.59 m (+2.59, -0.07) | -45 | no | more | arresto - alto all'avvio, medio in partita |
| 876_Walk_Start_0 | 1.17 | 1.26 m (+1.25, -0.09) | 0 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 877_Walk_Start_45 | 1.40 | 1.60 m (+1.03, +1.22) | +45 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 878_Walk_Start_90 | 1.47 | 1.54 m (+0.01, +1.54) | +90 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 879_Walk_Start_135 | 1.37 | 1.12 m (-0.60, +0.95) | +135 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 880_Walk_Start_180 | 1.63 | 1.59 m (-1.54, -0.39) | -180 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 881_Walk_Start_225 | 1.53 | 1.03 m (-0.69, -0.76) | -135 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 882_Walk_Start_270 | 0.83 | 0.68 m (+0.05, -0.68) | -90 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 883_Walk_Start_315 | 0.83 | 0.78 m (+0.49, -0.60) | -45 | no | more | partenza da fermo - alto all'avvio, medio in partita |
| 884_Walk_Stop_45 | 1.33 | 0.64 m (+0.63, +0.11) | +45 | no | more | arresto - alto all'avvio, medio in partita |
| 885_Walk_Stop_90 | 1.33 | 0.65 m (+0.64, +0.14) | +90 | no | more | arresto - alto all'avvio, medio in partita |
| 886_Walk_Stop_135 | 1.33 | 0.81 m (+0.81, +0.05) | +135 | no | more | arresto - alto all'avvio, medio in partita |
| 887_Walk_Stop_180 | 1.83 | 0.62 m (+0.62, -0.01) | -180 | no | more | arresto - alto all'avvio, medio in partita |
| 888_Walk_Stop_225 | 1.33 | 0.81 m (+0.81, -0.05) | -135 | no | more | arresto - alto all'avvio, medio in partita |
| 889_Walk_Stop_270 | 1.33 | 0.65 m (+0.64, -0.14) | -90 | no | more | arresto - alto all'avvio, medio in partita |
| 890_Walk_Stop_315 | 1.33 | 0.64 m (+0.63, -0.11) | -45 | no | more | arresto - alto all'avvio, medio in partita |

## Svolte

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 311_Jogging_Turn_45 | 0.67 | 2.22 m (+1.95, +1.08) | +44 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 312_Jogging_Turn_45_Run | 0.67 | 2.80 m (+2.80, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 313_Jogging_Turn_90 | 0.60 | 1.63 m (+0.96, +1.31) | +90 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 314_Jogging_Turn_90_Run | 0.70 | 2.53 m (+2.53, -0.10) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 315_Jogging_Turn_135 | 0.53 | 0.81 m (+0.29, +0.75) | +127 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 316_Jogging_Turn_135_Run | 0.70 | 2.52 m (+2.52, -0.01) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 317_Jogging_Turn_180_L | 0.67 | 0.53 m (+0.53, -0.01) | +168 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 318_Jogging_Turn_180_L_Run | 0.63 | 2.27 m (+2.27, +0.02) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 319_Jogging_Turn_180_R | 1.07 | 0.24 m (+0.23, +0.05) | -180 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 320_Jogging_Turn_180_R_Run | 0.60 | 2.21 m (+2.21, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 321_Jogging_Turn_225 | 0.63 | 0.95 m (+0.22, -0.92) | -135 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 322_Jogging_Turn_225_Run | 0.70 | 2.26 m (+2.25, +0.16) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 323_Jogging_Turn_270 | 0.67 | 1.61 m (+0.92, -1.32) | -90 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 324_Jogging_Turn_270_Run | 0.33 | 1.19 m (+1.18, +0.13) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 325_Jogging_Turn_315 | 0.60 | 2.06 m (+1.58, -1.32) | -45 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 326_Jogging_Turn_315_Run | 0.63 | 2.77 m (+2.77, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 327_JoggingArch_Turn_L | 0.67 | 2.18 m (+2.01, +0.83) | +45 | no | scartata | curva continua in corsa: la rendono il blend tree e l'inclinazione in curva |
| 328_JoggingArch_Turn_R | 0.67 | 2.18 m (+2.01, -0.83) | -45 | no | scartata | curva continua in corsa: la rendono il blend tree e l'inclinazione in curva |
| 667_Sprint_Turn_45 | 0.53 | 2.77 m (+2.74, +0.38) | +45 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 668_Sprint_Turn_45_Run | 0.53 | 2.98 m (+2.98, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 669_Sprint_Turn_90 | 0.50 | 1.70 m (+1.29, +1.11) | +90 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 670_Sprint_Turn_90_Run | 0.53 | 2.70 m (+2.70, -0.11) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 671_Sprint_Turn_135 | 0.53 | 0.90 m (+0.77, +0.46) | +135 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 672_Sprint_Turn_135_Run | 1.00 | 3.67 m (+3.67, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 673_Sprint_Turn_180_L | 0.73 | 0.45 m (+0.45, -0.04) | +180 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 674_Sprint_Turn_180_L_Run | 0.87 | 3.69 m (+3.69, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 675_Sprint_Turn_180_R | 0.97 | 0.25 m (-0.25, -0.04) | -180 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 676_Sprint_Turn_180_R_Run | 0.43 | 1.88 m (+1.88, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 677_Sprint_Turn_225 | 0.60 | 0.98 m (+0.78, -0.59) | -135 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 678_Sprint_Turn_225_Run | 0.70 | 2.45 m (+2.45, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 679_Sprint_Turn_270 | 0.60 | 2.10 m (+1.75, -1.18) | -90 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 680_Sprint_Turn_270_Run | 0.47 | 2.06 m (+2.06, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 681_Sprint_Turn_315 | 0.57 | 2.89 m (+2.77, -0.83) | -45 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 682_Sprint_Turn_315_Run | 0.63 | 3.35 m (+3.35, -0.00) | 0 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 683_SprintArch_Turn_L | 0.50 | 2.82 m (+2.77, +0.53) | +45 | no | scartata | curva continua in corsa: la rendono il blend tree e l'inclinazione in curva |
| 684_SprintArch_Turn_R | 0.50 | 2.82 m (+2.77, -0.53) | -45 | no | scartata | curva continua in corsa: la rendono il blend tree e l'inclinazione in curva |
| 719_Stand_Turn_90 | 1.57 | 0.00 m (+0.00, -0.00) | +90 | no | core | giro sul posto - tutti i livelli, all'avvio |
| 720_Stand_Turn_180 | 1.67 | 0.00 m (+0.00, -0.00) | +180 | no | core | giro sul posto - tutti i livelli, all'avvio |
| 721_Stand_Turn_270 | 1.57 | 0.00 m (+0.00, -0.00) | -90 | no | core | giro sul posto - tutti i livelli, all'avvio |
| 891_Walk_Turn_90 | 1.67 | 1.51 m (+0.72, +1.33) | +90 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 892_Walk_Turn_135 | 2.70 | 1.50 m (-0.64, +1.36) | +135 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 893_Walk_Turn_180 | 2.07 | 0.71 m (-0.70, -0.14) | -180 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 894_Walk_Turn_225 | 2.23 | 0.89 m (-0.10, -0.89) | -135 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 895_Walk_Turn_270 | 2.07 | 2.03 m (+0.77, -1.88) | -90 | no | more | inversione in corsa - alto all'avvio, medio in partita |
| 896_WalkArch_Turn_L | 1.17 | 1.30 m (+1.20, +0.50) | +45 | no | scartata | curva continua in corsa: la rendono il blend tree e l'inclinazione in curva |
| 897_WalkArch_Turn_R | 1.17 | 1.30 m (+1.20, -0.50) | -45 | no | scartata | curva continua in corsa: la rendono il blend tree e l'inclinazione in curva |

## Difesa

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 025_Block_KickCut_R | 0.83 | 0.99 m (+0.23, -0.96) | -141 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 026_Block_Shoot01 | 1.03 | 3.03 m (+3.03, +0.02) | 0 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 027_Block_Shoot02 | 1.27 | 4.42 m (+4.16, -1.52) | 0 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 028_BlockKick_Cut_L | 0.77 | 0.99 m (+0.23, +0.96) | +141 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 029_BlockShoot_Defense_middle_Reaction_L | 0.87 | 1.17 m (+0.20, -1.15) | -245 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 030_BlockShoot_Defense_middle_Reaction_R | 0.87 | 1.17 m (+0.20, +1.15) | +245 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 031_BlockShoot_Defense_Small_Reaction_L | 0.73 | 0.01 m (+0.01, +0.01) | 0 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 032_BlockShoot_Defense_Small_Reaction_R | 0.73 | 0.01 m (+0.01, -0.01) | 0 | no | scartata | respinta del tiro col corpo: meccanica non presente |
| 087_Defense_FastJogging | 0.43 | 1.55 m (+1.55, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 088_Defense_FastJogging_45 | 0.43 | 1.55 m (+1.10, +1.10) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 089_Defense_FastJogging_90 | 0.43 | 1.44 m (+0.00, +1.44) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 090_Defense_FastJogging_135 | 0.43 | 1.27 m (-0.90, +0.90) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 091_Defense_FastJogging_180 | 0.43 | 1.27 m (-1.27, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 092_Defense_FastJogging_180_L | 0.43 | 1.27 m (-1.27, -0.00) | 0 | no | scartata | corsa all'indietro col corpo girato: doppione della 180 |
| 093_Defense_FastJogging_180_R | 0.43 | 1.27 m (-1.27, -0.00) | 0 | no | scartata | corsa all'indietro col corpo girato: doppione della 180 |
| 094_Defense_FastJogging_225 | 0.43 | 1.27 m (-0.90, -0.90) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 095_Defense_FastJogging_270 | 0.43 | 1.44 m (-0.00, -1.44) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 096_Defense_FastJogging_315 | 0.43 | 1.55 m (+1.10, -1.10) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 097_Defense_Jogging | 0.47 | 1.15 m (+1.15, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 098_Defense_Jogging_45 | 0.47 | 1.15 m (+0.81, +0.81) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 099_Defense_Jogging_90 | 0.50 | 1.43 m (+0.00, +1.43) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 100_Defense_Jogging_135 | 0.37 | 0.66 m (-0.47, +0.47) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 101_Defense_Jogging_180 | 0.37 | 0.66 m (-0.66, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 102_Defense_Jogging_225 | 0.37 | 0.66 m (-0.47, -0.47) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 103_Defense_Jogging_270 | 0.50 | 1.43 m (-0.00, -1.43) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 104_Defense_Jogging_315 | 0.47 | 1.15 m (+0.81, -0.81) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 110_Defense_Reaction_90_01 | 0.83 | 1.09 m (+0.36, +1.03) | +113 | no | more | giro sul posto in guardia - alto all'avvio, medio in partita |
| 111_Defense_Reaction_180_01 | 0.83 | 0.98 m (-0.90, +0.38) | +169 | no | more | giro sul posto in guardia - alto all'avvio, medio in partita |
| 112_Defense_Reaction_225_01 | 0.83 | 1.09 m (+0.36, -1.03) | -113 | no | more | giro sul posto in guardia - alto all'avvio, medio in partita |
| 113_Defense_Stand_Turn_90 | 0.73 | 0.00 m (+0.00, -0.00) | +90 | si' | more | giro sul posto in guardia - alto all'avvio, medio in partita |
| 114_Defense_Stand_Turn_180 | 1.33 | 0.00 m (+0.00, -0.00) | +180 | no | more | giro sul posto in guardia - alto all'avvio, medio in partita |
| 115_Defense_Stand_Turn_270 | 0.73 | 0.00 m (+0.00, -0.00) | -90 | si' | more | giro sul posto in guardia - alto all'avvio, medio in partita |
| 116_Defense_Stand01 | 1.77 | 0.00 m (+0.00, -0.00) | 0 | si' | core | fermo in guardia - tutti i livelli, all'avvio |
| 117_Defense_Stand02 | 3.33 | 0.00 m (+0.00, -0.00) | 0 | no | more | fermo in guardia - alto all'avvio, medio in partita |
| 118_Defense_Walk | 0.77 | 0.88 m (+0.88, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 119_Defense_Walk_45 | 0.77 | 0.88 m (+0.62, +0.62) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 120_Defense_Walk_90 | 0.57 | 0.61 m (+0.00, +0.61) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 121_Defense_Walk_135 | 0.50 | 0.51 m (-0.36, +0.36) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 122_Defense_Walk_180 | 0.50 | 0.51 m (-0.51, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 123_Defense_Walk_225 | 0.50 | 0.51 m (-0.36, -0.36) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 124_Defense_Walk_270 | 0.57 | 0.61 m (-0.00, -0.61) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |
| 125_Defense_Walk_315 | 0.77 | 0.88 m (+0.88, -0.00) | 0 | no | core | corsa in guardia davanti al portatore - tutti i livelli, all'avvio |

## Conduzione

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 129_Dribble_FastJogging01 | 1.83 | 8.55 m (+8.55, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 130_Dribble_FastSprint01 | 2.50 | 14.15 m (+14.15, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 131_Dribble_Jogging_LF01 | 0.70 | 2.40 m (+2.40, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 132_Dribble_Jogging_RF01 | 0.70 | 2.40 m (+2.40, +0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 133_Dribble_Jogging_Stop | 0.53 | 0.48 m (+0.48, -0.01) | 0 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 134_Dribble_Jogging_Stop_90 | 0.53 | 1.11 m (+1.06, -0.34) | +90 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 135_Dribble_Jogging_Stop_180 | 1.00 | 1.63 m (+1.63, -0.03) | +180 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 136_Dribble_Jogging_Stop_270 | 0.53 | 1.11 m (+1.06, +0.34) | -90 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 137_Dribble_Jogging_Turn_180_L | 0.73 | 0.86 m (+0.83, +0.23) | +180 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 138_Dribble_Jogging_Turn_180_R | 0.73 | 0.86 m (+0.83, -0.23) | -180 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 139_Dribble_Jogging_Turn_LF_45 | 0.67 | 2.49 m (+2.23, +1.12) | +40 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 140_Dribble_Jogging_Turn_LF_90 | 0.67 | 1.60 m (+0.80, +1.39) | +90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 141_Dribble_Jogging_Turn_LF_135 | 0.73 | 0.91 m (+0.79, +0.45) | +135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 142_Dribble_Jogging_Turn_LF_225 | 0.47 | 0.95 m (+0.93, -0.16) | -135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 143_Dribble_Jogging_Turn_LF_270 | 0.67 | 1.60 m (+0.80, -1.39) | -90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 144_Dribble_Jogging_Turn_LF_315 | 0.67 | 2.48 m (+2.22, -1.11) | -45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 145_Dribble_Jogging_Turn_RF_45 | 0.63 | 1.85 m (+1.67, +0.80) | +45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 146_Dribble_Jogging_Turn_RF_90 | 0.53 | 1.20 m (+1.08, +0.51) | +90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 147_Dribble_Jogging_Turn_RF_135 | 0.87 | 0.76 m (+0.33, +0.69) | +135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 148_Dribble_Jogging_Turn_RF_225 | 0.87 | 0.72 m (+0.07, -0.71) | -135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 149_Dribble_Jogging_Turn_RF_270 | 0.67 | 1.36 m (+0.52, -1.26) | -90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 150_Dribble_Jogging_Turn_RF_315 | 0.63 | 1.84 m (+1.44, -1.15) | -45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 151_Dribble_Jogging01 | 0.70 | 2.40 m (+2.40, -0.00) | 0 | no | core | conduzione (tocchi di palla dal Ball_Bone) - tutti i livelli, all'avvio |
| 152_Dribble_Jogging02 | 0.50 | 1.83 m (+1.83, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 153_Dribble_Jogging03 | 0.57 | 2.57 m (+2.57, -0.00) | 0 | no | core | conduzione (tocchi di palla dal Ball_Bone) - tutti i livelli, all'avvio |
| 154_Dribble_Jogging04 | 0.87 | 4.25 m (+4.25, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 155_Dribble_JoggingArch_Turn_L | 0.63 | 1.47 m (+1.31, +0.67) | +45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 156_Dribble_JoggingArch_Turn_R | 0.63 | 1.47 m (+1.31, -0.67) | -45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 157_Dribble_NoBall_Jogging_LF | 0.70 | 2.40 m (+2.40, -0.00) | 0 | no | scartata | conduzione mimata senza palla |
| 158_Dribble_NoBall_Sprint_LF | 0.57 | 2.66 m (+2.66, -0.00) | 0 | no | scartata | conduzione mimata senza palla |
| 159_Dribble_Sprint_LF01 | 0.57 | 2.66 m (+2.66, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 160_Dribble_Sprint_RF01 | 0.57 | 2.66 m (+2.66, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 161_Dribble_Sprint_Stop | 0.97 | 1.35 m (+1.35, -0.00) | 0 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 162_Dribble_Sprint_Stop_45 | 1.03 | 2.39 m (+2.38, +0.22) | +45 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 163_Dribble_Sprint_Stop_90 | 1.13 | 1.53 m (+1.53, -0.04) | +90 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 164_Dribble_Sprint_Stop_135 | 1.20 | 2.51 m (+2.50, +0.29) | +135 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 165_Dribble_Sprint_Stop_180 | 1.33 | 2.01 m (+1.97, +0.44) | +180 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 166_Dribble_Sprint_Stop_225 | 1.07 | 2.56 m (+2.41, -0.86) | -135 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 167_Dribble_Sprint_Stop_270 | 1.33 | 2.69 m (+2.60, -0.68) | -90 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 168_Dribble_Sprint_Stop_315 | 1.07 | 2.96 m (+2.81, -0.93) | -45 | no | more | arresto in conduzione - alto all'avvio, medio in partita |
| 169_Dribble_Sprint_Turn_180_L | 0.93 | 0.83 m (+0.83, -0.05) | +180 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 170_Dribble_Sprint_Turn_180_R | 0.93 | 0.83 m (+0.83, -0.05) | -180 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 171_Dribble_Sprint_Turn_LF_45 | 0.60 | 2.27 m (+1.92, +1.22) | +45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 172_Dribble_Sprint_Turn_LF_90 | 0.77 | 1.62 m (+1.15, +1.14) | +90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 173_Dribble_Sprint_Turn_LF_135 | 0.70 | 1.75 m (+1.59, +0.71) | +135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 174_Dribble_Sprint_Turn_LF_225 | 0.70 | 1.75 m (+1.59, -0.71) | -135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 175_Dribble_Sprint_Turn_LF_270 | 0.77 | 1.62 m (+1.15, -1.14) | -90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 176_Dribble_Sprint_Turn_LF_315 | 0.60 | 2.29 m (+1.97, -1.17) | -45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 177_Dribble_Sprint_Turn_RF_45 | 0.60 | 2.97 m (+2.81, +0.97) | +45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 178_Dribble_Sprint_Turn_RF_90 | 0.73 | 2.25 m (+2.04, +0.94) | +90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 179_Dribble_Sprint_Turn_RF_135 | 0.80 | 1.60 m (+1.00, +1.25) | +135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 180_Dribble_Sprint_Turn_RF_225 | 0.70 | 1.75 m (+1.59, -0.71) | -135 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 181_Dribble_Sprint_Turn_RF_270 | 0.77 | 2.59 m (+2.49, -0.72) | -90 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 182_Dribble_Sprint_Turn_RF_315 | 0.60 | 2.61 m (+2.53, -0.65) | -45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 183_Dribble_Sprint01 | 0.57 | 2.66 m (+2.66, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 184_Dribble_Sprint02 | 0.60 | 2.68 m (+2.68, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 185_Dribble_Sprint03 | 0.57 | 3.30 m (+3.30, -0.00) | 0 | no | core | conduzione (tocchi di palla dal Ball_Bone) - tutti i livelli, all'avvio |
| 186_Dribble_Sprint04 | 0.93 | 4.80 m (+4.80, -0.00) | 0 | no | more | conduzione (tocchi di palla dal Ball_Bone) - alto all'avvio, medio in partita |
| 187_Dribble_SprintArch_Turn_L | 0.57 | 2.65 m (+2.45, +1.02) | +45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 188_Dribble_SprintArch_Turn_R | 0.57 | 2.65 m (+2.45, -1.02) | -45 | no | more | inversione in conduzione - alto all'avvio, medio in partita |
| 189_Dribble_Stand01 | 3.50 | 0.00 m (+0.00, -0.00) | 0 | si' | core | fermo con la palla - tutti i livelli, all'avvio |
| 190_Dribble_Start_Jogging_180_L | 1.30 | 1.99 m (-1.99, +0.07) | +180 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 191_Dribble_Start_Jogging_180_R | 1.03 | 0.87 m (-0.87, +0.00) | -180 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 192_Dribble_Start_Jogging_LF_0 | 0.70 | 2.02 m (+2.02, -0.05) | 0 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 193_Dribble_Start_Jogging_LF_45 | 1.07 | 2.18 m (+1.57, +1.52) | +45 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 194_Dribble_Start_Jogging_LF_90 | 0.90 | 1.46 m (+0.09, +1.46) | +90 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 195_Dribble_Start_Jogging_LF_135 | 0.77 | 0.86 m (-0.71, +0.49) | +135 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 196_Dribble_Start_Jogging_LF_225 | 1.00 | 0.66 m (-0.28, -0.60) | -135 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 197_Dribble_Start_Jogging_LF_270 | 1.13 | 1.77 m (+0.52, -1.69) | -90 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 198_Dribble_Start_Jogging_LF_315 | 0.60 | 1.42 m (+0.98, -1.03) | -45 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 199_Dribble_Start_Jogging_RF_0 | 0.70 | 2.02 m (+2.02, +0.05) | 0 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 200_Dribble_Start_Jogging_RF_45 | 0.60 | 1.42 m (+0.98, +1.03) | +45 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 201_Dribble_Start_Jogging_RF_90 | 1.13 | 1.77 m (+0.52, +1.69) | +90 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 202_Dribble_Start_Jogging_RF_135 | 1.00 | 0.66 m (-0.28, +0.60) | +135 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 203_Dribble_Start_Jogging_RF_225 | 0.77 | 0.86 m (-0.71, -0.49) | -135 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 204_Dribble_Start_Jogging_RF_270 | 0.90 | 1.46 m (+0.09, -1.46) | -90 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 205_Dribble_Start_Jogging_RF_315 | 1.07 | 2.18 m (+1.57, -1.52) | -45 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 206_Dribble_Start_Sprint_180_L | 1.27 | 1.84 m (-1.84, +0.08) | +180 | no | more | partenza in conduzione - alto all'avvio, medio in partita |
| 207_Dribble_Start_Sprint_180_R | 1.57 | 3.28 m (-3.28, +0.03) | -180 | no | more | partenza in conduzione - alto all'avvio, medio in partita |

## Passaggi

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 260_Heel_pass_L | 0.47 | 0.08 m (+0.06, +0.05) | 0 | si' | scartata | colpo di tacco: comando non presente |
| 261_Heel_pass_L_B | 0.43 | 0.52 m (+0.43, -0.29) | 0 | no | scartata | colpo di tacco: comando non presente |
| 262_Heel_pass_R | 0.47 | 0.08 m (+0.04, -0.07) | 0 | si' | scartata | colpo di tacco: comando non presente |
| 263_Heel_pass_R | 0.43 | 0.52 m (+0.43, +0.29) | 0 | no | scartata | colpo di tacco: comando non presente |
| 330_Jump_Pass_90 | 0.73 | 2.43 m (+2.43, -0.12) | 0 | no | scartata | passaggio in salto: comando non presente |
| 331_Jump_Pass_90_B | 0.67 | 1.59 m (+1.54, +0.37) | 0 | no | scartata | passaggio in salto: comando non presente |
| 332_Jump_Pass_270 | 0.73 | 2.43 m (+2.43, +0.12) | 0 | no | scartata | passaggio in salto: comando non presente |
| 333_Jump_Pass_270_B | 0.67 | 1.59 m (+1.54, -0.37) | 0 | no | scartata | passaggio in salto: comando non presente |
| 334_Jump_Pass_L | 0.60 | 1.49 m (+1.47, -0.19) | 0 | no | scartata | passaggio in salto: comando non presente |
| 335_Jump_Pass_R | 0.60 | 1.49 m (+1.47, +0.19) | 0 | no | scartata | passaggio in salto: comando non presente |
| 469_Low_Pass_Stand_0 | 0.43 | 0.79 m (+0.79, -0.05) | 0 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 470_Low_Pass_Stand_0_Lfoot | 0.43 | 0.79 m (+0.79, +0.05) | 0 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 471_Low_Pass_Stand_90 | 0.33 | 0.63 m (+0.59, +0.21) | +90 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 472_Low_Pass_Stand_90_edit | 1.37 | 1.72 m (+1.69, -0.30) | +90 | no | scartata | variante ritoccata di una clip gia' presa |
| 473_Low_Pass_Stand_135 | 0.43 | 0.70 m (+0.69, -0.12) | +135 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 474_Low_Pass_Stand_180_L | 2.33 | 3.43 m (+3.34, +0.76) | +180 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 475_Low_Pass_Stand_180_R | 2.07 | 2.52 m (+2.42, -0.69) | -180 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 476_Low_Pass_Stand_225 | 0.37 | 0.61 m (+0.60, +0.11) | -135 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 477_Low_Pass_Stand_270 | 0.30 | 0.56 m (+0.52, -0.19) | -90 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 478_Low_Pass_Stand_270_edit | 1.97 | 1.94 m (+1.94, -0.08) | -90 | no | scartata | variante ritoccata di una clip gia' presa |
| 484_MED_Pass_Stand_0 | 1.03 | 1.14 m (+1.13, +0.11) | 0 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 485_MED_Pass_Stand_90 | 0.33 | 0.63 m (+0.59, +0.21) | +90 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 486_MED_Pass_Stand_90_edit | 1.07 | 1.35 m (+1.30, +0.37) | +90 | no | scartata | variante ritoccata di una clip gia' presa |
| 487_MED_Pass_Stand_135 | 1.00 | 1.75 m (+1.75, +0.14) | +135 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 488_MED_Pass_Stand_180_L | 1.90 | 1.88 m (+1.86, +0.26) | +180 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 489_MED_Pass_Stand_180_R | 1.90 | 1.88 m (+1.86, -0.26) | -180 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 490_MED_Pass_Stand_225 | 1.00 | 1.75 m (+1.75, -0.14) | -135 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 491_MED_Pass_Stand_270 | 0.30 | 0.56 m (+0.52, -0.19) | -90 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 492_Nonstop_Pass_Jogging_0 | 0.37 | 1.16 m (+1.16, -0.01) | 0 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 493_Nonstop_Pass_Jogging_0_Lfoot | 0.37 | 1.16 m (+1.16, -0.01) | 0 | no | core | passaggio e filtrante (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 494_Nonstop_Pass_Jogging_45 | 0.40 | 1.35 m (+1.35, +0.01) | 0 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 495_Nonstop_Pass_Jogging_90 | 0.40 | 1.47 m (+1.47, +0.00) | 0 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 496_Nonstop_Pass_Jogging_270 | 0.40 | 1.47 m (+1.47, -0.00) | 0 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 497_Nonstop_Pass_Jogging_315 | 0.40 | 1.35 m (+1.35, -0.01) | 0 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 498_Nonstop_Pass_Stand_0 | 0.50 | 0.00 m (+0.00, -0.00) | 0 | si' | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 499_Nonstop_Pass_Stand_0_Lfoot | 0.50 | 0.00 m (+0.00, -0.00) | 0 | si' | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 500_Nonstop_Pass_Stand_45 | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 501_Nonstop_Pass_Stand_90 | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 502_Nonstop_Pass_Stand_270 | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 503_Nonstop_Pass_Stand_315 | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 504_Pass_Stand_0 | 2.03 | 3.74 m (+3.72, -0.38) | 0 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 505_Pass_Stand_90 | 1.73 | 3.02 m (+2.96, +0.59) | +90 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 506_Pass_Stand_180 | 2.07 | 3.10 m (+3.09, +0.27) | +180 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 507_Pass_Stand_180_L | 2.13 | 3.80 m (+3.79, +0.24) | +180 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 508_Pass_Stand_180_R | 2.13 | 3.80 m (+3.79, -0.24) | -180 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 509_Pass_Stand_270 | 1.73 | 3.02 m (+2.96, -0.59) | -90 | no | more | passaggio e filtrante (contatto dal Ball_Bone) - alto all'avvio, medio in partita |

## Lanci e cross

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 447_lob_Pass_Stand_00 | 2.10 | 0.22 m (+0.19, +0.11) | 0 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 448_lob_Pass_Stand_01 | 0.80 | 0.56 m (+0.54, +0.14) | 0 | no | core | cross e lancio (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 449_lob_Pass_Stand_01_Lfoot | 0.80 | 0.56 m (+0.54, -0.14) | 0 | no | core | cross e lancio (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 450_lob_Pass_Stand_90 | 1.20 | 0.74 m (+0.63, -0.40) | +90 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 451_lob_Pass_Stand_180L | 0.87 | 1.23 m (-1.16, +0.40) | -180 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 452_lob_Pass_Stand_180R | 0.87 | 1.19 m (-1.13, -0.37) | +180 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 453_lob_Pass_Stand_270 | 0.93 | 0.24 m (-0.24, +0.03) | -90 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 462_Long_Pass_Stand_0 | 0.80 | 2.21 m (+2.21, +0.13) | 0 | no | core | cross e lancio (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 463_Long_Pass_Stand_0_Lfoot | 0.80 | 2.21 m (+2.21, -0.13) | 0 | no | core | cross e lancio (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 464_Long_Pass_Stand_90 | 0.83 | 1.67 m (+1.57, +0.57) | +90 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 465_Long_Pass_Stand_180 | 2.47 | 2.88 m (+2.84, -0.49) | -180 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 466_Long_Pass_Stand_180_L | 0.93 | 1.86 m (+1.75, +0.62) | +180 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 467_Long_Pass_Stand_180_R | 0.93 | 1.86 m (+1.75, -0.62) | -180 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 468_Long_Pass_Stand_270 | 0.83 | 1.67 m (+1.57, -0.57) | -90 | no | more | cross e lancio (contatto dal Ball_Bone) - alto all'avvio, medio in partita |

## Tiri

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 272_In_Place_Shoot_0_L | 0.80 | 0.83 m (+0.82, -0.13) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 273_In_Place_Shoot_0_R | 0.80 | 0.83 m (+0.82, +0.13) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 274_In_Place_Shoot_90 | 0.83 | 0.81 m (+0.70, +0.41) | +90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 275_In_Place_Shoot_180_L | 0.70 | 0.68 m (+0.62, -0.27) | -180 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 276_In_Place_Shoot_180_R | 0.70 | 0.89 m (+0.83, +0.33) | +180 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 277_In_Place_Shoot_270 | 0.83 | 0.81 m (+0.70, -0.41) | -90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 479_Low_Shoot_Stand_0 | 1.00 | 2.65 m (+2.64, +0.23) | 0 | no | core | tiro (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 480_Low_Shoot_Stand_0_Lfoot | 1.00 | 2.65 m (+2.64, -0.23) | 0 | no | core | tiro (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 481_Low_Shoot_Stand_90 | 2.33 | 3.67 m (+3.65, +0.43) | +90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 482_Low_Shoot_Stand_180 | 2.07 | 2.89 m (+2.86, -0.44) | -180 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 483_Low_Shoot_Stand_270 | 1.73 | 2.69 m (+2.66, -0.38) | -90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 512_Shoot_Stand_0 | 1.13 | 3.37 m (+3.36, -0.32) | 0 | no | core | tiro (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 513_Shoot_Stand_0_01 | 2.00 | 4.88 m (+4.75, -1.10) | 0 | no | core | tiro (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 514_Shoot_Stand_0_02 | 2.00 | 5.15 m (+5.06, -0.92) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 515_Shoot_Stand_0_03 | 2.00 | 5.60 m (+5.40, -1.49) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 516_Shoot_Stand_0_Lfoot | 1.13 | 3.37 m (+3.36, +0.32) | 0 | no | core | tiro (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 517_Shoot_Stand_90 | 1.00 | 2.83 m (+2.82, +0.13) | +90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 518_Shoot_Stand_180_L | 1.17 | 2.80 m (+2.72, +0.65) | +180 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 519_Shoot_Stand_180_R | 1.17 | 2.80 m (+2.72, -0.65) | -180 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 520_Shoot_Stand_270 | 1.00 | 2.83 m (+2.82, -0.13) | -90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 864_Volley_Shoot_Run_0 | 1.20 | 4.05 m (+4.05, +0.04) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 865_Volley_Shoot_Run_90 | 0.97 | 3.04 m (+3.04, -0.10) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 866_Volley_Shoot_Run_270 | 1.33 | 3.82 m (+3.82, -0.20) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 867_Volley_Shoot_Stand_0_01 | 2.33 | 0.33 m (+0.31, +0.11) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 868_Volley_Shoot_Stand_0_02 | 1.73 | 0.60 m (+0.60, +0.03) | 0 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 869_Volley_Shoot_Stand_L_01 | 0.60 | 0.26 m (-0.03, +0.26) | +90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 870_Volley_Shoot_Stand_L_02 | 0.83 | 0.70 m (-0.03, +0.70) | +90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 871_Volley_Shoot_Stand_R_01 | 0.60 | 0.26 m (-0.03, -0.26) | -90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |
| 872_Volley_Shoot_Stand_R_02 | 0.83 | 0.70 m (-0.03, -0.70) | -90 | no | more | tiro (contatto dal Ball_Bone) - alto all'avvio, medio in partita |

## Colpi di testa

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 126_Diving_Head_0 | 1.67 | 1.39 m (+1.13, -0.82) | 0 | no | scartata | tuffo di testa: comando non presente |
| 127_Diving_Head_90 | 1.93 | 1.44 m (+1.07, -0.97) | 0 | no | scartata | tuffo di testa: comando non presente |
| 128_Diving_Head_270 | 1.93 | 1.44 m (+1.07, +0.97) | 0 | no | scartata | tuffo di testa: comando non presente |
| 259_Heading_Stand_01 | 0.80 | 0.33 m (+0.33, +0.04) | 0 | no | core | colpo di testa (contatto dal Ball_Bone) - tutti i livelli, all'avvio |
| 329_Jump_Head_0 | 0.60 | 2.40 m (+2.40, +0.02) | 0 | no | core | colpo di testa (contatto dal Ball_Bone) - tutti i livelli, all'avvio |

## Ricezioni

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 746_Trapping_Backpedal_0 | 0.83 | 0.18 m (-0.15, +0.10) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 747_Trapping_Backpedal_0_Run | 0.97 | 4.03 m (+4.03, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 748_Trapping_Backpedal_45 | 0.67 | 0.86 m (-0.76, +0.40) | +45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 749_Trapping_Backpedal_45_Run | 1.00 | 4.57 m (+4.57, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 750_Trapping_Backpedal_90 | 0.60 | 1.36 m (-1.27, +0.46) | +88 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 751_Trapping_Backpedal_90_Run | 0.93 | 3.81 m (+3.81, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 752_Trapping_Backpedal_135 | 0.67 | 1.44 m (-1.39, +0.36) | +135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 753_Trapping_Backpedal_135_Run | 0.90 | 4.01 m (+4.01, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 754_Trapping_Backpedal_180L | 0.67 | 1.91 m (-1.88, -0.35) | +180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 755_Trapping_Backpedal_180L_Run | 0.77 | 3.53 m (+3.53, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 756_Trapping_Backpedal_180R | 0.60 | 1.70 m (-1.69, +0.18) | -180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 757_Trapping_Backpedal_180R_Run | 0.47 | 2.10 m (+2.10, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 758_Trapping_Backpedal_225 | 0.67 | 1.53 m (-1.40, -0.61) | -135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 759_Trapping_Backpedal_225_Run | 0.47 | 2.11 m (+2.11, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 760_Trapping_Backpedal_270 | 0.83 | 1.87 m (-1.58, -1.00) | -89 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 761_Trapping_Backpedal_270_Run | 0.93 | 4.17 m (+4.17, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 762_Trapping_Backpedal_315 | 0.53 | 0.87 m (-0.69, -0.52) | -45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 763_Trapping_Backpedal_315_Run | 0.47 | 1.76 m (+1.76, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 764_Trapping_Chest_0 | 0.90 | 0.45 m (+0.44, +0.07) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 765_Trapping_Chest_0_Run | 0.73 | 2.34 m (+2.34, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 766_Trapping_Chest_45 | 0.67 | 0.35 m (+0.35, -0.02) | +45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 767_Trapping_Chest_45_Run | 0.63 | 2.27 m (+2.27, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 768_Trapping_Chest_90 | 0.67 | 0.29 m (+0.23, +0.17) | +90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 769_Trapping_Chest_90_Run | 0.67 | 2.33 m (+2.33, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 770_Trapping_Chest_135 | 0.67 | 0.34 m (+0.01, +0.34) | +135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 771_Trapping_Chest_135_Run | 0.67 | 2.21 m (+2.21, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 772_Trapping_Chest_180 | 0.67 | 0.47 m (-0.47, +0.06) | +180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 773_Trapping_Chest_180_Run | 0.63 | 2.17 m (+2.17, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 774_Trapping_Chest_225 | 0.67 | 0.30 m (+0.06, -0.29) | -135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 775_Trapping_Chest_225_Run | 0.73 | 0.00 m (+0.00, -0.00) | 0 | si' | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 776_Trapping_Chest_270 | 0.67 | 0.46 m (+0.15, -0.43) | -90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 777_Trapping_Chest_270_Run | 0.70 | 2.49 m (+2.49, +0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 778_Trapping_Chest_315 | 0.67 | 0.29 m (+0.21, +0.20) | -45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 779_Trapping_Chest_315_Run | 0.70 | 2.63 m (+2.63, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 780_Trapping_Chest_FWD | 0.63 | 0.54 m (+0.53, -0.01) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 781_Trapping_Chest_Stand | 0.67 | 0.21 m (+0.20, -0.02) | 0 | no | core | stop di palla e primo tocco orientato - tutti i livelli, all'avvio |
| 782_Trapping_Foot_Jogging01 | 0.70 | 3.19 m (+3.19, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 783_Trapping_Foot_Jogging02 | 0.37 | 1.26 m (+1.26, +0.03) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 784_Trapping_Foot_Sprint01 | 0.43 | 2.08 m (+2.08, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 785_Trapping_Foot_Stand_01 | 0.43 | 0.18 m (-0.09, +0.15) | 0 | no | core | stop di palla e primo tocco orientato - tutti i livelli, all'avvio |
| 786_Trapping_Head_0 | 0.83 | 0.09 m (+0.08, +0.02) | 0 | no | core | stop di palla e primo tocco orientato - tutti i livelli, all'avvio |
| 787_Trapping_Head_45 | 0.83 | 0.38 m (+0.28, +0.26) | +90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 788_Trapping_Head_90 | 0.83 | 0.23 m (+0.17, +0.15) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 789_Trapping_Head_270 | 0.83 | 0.23 m (+0.17, -0.15) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 790_Trapping_Head_315 | 0.83 | 0.38 m (+0.28, -0.26) | -90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 791_Trapping_Jogging_45 | 0.27 | 0.78 m (+0.73, +0.28) | +42 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 792_Trapping_Jogging_45_Run | 0.67 | 2.38 m (+2.38, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 793_Trapping_Jogging_90 | 0.40 | 0.98 m (+0.94, +0.29) | +90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 794_Trapping_Jogging_90_Run | 0.80 | 2.27 m (+2.27, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 795_Trapping_Jogging_135 | 0.80 | 0.97 m (+0.68, +0.70) | +130 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 796_Trapping_Jogging_135_Run | 0.60 | 2.24 m (+2.24, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 797_Trapping_Jogging_180L | 0.87 | 0.21 m (+0.01, -0.21) | +180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 798_Trapping_Jogging_180L_Run | 1.17 | 4.96 m (+4.96, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 799_Trapping_Jogging_180R | 0.83 | 0.44 m (+0.43, -0.06) | -180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 800_Trapping_Jogging_180R_Run | 1.00 | 3.75 m (+3.75, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 801_Trapping_Jogging_225 | 1.03 | 1.33 m (+1.28, -0.35) | -135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 802_Trapping_Jogging_225_Run | 0.87 | 3.34 m (+3.34, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 803_Trapping_Jogging_270 | 0.37 | 0.83 m (+0.66, -0.51) | -90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 804_Trapping_Jogging_270_Run | 0.60 | 2.13 m (+2.13, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 805_Trapping_Jogging_315 | 0.27 | 0.86 m (+0.80, -0.32) | -45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 806_Trapping_Jogging_315_Run | 0.57 | 2.34 m (+2.34, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 807_Trapping_OnlyStand_45 | 0.33 | 0.09 m (+0.09, +0.03) | 0 | si' | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 808_Trapping_OnlyStand_90 | 0.33 | 0.05 m (+0.04, +0.01) | 0 | si' | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 809_Trapping_OnlyStand_270 | 0.37 | 0.46 m (+0.41, +0.21) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 810_Trapping_OnlyStand_315 | 0.67 | 1.06 m (+0.33, +1.01) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 811_Trapping_Run_0_Low01 | 0.33 | 1.14 m (+1.14, +0.03) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 812_Trapping_Run_0_Low02 | 0.70 | 3.19 m (+3.19, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 813_Trapping_Sprint_45 | 0.63 | 1.96 m (+1.73, +0.94) | +45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 814_Trapping_Sprint_45_Run | 0.70 | 2.49 m (+2.49, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 815_Trapping_Sprint_90 | 0.60 | 0.96 m (+0.73, +0.62) | +90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 816_Trapping_Sprint_90_Run | 1.03 | 4.29 m (+4.29, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 817_Trapping_Sprint_135 | 0.83 | 1.28 m (+0.97, +0.84) | +135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 818_Trapping_Sprint_135_Run | 0.97 | 3.87 m (+3.87, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 819_Trapping_Sprint_180L | 0.90 | 0.68 m (+0.62, +0.27) | +180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 820_Trapping_Sprint_180L_Run | 1.03 | 3.97 m (+3.97, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 821_Trapping_Sprint_180R | 1.10 | 0.71 m (-0.71, -0.00) | -180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 822_Trapping_Sprint_180R_Run | 0.63 | 2.45 m (+2.45, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 823_Trapping_Sprint_225 | 1.13 | 1.15 m (+0.41, -1.08) | -135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 824_Trapping_Sprint_225_Run | 1.03 | 4.51 m (+4.51, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 825_Trapping_Sprint_270 | 0.87 | 1.52 m (+0.77, -1.32) | -90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 826_Trapping_Sprint_270_Run | 0.50 | 2.04 m (+2.04, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 827_Trapping_Sprint_315 | 0.50 | 1.58 m (+1.50, -0.52) | -45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 828_Trapping_Sprint_315_Run | 0.57 | 2.34 m (+2.34, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 829_Trapping_Stand_0_High01_LFoot | 0.67 | 0.58 m (-0.57, +0.07) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 830_Trapping_Stand_0_High01_RFoot | 0.67 | 0.58 m (-0.57, -0.07) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 831_Trapping_Stand_0_Low01_LFoot | 0.53 | 0.19 m (-0.11, -0.15) | 0 | no | core | stop di palla e primo tocco orientato - tutti i livelli, all'avvio |
| 832_Trapping_Stand_0_Low01_RFoot | 0.53 | 0.19 m (-0.11, +0.15) | 0 | no | core | stop di palla e primo tocco orientato - tutti i livelli, all'avvio |
| 833_Trapping_Stand_0_Low02_LFoot | 0.53 | 0.06 m (+0.06, +0.00) | 0 | si' | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 834_Trapping_Stand_0_Low02_RFoot | 0.53 | 0.06 m (+0.06, -0.00) | 0 | si' | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 835_Trapping_Stand_0_Low03_LFoot | 0.53 | 0.36 m (-0.22, -0.28) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 836_Trapping_Stand_0_Low03_RFoot | 0.53 | 0.36 m (-0.22, +0.28) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 837_Trapping_Stand_0_Medium01_LFoot | 0.53 | 0.33 m (-0.23, -0.25) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 838_Trapping_Stand_0_Medium01_RFoot | 0.53 | 0.33 m (-0.23, +0.25) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 839_Trapping_Stand_45 | 1.17 | 1.66 m (+1.15, +1.20) | +45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 840_Trapping_Stand_45_Run | 0.60 | 2.69 m (+2.69, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 841_Trapping_Stand_90 | 1.23 | 1.14 m (+0.12, +1.14) | +90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 842_Trapping_Stand_90_Run | 0.67 | 2.58 m (+2.58, +0.01) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 843_Trapping_Stand_135 | 1.17 | 0.54 m (-0.48, +0.25) | +135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 844_Trapping_Stand_135_Run | 0.63 | 2.08 m (+2.08, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 845_Trapping_Stand_180 | 1.27 | 0.80 m (-0.79, -0.15) | +180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 846_Trapping_Stand_180_Run | 0.60 | 2.20 m (+2.20, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 847_Trapping_Stand_225 | 1.33 | 1.58 m (-1.21, -1.02) | -135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 848_Trapping_Stand_225_Run | 1.13 | 4.23 m (+4.23, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 849_Trapping_Stand_270 | 1.17 | 1.72 m (+0.12, -1.71) | -90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 850_Trapping_Stand_270_Run | 0.67 | 2.56 m (+2.56, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 851_Trapping_Stand_315 | 1.13 | 1.83 m (+1.37, -1.22) | -45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 852_Trapping_Stand_315_Run | 0.67 | 2.83 m (+2.83, -0.00) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 853_Trapping_Stand_Chest_0 | 1.50 | 0.74 m (+0.74, +0.04) | 0 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 854_Trapping_Stand_Chest_45 | 0.87 | 0.10 m (+0.00, -0.10) | +45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 855_Trapping_Stand_Chest_90 | 1.17 | 0.37 m (+0.17, +0.33) | +90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 856_Trapping_Stand_Chest_135 | 1.17 | 0.39 m (+0.04, +0.38) | +135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 857_Trapping_Stand_Chest_180 | 1.50 | 0.40 m (+0.03, +0.40) | +180 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 858_Trapping_Stand_Chest_225 | 1.17 | 0.39 m (+0.04, -0.38) | -135 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 859_Trapping_Stand_Chest_270 | 1.17 | 0.37 m (+0.17, -0.33) | -90 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |
| 860_Trapping_Stand_Chest_315 | 0.87 | 0.10 m (+0.00, +0.10) | -45 | no | more | stop di palla e primo tocco orientato - alto all'avvio, medio in partita |

## Intercetti

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 278_Intercept_LFoot_00 | 1.03 | 2.43 m (+2.40, +0.40) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 279_Intercept_LFoot_01 | 1.20 | 3.35 m (+3.35, +0.12) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 280_Intercept_RFoot_00 | 0.80 | 1.54 m (+1.47, -0.45) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 281_Intercept_RFoot_01 | 0.90 | 2.00 m (+1.99, -0.09) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 282_Intercept_Stand_0 | 0.67 | 1.58 m (+1.57, +0.20) | 0 | no | core | intercetto - tutti i livelli, all'avvio |
| 283_Intercept_Stand_45L | 0.77 | 0.58 m (+0.57, +0.09) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 284_Intercept_Stand_45R | 0.93 | 0.62 m (+0.62, -0.09) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 285_Intercept_Stand_90L | 0.90 | 1.28 m (+0.43, +1.21) | 0 | no | more | intercetto - alto all'avvio, medio in partita |
| 286_Intercept_Stand_90R | 0.93 | 1.29 m (+0.43, -1.22) | 0 | no | more | intercetto - alto all'avvio, medio in partita |

## Contrasti

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 310_Jogging_Tackles_01 | 0.80 | 2.81 m (+2.81, +0.03) | 0 | no | core | contrasto in piedi - tutti i livelli, all'avvio |
| 510_Run_Tackles_01 | 0.60 | 3.28 m (+3.27, -0.25) | 0 | no | core | contrasto in piedi - tutti i livelli, all'avvio |
| 511_Run_Tackles_02 | 0.67 | 3.18 m (+3.18, +0.07) | 0 | no | more | contrasto in piedi - alto all'avvio, medio in partita |
| 644_Small_Tackles_Stand_Left | 0.40 | 0.03 m (+0.01, +0.03) | 0 | si' | core | contrasto in piedi - tutti i livelli, all'avvio |
| 645_Small_Tackles_Stand_Right | 0.40 | 0.03 m (+0.01, -0.03) | 0 | si' | core | contrasto in piedi - tutti i livelli, all'avvio |
| 736_Tackles_Stand_0 | 1.20 | 0.50 m (+0.49, +0.08) | 0 | no | core | contrasto in piedi - tutti i livelli, all'avvio |
| 737_Tackles_Stand_45 | 1.33 | 0.67 m (+0.67, +0.10) | 0 | no | more | contrasto in piedi - alto all'avvio, medio in partita |
| 738_Tackles_Stand_90 | 1.03 | 1.31 m (+0.43, +1.24) | 0 | no | more | contrasto in piedi - alto all'avvio, medio in partita |
| 739_Tackles_Stand_270 | 1.03 | 1.31 m (+0.43, -1.24) | 0 | no | more | contrasto in piedi - alto all'avvio, medio in partita |
| 740_Tackles_Stand_315 | 1.33 | 0.67 m (+0.67, -0.10) | 0 | no | more | contrasto in piedi - alto all'avvio, medio in partita |

## Scivolate

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 633_Slide_Intercept01 | 2.50 | 4.78 m (+4.78, +0.10) | 0 | no | scartata | altra scivolata: lo spostamento decide il gioco, resta quella del pacchetto essenziale |
| 634_Slide_Tackles_90 | 3.00 | 3.85 m (+3.82, +0.52) | +90 | no | scartata | altra scivolata: lo spostamento decide il gioco, resta quella del pacchetto essenziale |
| 635_Slide_Tackles_270 | 3.00 | 3.85 m (+3.82, -0.52) | -90 | no | scartata | altra scivolata: lo spostamento decide il gioco, resta quella del pacchetto essenziale |
| 636_Slide_Tackles01 | 1.13 | 2.40 m (+2.40, +0.13) | 0 | no | core | scivolata - tutti i livelli, all'avvio |

## Cadute

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 084_Defense_Fall_Reaction_L | 0.80 | 0.91 m (+0.06, +0.90) | +130 | no | scartata | sbilanciamento di chi viene saltato: il gioco lo rende col rallentamento, senza gesto |
| 085_Defense_Fall_Reaction_R | 0.80 | 0.91 m (+0.06, -0.90) | -130 | no | scartata | sbilanciamento di chi viene saltato: il gioco lo rende col rallentamento, senza gesto |
| 086_Defense_Fall_Reaction_UP | 0.93 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | sbilanciamento di chi viene saltato: il gioco lo rende col rallentamento, senza gesto |
| 105_Defense_Jump_Fall_Reaction_01_L | 2.30 | 0.00 m (+0.00, -0.00) | 0 | no | core | caduta dopo un fallo, a terra, rialzo - tutti i livelli, all'avvio |
| 106_Defense_Jump_Fall_Reaction_01_R | 2.30 | 0.00 m (+0.00, +0.00) | 0 | no | core | caduta dopo un fallo, a terra, rialzo - tutti i livelli, all'avvio |
| 107_Defense_Jump_Fall_Reaction_02_L | 2.20 | 2.09 m (+1.94, -0.78) | 0 | no | scartata | altra caduta: tempi a terra e spostamento decidono il gioco, restano quelle del pacchetto essenziale |
| 108_Defense_Jump_Fall_Reaction_02_R | 2.20 | 2.09 m (+1.94, +0.78) | 0 | no | scartata | altra caduta: tempi a terra e spostamento decidono il gioco, restano quelle del pacchetto essenziale |
| 109_Defense_Jump_Fall_Reaction_03 | 1.67 | 2.06 m (-2.06, -0.02) | 0 | no | scartata | inciampo senza caduta: nessuna situazione di gioco lo chiede |
| 264_Hit_Reaction_00 | 1.37 | 1.06 m (-1.06, -0.10) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 265_Hit_Reaction_90 | 1.43 | 2.29 m (+0.49, +2.24) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 266_Hit_Reaction_180 | 2.00 | 2.37 m (+2.37, -0.07) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 267_Hit_Reaction_270 | 1.43 | 2.29 m (+0.49, -2.24) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 268_Hit_Weak_Reaction_00 | 1.37 | 1.06 m (-1.06, -0.10) | 0 | no | scartata | stesso movimento di 264_Hit_Reaction_00 |
| 269_Hit_Weak_Reaction_90 | 1.43 | 2.29 m (+0.49, +2.24) | 0 | no | scartata | stesso movimento di 265_Hit_Reaction_90 |
| 270_Hit_Weak_Reaction_180 | 2.00 | 2.37 m (+2.37, -0.07) | 0 | no | scartata | stesso movimento di 266_Hit_Reaction_180 |
| 271_Hit_Weak_Reaction_270 | 1.43 | 2.29 m (+0.49, -2.24) | 0 | no | scartata | stesso movimento di 267_Hit_Reaction_270 |
| 640_Small_Hit_Reaction_00 | 0.73 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 641_Small_Hit_Reaction_90 | 0.73 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 642_Small_Hit_Reaction_180 | 0.87 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 643_Small_Hit_Reaction_270 | 0.73 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 697_Stand_Hit_Reaction_00 | 16.00 | 0.77 m (-0.75, +0.18) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 698_Stand_Hit_Reaction_90 | 1.00 | 1.00 m (+0.06, +1.00) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 699_Stand_Hit_Reaction_180 | 1.00 | 0.97 m (+0.97, +0.07) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 700_Stand_Hit_Reaction_270 | 1.00 | 1.00 m (+0.06, -1.00) | 0 | no | scartata | colpito dalla palla o da un avversario: meccanica non presente |
| 734_Tackles_Reaction_L_01 | 1.17 | 3.85 m (+3.79, +0.69) | 0 | no | scartata | inciampo senza caduta: nessuna situazione di gioco lo chiede |
| 735_Tackles_Reaction_R_01 | 1.17 | 3.85 m (+3.79, -0.69) | 0 | no | scartata | inciampo senza caduta: nessuna situazione di gioco lo chiede |
| 741_Tackles01_Reaction_02 | 7.13 | 6.27 m (+6.25, +0.59) | 0 | no | scartata | caduta di 7 secondi, troppo lunga per la partita |
| 742_Tackles01_Reaction_03 | 2.77 | 4.19 m (+3.93, +1.46) | -248 | no | core | caduta dopo un fallo, a terra, rialzo - tutti i livelli, all'avvio |

## Portiere

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 336_Keeper_Ball_Center_High_01 | 2.53 | 0.61 m (+0.61, -0.08) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 337_Keeper_Ball_Center_Low_01 | 1.73 | 2.25 m (+2.25, -0.08) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 338_Keeper_Ball_Center_Medium_01 | 3.10 | 1.01 m (+0.96, -0.31) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 339_Keeper_Ball_Center_Medium_02 | 3.97 | 1.07 m (+0.83, -0.67) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 340_Keeper_Ball_Dive_Left_Low_01 | 3.67 | 3.16 m (+2.84, +1.40) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 341_Keeper_Ball_Dive_Right_Low_01 | 3.67 | 3.16 m (+2.84, -1.40) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 342_Keeper_Ball_Kick_01 | 2.67 | 2.88 m (+2.81, -0.63) | 0 | no | core | rinvio al volo - tutti i livelli, all'avvio |
| 343_Keeper_Ball_Left01_High_01 | 3.00 | 2.36 m (+1.01, +2.13) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 344_Keeper_Ball_Left01_Low_01 | 2.63 | 1.44 m (+1.06, +0.97) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 345_Keeper_Ball_Left01_Medium_01 | 1.67 | 3.09 m (+2.18, +2.19) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 346_Keeper_Ball_Right01_High_01 | 3.00 | 2.36 m (+1.01, -2.13) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 347_Keeper_Ball_Right01_Low_01 | 2.63 | 1.44 m (+1.06, -0.97) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 348_Keeper_Ball_Right01_Medium_01 | 1.67 | 3.09 m (+2.18, -2.19) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 349_Keeper_Ball_Run_00 | 0.73 | 2.02 m (+2.02, -0.00) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 350_Keeper_Ball_Run_45 | 0.73 | 2.02 m (+1.43, +1.43) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 351_Keeper_Ball_Run_90 | 0.73 | 2.19 m (+0.00, +2.19) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 352_Keeper_Ball_Run_135 | 0.73 | 1.36 m (-0.96, +0.96) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 353_Keeper_Ball_Run_180 | 0.73 | 1.36 m (-1.36, -0.00) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 354_Keeper_Ball_Run_225 | 0.73 | 1.36 m (-0.96, -0.96) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 355_Keeper_Ball_Run_270 | 0.73 | 2.19 m (+0.00, -2.19) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 356_Keeper_Ball_Run_315 | 0.73 | 2.02 m (+1.43, -1.43) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 357_Keeper_Ball_Stand01 | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | core | portiere con la palla in mano - tutti i livelli, all'avvio |
| 358_Keeper_Ball_Throw_01 | 2.20 | 1.46 m (+1.46, -0.06) | 0 | no | core | rinvio con le mani - tutti i livelli, all'avvio |
| 359_Keeper_Ball_Walk_00 | 1.00 | 1.52 m (+1.52, -0.00) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 360_Keeper_Ball_Walk_45 | 1.00 | 1.52 m (+1.08, +1.08) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 361_Keeper_Ball_Walk_90 | 1.00 | 1.45 m (-0.00, +1.45) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 362_Keeper_Ball_Walk_135 | 1.00 | 1.40 m (-0.99, +0.99) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 363_Keeper_Ball_Walk_180 | 1.00 | 1.40 m (-1.40, -0.00) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 364_Keeper_Ball_Walk_225 | 1.00 | 1.40 m (-0.99, -0.99) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 365_Keeper_Ball_Walk_270 | 1.00 | 1.45 m (+0.00, -1.45) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 366_Keeper_Ball_Walk_315 | 1.00 | 1.52 m (+1.08, -1.08) | 0 | no | scartata | il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede |
| 367_Keeper_BallKeeping_Stand01 | 3.50 | 0.00 m (+0.00, -0.00) | 0 | no | more | portiere con la palla in mano - alto all'avvio, medio in partita |
| 368_Keeper_jog_Step_00 | 0.40 | 1.15 m (+1.15, +0.00) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 369_Keeper_jog_Step_45 | 0.40 | 1.15 m (+0.81, +0.81) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 370_Keeper_jog_Step_90 | 0.40 | 0.86 m (-0.00, +0.86) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 371_Keeper_jog_Step_135 | 0.47 | 1.35 m (-0.96, +0.96) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 372_Keeper_jog_Step_180 | 0.47 | 1.35 m (-1.35, -0.00) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 373_Keeper_jog_Step_225 | 0.47 | 1.35 m (-0.96, -0.96) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 374_Keeper_jog_Step_270 | 0.40 | 0.86 m (-0.00, -0.86) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 375_Keeper_jog_Step_315 | 0.40 | 1.15 m (+0.81, -0.81) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 376_Keeper_NormalStand | 4.27 | 0.00 m (+0.00, -0.00) | 0 | si' | core | portiere fermo - tutti i livelli, all'avvio |
| 377_Keeper_Punching_Back_Step | 1.20 | 1.81 m (-1.62, +0.82) | 0 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 378_Keeper_Punching_Center_Stand | 0.80 | 0.09 m (+0.09, +0.01) | 0 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 379_Keeper_Punching_Center_Step | 1.07 | 2.40 m (+2.40, -0.11) | 0 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 380_Keeper_Punching_Left_Stand | 1.20 | 0.26 m (+0.26, -0.02) | 0 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 381_Keeper_Punching_Left_Step | 1.00 | 1.99 m (+0.74, -1.84) | -91 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 382_Keeper_Punching_Right_Stand | 1.20 | 0.26 m (+0.26, -0.02) | 0 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 383_Keeper_Punching_Right_Step | 1.00 | 1.99 m (+0.74, +1.84) | +91 | no | core | uscita di pugno - tutti i livelli, all'avvio |
| 384_Keeper_Save_Center_High_01 | 1.50 | 0.35 m (+0.34, +0.09) | +42 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 385_Keeper_Save_Center_Low_01 | 1.20 | 1.57 m (+1.55, +0.21) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 386_Keeper_Save_Center_Low_02 | 1.00 | 0.41 m (+0.41, -0.03) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 387_Keeper_Save_Center_Medium_01 | 1.73 | 0.74 m (+0.14, +0.72) | +32 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 388_Keeper_Save_Center_Medium_03 | 0.80 | 1.15 m (+1.06, -0.43) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 389_Keeper_Save_Center_Medium_L01 | 1.73 | 0.74 m (+0.14, +0.72) | +32 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 390_Keeper_Save_Center_Medium_R01 | 1.73 | 0.74 m (+0.14, -0.72) | -32 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 391_Keeper_Save_Left01_High_01 | 1.50 | 0.37 m (+0.28, +0.24) | +45 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 392_Keeper_Save_Left01_High_02 | 1.90 | 2.12 m (-0.08, +2.11) | -10 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 393_Keeper_Save_Left01_Low_01 | 1.83 | 0.71 m (+0.28, +0.66) | -4 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 394_Keeper_Save_Left01_Low_02 | 0.93 | 0.09 m (+0.09, +0.02) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 395_Keeper_Save_Left01_Low_03 | 0.80 | 0.62 m (+0.16, +0.59) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 396_Keeper_Save_Left01_Low_04 | 1.63 | 0.26 m (+0.25, -0.08) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 397_Keeper_Save_Left01_Medium_01 | 2.33 | 0.48 m (+0.23, +0.43) | +12 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 398_Keeper_Save_Left01_Medium_02 | 1.90 | 2.12 m (-0.08, +2.11) | -10 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 399_Keeper_Save_Left01_Medium_03 | 1.00 | 0.17 m (+0.04, +0.16) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 400_Keeper_Save_Left01_Medium_04 | 2.33 | 0.48 m (+0.23, +0.43) | +12 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 401_Keeper_Save_Left01_Medium_05 | 1.47 | 0.00 m (+0.00, -0.00) | 0 | si' | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 402_Keeper_Save_Left02_High_01 | 3.13 | 2.95 m (+0.54, +2.90) | +13 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 403_Keeper_Save_Left02_Low_01 | 2.97 | 2.40 m (+0.35, +2.38) | +72 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 404_Keeper_Save_Left02_Medium_01 | 2.47 | 2.90 m (+0.34, +2.88) | +90 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 405_Keeper_Save_Left02_Medium_02 | 2.43 | 3.56 m (-0.16, +3.55) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 406_Keeper_Save_Right01_High_01 | 1.50 | 0.37 m (+0.28, -0.24) | -45 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 407_Keeper_Save_Right01_High_02 | 1.90 | 2.12 m (-0.08, -2.11) | +10 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 408_Keeper_Save_Right01_Low_01 | 1.83 | 0.71 m (+0.28, -0.66) | +4 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 409_Keeper_Save_Right01_Low_02 | 0.93 | 0.09 m (+0.09, -0.02) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 410_Keeper_Save_Right01_Low_03 | 0.80 | 0.62 m (+0.16, -0.59) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 411_Keeper_Save_Right01_Low_04 | 1.63 | 0.26 m (+0.25, +0.08) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 412_Keeper_Save_Right01_Medium_01 | 2.33 | 0.48 m (+0.23, -0.43) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 413_Keeper_Save_Right01_Medium_02 | 1.90 | 2.12 m (-0.08, -2.11) | +10 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 414_Keeper_Save_Right01_Medium_03 | 1.00 | 0.17 m (+0.04, -0.16) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 415_Keeper_Save_Right01_Medium_04 | 2.33 | 0.48 m (+0.16, -0.46) | -25 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 416_Keeper_Save_Right01_Medium_05 | 1.47 | 0.00 m (+0.00, -0.00) | 0 | si' | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 417_Keeper_Save_Right02_High_01 | 3.13 | 2.95 m (+0.54, -2.90) | -14 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 418_Keeper_Save_Right02_Low_01 | 2.97 | 2.40 m (+0.35, -2.38) | -72 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 419_Keeper_Save_Right02_Medium_01 | 2.47 | 2.90 m (+0.34, -2.88) | -90 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 420_Keeper_Save_Right02_Medium_02 | 2.43 | 3.56 m (-0.16, -3.55) | 0 | no | core | parata di respinta (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 421_Keeper_SlidingCatch_Left | 1.83 | 0.71 m (+0.28, +0.66) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 422_Keeper_SlidingCatch_Right | 1.83 | 0.71 m (+0.28, -0.66) | 0 | no | core | presa (punto dal Ball_Bone) - tutti i livelli, all'avvio |
| 423_Keeper_Special_Akka | 0.83 | 1.10 m (+1.05, +0.34) | 0 | no | scartata | gesti speciali (rovesciata, esultanza) senza meccanica |
| 424_Keeper_Special_Overhead_kick_02 | 3.77 | 0.81 m (-0.81, +0.05) | +90 | no | scartata | gesti speciali (rovesciata, esultanza) senza meccanica |
| 425_Keeper_Special_Volley_Shoot_Stand_L_02 | 2.33 | 0.28 m (-0.28, -0.04) | +90 | no | scartata | gesti speciali (rovesciata, esultanza) senza meccanica |
| 426_Keeper_Special_Volley_Shoot_Stand_R_02 | 2.33 | 0.28 m (-0.28, +0.04) | -90 | no | scartata | gesti speciali (rovesciata, esultanza) senza meccanica |
| 427_Keeper_Sprint_Step_00 | 0.47 | 2.42 m (+2.42, +0.00) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 428_Keeper_Sprint_Step_45 | 0.47 | 2.42 m (+1.71, +1.71) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 429_Keeper_Sprint_Step_90 | 0.47 | 1.45 m (+0.00, +1.45) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 430_Keeper_Sprint_Step_135 | 0.43 | 1.75 m (-1.24, +1.24) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 431_Keeper_Sprint_Step_180 | 0.43 | 1.75 m (-1.75, -0.00) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 432_Keeper_Sprint_Step_225 | 0.43 | 1.75 m (-1.24, -1.24) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 433_Keeper_Sprint_Step_270 | 0.47 | 1.45 m (-0.00, -1.45) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 434_Keeper_Sprint_Step_315 | 0.47 | 2.42 m (+1.71, -1.71) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 435_Keeper_Walk_Step_00 | 0.50 | 0.41 m (+0.41, -0.00) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 436_Keeper_Walk_Step_45 | 0.50 | 0.41 m (+0.29, +0.29) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 437_Keeper_Walk_Step_90 | 0.50 | 0.52 m (+0.00, +0.52) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 438_Keeper_Walk_Step_135 | 0.50 | 0.41 m (-0.29, +0.29) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 439_Keeper_Walk_Step_180 | 0.50 | 0.41 m (-0.41, -0.00) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 440_Keeper_Walk_Step_225 | 0.50 | 0.41 m (-0.29, -0.29) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 441_Keeper_Walk_Step_270 | 0.50 | 0.52 m (+0.00, -0.52) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 442_Keeper_Walk_Step_315 | 0.50 | 0.41 m (+0.29, -0.29) | 0 | no | core | spostamenti del portiere - tutti i livelli, all'avvio |
| 443_Keeper_WarnStand | 1.77 | 0.00 m (+0.00, -0.00) | 0 | si' | core | portiere in guardia - tutti i livelli, all'avvio |

## Finte

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 533_Tricks | 1.00 | 3.44 m (+3.43, +0.30) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 534_Tricks | 1.93 | 3.35 m (+3.24, +0.86) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 535_Tricks | 1.30 | 2.78 m (+2.74, -0.44) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 536_Tricks | 1.27 | 1.48 m (+1.35, +0.60) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 537_Tricks | 2.33 | 1.51 m (-1.48, -0.31) | -180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 538_Tricks | 1.47 | 2.85 m (+2.76, +0.69) | +70 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 539_Tricks | 1.20 | 2.01 m (-1.94, +0.54) | +180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 540_Tricks | 0.73 | 2.02 m (+2.00, +0.24) | +45 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 541_Tricks | 0.57 | 1.76 m (+1.75, +0.24) | +45 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 542_Tricks | 0.57 | 1.76 m (+1.75, +0.24) | +45 | no | scartata | stesso movimento di 541_Tricks |
| 543_Tricks | 1.13 | 0.39 m (-0.13, +0.37) | +69 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 544_Tricks | 1.13 | 0.39 m (-0.13, +0.37) | +69 | no | scartata | stesso movimento di 543_Tricks |
| 545_Tricks | 0.80 | 0.84 m (+0.83, +0.13) | +21 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 546_Tricks | 0.80 | 0.84 m (+0.83, +0.13) | +21 | no | scartata | stesso movimento di 545_Tricks |
| 547_Tricks | 1.33 | 1.62 m (+1.61, +0.18) | -60 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 548_Tricks | 1.80 | 3.68 m (+3.67, -0.19) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 549_Tricks | 1.67 | 1.28 m (-0.96, +0.86) | -180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 550_Tricks | 1.07 | 0.04 m (+0.00, -0.04) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 551_Tricks | 5.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 552_Tricks | 1.80 | 3.68 m (+3.67, -0.19) | 0 | no | scartata | stesso movimento di 548_Tricks |
| 553_Tricks | 1.27 | 0.61 m (-0.61, +0.04) | +180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 554_Tricks | 2.50 | 4.78 m (+4.78, +0.10) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 555_Tricks | 1.87 | 3.74 m (+3.74, -0.01) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 556_Tricks | 2.03 | 3.74 m (+3.72, -0.38) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 557_Tricks | 0.87 | 3.60 m (+3.56, -0.55) | -360 | no | core | finta (roulette) - tutti i livelli, all'avvio |
| 558_Tricks | 1.27 | 0.61 m (-0.61, +0.04) | +180 | no | scartata | stesso movimento di 553_Tricks |
| 559_Tricks | 1.53 | 3.23 m (+3.18, +0.58) | +44 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 560_Tricks | 1.33 | 0.37 m (-0.03, -0.37) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 561_Tricks | 1.17 | 3.87 m (+3.74, -1.01) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 562_Tricks | 0.80 | 0.56 m (+0.54, +0.14) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 563_Tricks | 0.90 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 564_Tricks | 1.63 | 0.60 m (+0.36, +0.47) | +180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 565_Tricks | 0.83 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 566_Tricks | 0.93 | 1.23 m (+0.24, -1.20) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 567_Tricks | 0.90 | 2.97 m (+2.85, -0.86) | -30 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 568_Tricks | 0.90 | 3.17 m (+3.03, +0.93) | +28 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 569_Tricks | 1.13 | 3.37 m (+3.36, -0.32) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 570_Tricks | 1.33 | 0.91 m (+0.91, +0.08) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 571_Tricks | 1.07 | 2.79 m (+2.36, +1.50) | +84 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 572_Tricks | 1.90 | 1.93 m (-1.87, -0.48) | -180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 573_Tricks | 1.27 | 3.73 m (+3.31, +1.72) | +45 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 574_Tricks | 0.93 | 2.15 m (+2.15, +0.05) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 575_Tricks | 1.47 | 4.77 m (+4.76, -0.08) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 576_Tricks | 1.13 | 1.32 m (+1.18, +0.59) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 577_Tricks | 0.80 | 2.58 m (+1.98, -1.65) | -38 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 578_Tricks | 0.87 | 2.29 m (+2.28, +0.20) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 579_Tricks | 1.43 | 1.22 m (+0.94, +0.77) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 580_Tricks | 1.17 | 4.04 m (+4.02, -0.40) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 581_Tricks | 1.07 | 3.21 m (+3.19, -0.39) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 582_Tricks | 1.07 | 2.38 m (+2.34, +0.43) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 583_Tricks | 1.97 | 0.55 m (+0.50, -0.24) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 584_Tricks | 1.60 | 1.01 m (+0.91, +0.45) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 585_Tricks | 1.67 | 3.90 m (+3.90, +0.07) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 586_Tricks | 1.13 | 4.77 m (+4.76, +0.15) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 587_Tricks | 0.83 | 3.56 m (+3.47, -0.80) | -360 | no | scartata | altra roulette: il movimento della finta decide il gioco, resta quella del pacchetto essenziale |
| 588_Tricks | 0.87 | 3.92 m (+3.61, -1.51) | -360 | no | scartata | altra roulette: il movimento della finta decide il gioco, resta quella del pacchetto essenziale |
| 589_Tricks | 1.67 | 0.41 m (-0.33, +0.25) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 590_Tricks | 2.00 | 5.15 m (+5.06, -0.92) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 591_Tricks | 5.10 | 1.93 m (+1.89, +0.39) | +90 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 592_Tricks | 3.77 | 0.81 m (-0.81, +0.05) | +90 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 593_Tricks | 2.27 | 0.77 m (+0.76, -0.12) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 594_Tricks | 0.57 | 1.93 m (+1.52, +1.18) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 595_Tricks | 1.27 | 2.59 m (+1.09, -2.35) | -32 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 596_Tricks | 0.97 | 2.30 m (+2.12, +0.89) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 597_Tricks | 0.93 | 3.93 m (+3.93, -0.00) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 598_Tricks | 1.07 | 2.96 m (+2.96, -0.04) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 599_Tricks | 0.73 | 1.61 m (+1.61, -0.06) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 600_Tricks | 0.97 | 0.95 m (+0.92, +0.26) | -47 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 601_Tricks | 2.50 | 2.74 m (+2.74, +0.01) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 602_Tricks | 1.37 | 1.06 m (-1.06, -0.10) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 603_Tricks | 1.43 | 2.29 m (+0.49, +2.24) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 604_Tricks | 1.43 | 2.29 m (+0.49, -2.24) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 605_Tricks | 2.27 | 1.52 m (+1.52, +0.04) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 606_Tricks | 1.03 | 1.14 m (+1.13, +0.11) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 607_Tricks | 1.47 | 3.79 m (+2.98, +2.33) | +45 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 608_Tricks | 1.43 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 609_Tricks | 0.83 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 610_Tricks | 0.93 | 0.76 m (-0.70, +0.29) | +180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 611_Tricks | 1.00 | 0.45 m (-0.28, +0.36) | +180 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 612_Tricks | 0.57 | 2.84 m (+2.84, -0.01) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 613_Tricks | 0.57 | 2.84 m (+2.84, -0.01) | 0 | no | scartata | stesso movimento di 612_Tricks |
| 614_Tricks | 0.57 | 2.84 m (+2.84, -0.01) | 0 | no | scartata | stesso movimento di 612_Tricks |
| 615_Tricks | 0.57 | 2.84 m (+2.84, -0.01) | 0 | no | scartata | stesso movimento di 612_Tricks |
| 616_Tricks | 0.93 | 3.35 m (+2.81, +1.83) | +41 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 617_Tricks | 0.83 | 2.56 m (+1.89, -1.72) | -64 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 618_Tricks | 1.13 | 3.40 m (+3.40, +0.13) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 619_Tricks | 0.93 | 2.93 m (+2.51, -1.51) | -360 | no | scartata | altra roulette: il movimento della finta decide il gioco, resta quella del pacchetto essenziale |
| 620_Tricks | 2.00 | 5.15 m (+5.06, -0.92) | 0 | no | scartata | stesso movimento di 590_Tricks |
| 621_Tricks | 2.50 | 4.78 m (+4.78, +0.10) | 0 | no | scartata | stesso movimento di 554_Tricks |
| 622_Tricks | 7.13 | 6.27 m (+6.25, +0.59) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 623_Tricks | 0.80 | 0.83 m (+0.82, +0.13) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 624_Tricks | 1.17 | 1.89 m (+1.88, -0.21) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 625_Tricks | 0.87 | 3.60 m (+3.56, -0.55) | -360 | no | scartata | stesso movimento di 557_Tricks |
| 626_Tricks | 0.80 | 1.84 m (+1.37, +1.23) | -45 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 627_Tricks | 1.37 | 3.03 m (+3.01, -0.33) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 628_Tricks | 1.47 | 1.74 m (+1.74, +0.03) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 629_Tricks | 2.00 | 4.88 m (+4.75, -1.10) | 0 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 630_Tricks | 0.83 | 3.19 m (+2.97, +1.17) | -389 | no | scartata | altra roulette: il movimento della finta decide il gioco, resta quella del pacchetto essenziale |
| 631_Tricks | 1.47 | 1.77 m (+0.91, -1.52) | -74 | no | scartata | mossa diversa dalla roulette, l'unica finta del gioco |
| 632_TricksReaction_StunTest | 7.13 | 6.27 m (+6.25, +0.59) | 0 | no | scartata | reazione di prova, non una finta |

## Calci piazzati

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 021_Ball_Avoid_Jump | 0.67 | 1.96 m (+1.96, +0.02) | 0 | no | core | salto della barriera - tutti i livelli, all'avvio |
| 444_KickOff_135 | 1.83 | 0.56 m (+0.15, -0.53) | -180 | no | core | calcio d'inizio - tutti i livelli, all'avvio |
| 445_KickOff_180 | 1.83 | 0.56 m (+0.53, -0.19) | -180 | no | core | calcio d'inizio - tutti i livelli, all'avvio |
| 446_KickOff_225 | 1.83 | 1.01 m (+0.80, +0.62) | +180 | no | core | calcio d'inizio - tutti i livelli, all'avvio |

## Esultanze

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 033_Celebration_01_ForSequence | 8.33 | 0.00 m (+0.00, -0.00) | 0 | si' | extra | esultanza dopo il gol - alto all'avvio, medio in partita |
| 034_Celebration_02_ForSequence | 6.33 | 0.00 m (+0.00, -0.00) | 0 | si' | extra | esultanza dopo il gol - alto all'avvio, medio in partita |
| 035_Ceremony_001 | 8.33 | 2.86 m (-2.83, +0.38) | 0 | no | extra | esultanza dopo il gol - alto all'avvio, medio in partita |
| 036_Ceremony_002 | 6.33 | 2.20 m (-2.17, -0.34) | 0 | no | extra | esultanza dopo il gol - alto all'avvio, medio in partita |
| 038_Ceremony | 3.00 | 3.82 m (+3.66, -1.08) | -180 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 039_Ceremony | 5.17 | 9.12 m (+9.12, +0.03) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 040_Ceremony | 8.40 | 6.06 m (+5.34, +2.87) | +228 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 041_Ceremony | 11.00 | 9.29 m (+6.73, +6.39) | -177 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 042_Ceremony | 6.00 | 5.71 m (+5.71, -0.03) | +3 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 043_Ceremony | 8.93 | 4.58 m (+4.56, -0.48) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 044_Ceremony | 10.50 | 5.21 m (+5.21, +0.07) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 045_Ceremony | 8.60 | 2.55 m (+2.48, -0.60) | +10 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 046_Ceremony | 12.20 | 3.03 m (+3.01, -0.33) | +368 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 047_Ceremony | 8.67 | 3.48 m (+3.38, -0.85) | +19 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 048_Ceremony | 9.43 | 3.11 m (+2.93, +1.04) | +358 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 049_Ceremony | 11.77 | 2.57 m (+2.57, +0.05) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 050_Ceremony | 10.60 | 2.41 m (+2.39, +0.36) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 051_Ceremony | 11.50 | 3.00 m (+2.99, -0.26) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 052_Ceremony | 13.20 | 1.42 m (+1.41, -0.15) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 053_Ceremony | 9.93 | 4.62 m (+4.62, +0.08) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 054_Ceremony | 12.60 | 5.04 m (+5.04, -0.06) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 055_Ceremony | 9.77 | 2.56 m (+2.54, -0.28) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 056_Ceremony | 9.53 | 1.96 m (+1.84, -0.70) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 057_Ceremony | 9.83 | 2.71 m (+2.66, -0.53) | 0 | no | scartata | esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa |
| 058_Ceremony | 5.17 | 0.00 m (+0.00, -0.00) | 0 | si' | extra | esultanza dopo il gol - alto all'avvio, medio in partita |
| 059_Ceremony | 10.50 | 0.00 m (+0.00, -0.00) | 0 | si' | extra | esultanza dopo il gol - alto all'avvio, medio in partita |

## Duelli di corpo

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 062_charging_L_Hit | 1.10 | 2.96 m (+2.49, -1.61) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 063_charging_R_Hit | 1.27 | 3.33 m (+2.78, +1.83) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 064_charging01_L | 1.53 | 3.23 m (+3.18, -0.58) | -44 | no | scartata | spinte e spallate: meccanica non presente |
| 065_charging01_R | 1.53 | 3.23 m (+3.18, +0.58) | +44 | no | scartata | spinte e spallate: meccanica non presente |
| 066_charging02_L | 1.13 | 3.05 m (+3.02, -0.39) | -43 | no | scartata | spinte e spallate: meccanica non presente |
| 067_charging02_R | 1.13 | 3.05 m (+3.02, +0.39) | +43 | no | scartata | spinte e spallate: meccanica non presente |
| 068_Defender_Collision_Shoulder_Inside_L | 0.57 | 2.27 m (+2.19, +0.60) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 069_Defender_Collision_Shoulder_Inside_R | 0.57 | 2.27 m (+2.19, -0.60) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 070_Defender_jump_Push_lose_Back | 1.40 | 1.58 m (+1.57, -0.12) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 071_Defender_jump_Push_lose_Front | 1.40 | 1.32 m (-1.32, +0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 072_Defender_jump_Push_lose_Left01 | 1.43 | 1.05 m (+0.14, +1.04) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 073_Defender_jump_Push_lose_Left02 | 1.40 | 1.18 m (+0.25, +1.16) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 074_Defender_jump_Push_lose_Right01 | 1.43 | 1.05 m (+0.14, -1.04) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 075_Defender_jump_Push_lose_Right02 | 1.40 | 1.18 m (+0.25, -1.16) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 076_Defender_Left_Push_01 | 0.97 | 4.84 m (+4.84, -0.02) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 077_Defender_Left_Push_lose_01 | 2.73 | 12.28 m (+12.28, +0.06) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 078_Defender_Left_Push_lose_03 | 1.00 | 3.17 m (+2.99, +1.04) | +11 | no | scartata | spinte e spallate: meccanica non presente |
| 079_Defender_Left_Push_Win_01 | 0.73 | 3.57 m (+3.55, -0.38) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 080_Defender_Right_Push_01 | 0.97 | 4.84 m (+4.84, +0.02) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 081_Defender_Right_Push_lose_01 | 2.73 | 12.28 m (+12.28, -0.06) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 082_Defender_Right_Push_lose_03 | 1.00 | 3.17 m (+2.99, -1.04) | -11 | no | scartata | spinte e spallate: meccanica non presente |
| 083_Defender_Right_Push_Win_01 | 0.73 | 3.57 m (+3.55, +0.38) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 690_Stand_Defender_Left_Push_01 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 691_Stand_Defender_Right_Push_01 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 692_Stand_Hand_Push_up | 0.40 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 693_Stand_Hand_Push_up_L | 0.80 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 694_Stand_Hand_Push_up_R | 0.80 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 701_Stand_Shoulder_Push_up_L | 0.87 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 702_Stand_Shoulder_Push_up_R | 0.87 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 703_Stand_Striker_Back_Left_Push_01 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 704_Stand_Striker_Back_Left_Push_02 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 705_Stand_Striker_Back_Left_Push_02_Attack | 0.77 | 0.06 m (-0.06, +0.01) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 706_Stand_Striker_Back_Right_Push_01 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 707_Stand_Striker_Back_Right_Push_02 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 708_Stand_Striker_Back_Right_Push_02_Attack | 0.77 | 0.06 m (-0.06, -0.01) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 709_Stand_Striker_Ball_Back_Left_Push_02_Attack | 0.77 | 0.06 m (-0.06, +0.01) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 710_Stand_Striker_Ball_Back_Right_Push_02_Attack | 0.77 | 0.06 m (-0.06, -0.01) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 711_Stand_Striker_Ball_Left_Push_03_Attack | 0.77 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 712_Stand_Striker_Ball_Right_Push_03_Attack | 0.77 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 713_Stand_Striker_Left_Push_03 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 714_Stand_Striker_Left_Push_03_Attack | 0.77 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 715_Stand_Striker_Left_Push_04 | 2.00 | 0.00 m (+0.00, +0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 716_Stand_Striker_Right_Push_03 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 717_Stand_Striker_Right_Push_03_Attack | 0.77 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 718_Stand_Striker_Right_Push_04 | 2.00 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 722_Striker_Collision_Foot_Inside_L | 0.70 | 3.17 m (+3.10, +0.67) | +5 | no | scartata | spinte e spallate: meccanica non presente |
| 723_Striker_Collision_Foot_Inside_R | 0.70 | 3.17 m (+3.10, -0.67) | -5 | no | scartata | spinte e spallate: meccanica non presente |
| 724_Striker_Collision_Lose_L | 1.33 | 5.21 m (+3.55, +3.81) | +84 | no | scartata | spinte e spallate: meccanica non presente |
| 725_Striker_Collision_Lose_R | 1.33 | 5.21 m (+3.55, -3.81) | -84 | no | scartata | spinte e spallate: meccanica non presente |
| 726_Striker_Collision_Win_L | 0.60 | 2.69 m (+2.68, -0.25) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 727_Striker_Collision_Win_R | 0.60 | 2.69 m (+2.68, +0.25) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 728_Striker_Left_Push_01 | 0.97 | 4.79 m (+4.79, -0.06) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 729_Striker_Left_Push_lose_01 | 2.13 | 7.80 m (+6.80, +3.81) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 730_Striker_Left_Push_Win_01 | 0.80 | 3.66 m (+3.65, +0.26) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 731_Striker_Right_Push_01 | 0.97 | 4.79 m (+4.79, +0.06) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 732_Striker_Right_Push_lose_01 | 2.13 | 7.80 m (+6.80, -3.81) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 733_Striker_Right_Push_Win_01 | 1.07 | 4.91 m (+4.89, -0.45) | 0 | no | scartata | spinte e spallate: meccanica non presente |
| 861_Upper_body_Hand_Push_up | 0.40 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 862_Upper_body_Hand_Push_up_L | 0.83 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |
| 863_Upper_body_Hand_Push_up_R | 0.83 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | spinte e spallate: meccanica non presente |

## Schivate

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 001_Avoid_Fwd_Jump_01 | 1.13 | 4.77 m (+4.76, +0.15) | 0 | no | scartata | schivare un intervento: meccanica non presente |
| 002_Avoid_Fwd_Left_01 | 1.27 | 4.38 m (+4.35, +0.48) | 0 | no | scartata | schivare un intervento: meccanica non presente |
| 003_Avoid_Fwd_Right_01 | 1.10 | 4.47 m (+4.46, -0.33) | 0 | no | scartata | schivare un intervento: meccanica non presente |
| 019_Ball_Avoid_Jogging_L | 0.67 | 0.82 m (+0.52, +0.64) | +96 | no | scartata | schivare un intervento: meccanica non presente |
| 020_Ball_Avoid_Jogging_R | 0.67 | 0.82 m (+0.52, -0.64) | -96 | no | scartata | schivare un intervento: meccanica non presente |
| 022_Ball_Avoid_Stand | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | schivare un intervento: meccanica non presente |
| 023_Ball_Avoid_Stand_L | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | schivare un intervento: meccanica non presente |
| 024_Ball_Avoid_Stand_R | 0.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | schivare un intervento: meccanica non presente |

## Gesti

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 290_Jogging_avoid_L | 1.00 | 3.48 m (+3.48, +0.01) | 0 | no | scartata | chiamata della palla e schivate in corsa: meccanica non presente |
| 291_Jogging_avoid_R | 1.00 | 3.48 m (+3.48, -0.01) | 0 | no | scartata | chiamata della palla e schivate in corsa: meccanica non presente |
| 292_Jogging_Hand_up_L | 0.60 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | chiamata della palla e schivate in corsa: meccanica non presente |
| 293_Jogging_Hand_up_R | 0.60 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | chiamata della palla e schivate in corsa: meccanica non presente |
| 695_Stand_Hand_up_L | 5.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | chiamata della palla e schivate in corsa: meccanica non presente |
| 696_Stand_Hand_up_R | 5.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | chiamata della palla e schivate in corsa: meccanica non presente |

## Cerimonie

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 037_02_ForSequence | 5.17 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | sequenza di fine partita, non in partita |
| 060_Ceremony_EndGame_lose_01 | 6.13 | 0.58 m (-0.57, -0.08) | +85 | no | scartata | sequenza di fine partita, non in partita |
| 061_Ceremony_EndGame_win_01 | 3.37 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | sequenza di fine partita, non in partita |
| 208_EndGame_lose_01_ForSequence | 6.13 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | sequenza di fine partita, non in partita |

## Riscaldamento

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 898_Warming_Up | 14.87 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 899_Warming_Up | 17.33 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 900_Warming_Up | 18.63 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 901_Warming_Up | 12.87 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 902_Warming_Up | 15.50 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 903_Warming_Up | 12.60 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 904_Warming_Up | 16.47 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 905_Warming_Up_08 | 15.17 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 906_Warming_Up_09 | 16.93 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |
| 907_Warming_Up_10 | 17.50 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | prepartita, non in partita |

## Menu e pose

| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |
|---|---:|---|---:|---|---|---|
| 209_Extra_01_Lobby_Idle | 6.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 210_Extra_02_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 211_Extra_03_Select_idle | 6.33 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 212_Extra_04_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 213_Extra_05_Lobby_Action | 5.33 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 214_Extra_06_Lobby_Idle | 8.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 215_Extra_07_Lobby_Stand | 2.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 216_Extra_08_Lobby_Idle | 6.17 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 217_Extra_09_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 218_Extra_10_Select_idle | 7.70 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 219_Extra_11_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 220_Extra_12_Lobby_Idle | 6.27 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 221_Extra_13_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 222_Extra_14_Select_idle | 8.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 223_Extra_15_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | stesso movimento di 221_Extra_13_Lobby_Stand |
| 224_Extra_16_Lobby_idle | 5.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 225_Extra_17_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 226_Extra_18_Select_idle | 6.47 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 227_Extra_19_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 228_Extra_20_Lobby_Idle | 7.37 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 229_Extra_21_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 230_Extra_22_Select_idle | 10.43 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 231_Extra_23_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 232_Extra_24_Lobby_Idle | 5.60 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 233_Extra_25_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 234_Extra_26_Select_idle | 5.13 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 235_Extra_27_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 236_Extra_28_Lobby_Idle | 5.60 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 237_Extra_29_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 238_Extra_30_Select_idle | 8.83 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 239_Extra_31_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 240_Extra_32_Lobby_Idle | 9.33 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 241_Extra_33_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 242_Extra_34_Select_idle | 7.87 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 243_Extra_35_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 244_Extra_36_Lobby_Idle | 2.83 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 245_Extra_37_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 246_Extra_38_Select_Idle | 4.03 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 247_Extra_39_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 248_Extra_40_Lobby_idle | 6.47 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 249_Extra_41_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 250_Extra_42_Select_idle | 5.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 251_Extra_43_Select_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 252_Extra_44_Lobby_Action | 12.33 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 253_Extra_45_Lobby_Idle | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 254_Extra_46_Lobby_Stand | 3.20 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 255_Extra_reward | 6.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | stesso movimento di 209_Extra_01_Lobby_Idle |
| 454_Lobby_Idle_01 | 2.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 455_Lobby_Idle_02 | 8.00 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 456_Lobby_Idle_Action_01 | 5.33 | 0.00 m (+0.00, -0.00) | 0 | no | scartata | pose da menu, fuori dalla partita |
| 457_Lobby_pose01 | 6.03 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 458_Lobby_pose02 | 2.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 459_Lobby_pose03 | 2.67 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 460_Lobby_pose04 | 6.03 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
| 461_Lobby_pose05 | 6.03 | 0.00 m (+0.00, -0.00) | 0 | si' | scartata | pose da menu, fuori dalla partita |
