"""Scrive docs/match3d-anims.md, il catalogo della libreria Studio33 Soccer 8.

Legge i metadati misurati in Blender (studio33_measure.py) e, se c'e', il
resoconto del build (quali clip sono finite nei pacchetti e a quale azione).
Uso: python tools/match3d/studio33_catalog.py
"""
import json, os, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from studio33_select import classify, duplicates, short, role_of, no_role_reason, plan  # noqa: E402

REPO = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(REPO, "src", "assets", "match3d", "source")
META = os.path.join(SRC, "studio33-measure.json")
BUILD = os.path.join(SRC, "studio33-build.json")
OUT = os.path.join(REPO, "docs", "match3d-anims.md")

ORDER = ["locomozione", "partenze e arresti", "svolte", "difesa", "conduzione", "passaggi",
         "lanci e cross", "tiri", "colpi di testa", "ricezioni", "intercetti", "contrasti",
         "scivolate", "cadute", "portiere", "finte", "calci piazzati", "esultanze",
         "duelli di corpo", "schivate", "gesti", "cerimonie", "riscaldamento", "menu e pose", "altro"]

# a cosa serve ogni ruolo nel gioco (src/js/match3d)
USE = {
    ("idle", "normal"): "fermo (blend tree, stile normale)", ("idle", "defense"): "fermo in guardia",
    ("idle", "dribble"): "fermo con la palla", ("idle", "keeper"): "portiere fermo",
    ("idle", "keeperBall"): "portiere con la palla in mano", ("ready", "keeper"): "portiere in guardia",
    ("loco", "normal"): "corsa (blend tree: velocita' e direzione)", ("loco", "defense"): "corsa in guardia davanti al portatore",
    ("loco", "dribble"): "conduzione (tocchi di palla dal Ball_Bone)", ("loco", "keeper"): "spostamenti del portiere",
    ("start", "normal"): "partenza da fermo", ("start", "dribble"): "partenza in conduzione",
    ("stop", "normal"): "arresto", ("stop", "dribble"): "arresto in conduzione",
    ("turn", "normal"): "inversione in corsa", ("turn", "dribble"): "inversione in conduzione",
    ("turnInPlace", "normal"): "giro sul posto", ("turnInPlace", "defense"): "giro sul posto in guardia",
    "pass": "passaggio e filtrante (contatto dal Ball_Bone)", "long": "cross e lancio (contatto dal Ball_Bone)",
    "shot": "tiro (contatto dal Ball_Bone)", "trap": "stop di palla e primo tocco orientato",
    "intercept": "intercetto", "tackle": "contrasto in piedi", "slide": "scivolata",
    "fall": "caduta dopo un fallo, a terra, rialzo", "header": "colpo di testa (contatto dal Ball_Bone)",
    "feint": "finta (roulette)", "kickoff": "calcio d'inizio", "wallJump": "salto della barriera",
    "celebrate": "esultanza dopo il gol", "gkSave": "parata di respinta (punto dal Ball_Bone)",
    "gkPunch": "uscita di pugno", "gkCatch": "presa (punto dal Ball_Bone)", "gkThrow": "rinvio con le mani",
    "gkKick": "rinvio al volo",
}
LEVELS = {"core": "tutti i livelli, all'avvio", "more": "alto all'avvio, medio in partita",
          "extra": "alto all'avvio, medio in partita"}

meta = json.load(open(META, encoding="utf-8"))
planned = {}
for e in plan(meta):
    planned.setdefault(e["src"], e)
build = json.load(open(BUILD, encoding="utf-8")) if os.path.exists(BUILD) else None
dups = duplicates(meta)
used = {}
if build:
    for c in build.get("clips", []):
        used[c["source"]] = c

rows = collections.defaultdict(list)
count = collections.Counter()
for name in sorted(meta):
    m = meta[name]
    cat, pack, why = classify(name, m)
    if name in dups:
        pack, why = None, "stesso movimento di %s" % dups[name]
    elif pack and name not in planned:
        pack, why = None, no_role_reason(name)
    elif pack:
        e = planned[name]
        pack = e["pack"]
        why = USE.get((e["role"], e["style"])) or USE.get(e["role"]) or why
        why += " - " + LEVELS[pack]
    inplace = m["dist"] < 0.1 and m["path"] < 0.25
    state = pack or "scartata"
    if build is not None and pack and name not in used:
        state, why = "scartata", "non entrata nel build"
    count[(cat, state)] += 1
    rm = "%.2f m (%+.2f, %+.2f)" % (m["dist"], m["net"]["fwd"], -m["net"]["right"])
    rot = "%+.0f" % m["yawLeft"] if abs(m["yawLeft"]) >= 1 else "0"
    rows[cat].append("| %s | %.2f | %s | %s | %s | %s | %s |" % (
        name.replace(".psa", "").replace("|", "/"), m["duration"], rm, rot, "si'" if inplace else "no", state, why))

lines = []
lines.append("# Catalogo animazioni Studio33 Soccer 8")
lines.append("")
lines.append("Generato da `tools/match3d/studio33_catalog.py` con le misure di "
             "`tools/match3d/studio33_measure.py` (Blender, sugli FBX originali).")
lines.append("La libreria non si ridistribuisce: FBX, GLB e JSON derivati restano fuori dal "
             "repository (`.gitignore`). Qui ci sono solo nomi e misure.")
lines.append("")
lines.append("## La libreria")
lines.append("")
lines.append("- 907 clip, ognuna in un FBX; le cartelle `generic` e `humonoid` contengono gli "
             "stessi file byte per byte (cambiano solo le impostazioni di importazione di Unity).")
lines.append("- 30 fps. Scheletro Biped di 3ds Max (`Root`, `Bip001`, `Bip001-Pelvis`, "
             "`Bip001-L-Thigh`...): 52 ossa animate, piu' 21 ossa di torsione e del viso "
             "che solo la mesh usa. Nessuna clip usa ossa diverse.")
lines.append("- Personaggi inclusi: `Footballer.fbx` e `goalkeeper.fbx` (stesso scheletro, "
             "73 ossa, circa 8.300 triangoli, una texture 1024 con la divisa dipinta, "
             "25 varianti per il giocatore e 25 per il portiere).")
lines.append("- Root motion nell'osso `Root`: traslazione sul piano e rotazione attorno alla "
             "verticale, a scatti netti (45, 90, 180 gradi) nelle svolte. Il bacino non "
             "porta rotazioni nette.")
lines.append("- L'osso `Ball_Bone` porta la palla: segue i tocchi in conduzione, sta fermo "
             "sul punto della parata nelle clip del portiere e sul punto d'impatto nei colpi di testa.")
lines.append("")
lines.append("## Convenzioni delle colonne")
lines.append("")
lines.append("- Durata: secondi, dal primo all'ultimo fotogramma.")
lines.append("- Root motion: distanza netta del `Root` e, fra parentesi, (avanti, sinistra) in "
             "metri nel riferimento del giocatore al primo fotogramma.")
lines.append("- Rotazione: gradi netti del `Root`, positivi verso sinistra (antiorario visto "
             "dall'alto), come nei nomi della libreria: `_90` e' sinistra, `_270` destra.")
lines.append("- In place: si' se la radice si sposta meno di 10 cm in tutto.")
lines.append("- Stato: `core` (pacchetto essenziale, caricato all'avvio a ogni livello), `more` "
             "(varieta': all'avvio al livello alto, durante la partita al medio, mai al basso), "
             "`extra` (esultanze: come `more`; al basso resta quella Mixamo) o `scartata`, "
             "con l'azione del gioco che la usa o il motivo.")
lines.append("- Le clip che decidono il gioco (tempi, spostamenti, parate, conduzione) sono "
             "tutte in `core`: fisica, IA e comandi sono identici a ogni livello.")
lines.append("")
lines.append("## Riepilogo")
lines.append("")
lines.append("| Categoria | core | more | extra | scartate |")
lines.append("|---|---:|---:|---:|---:|")
for cat in ORDER:
    if cat not in rows:
        continue
    lines.append("| %s | %d | %d | %d | %d |" % (cat, count[(cat, "core")], count[(cat, "more")], count[(cat, "extra")], count[(cat, "scartata")]))
tot = collections.Counter()
for (cat, st), n in count.items():
    tot[st] += n
lines.append("| **totale** | **%d** | **%d** | **%d** | **%d** |" % (tot["core"], tot["more"], tot["extra"], tot["scartata"]))
lines.append("")
lines.append("Per livello: basso %d clip (piu' 2 copie specchiate: finta e scivolata), medio e alto %d "
             "(piu' le 3 copie specchiate: finta, scivolata, arresto laterale destro)."
             % (tot["core"], tot["core"] + tot["more"] + tot["extra"]))
lines.append("")
for cat in ORDER:
    if cat not in rows:
        continue
    lines.append("## %s" % cat[0].upper() + cat[1:])
    lines.append("")
    lines.append("| Clip | Durata | Root motion | Rotazione | In place | Stato | Motivo |")
    lines.append("|---|---:|---|---:|---|---|---|")
    lines.extend(rows[cat])
    lines.append("")

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))
print("scritto", OUT, sum(len(v) for v in rows.values()), "clip")
