"""Categorie e selezione delle clip Studio33 Soccer 8.

Un solo posto per decidere quali clip entrano nel gioco: lo usano il build dei
pacchetti (studio33_build.py) e il catalogo (studio33_catalog.py).
classify(nome) -> (categoria, pacchetto, motivo)
  pacchetto: 'core' (caricato all'avvio), 'extra' (in secondo piano) o None (scartata)
"""
import re

# (espressione sul nome senza numero, categoria, pacchetto, motivo)
RULES = [
    # --- scartate: nessuna meccanica di gioco corrispondente, o doppioni
    (r"^(Extra_|Lobby_)", "menu e pose", None, "pose da menu, fuori dalla partita"),
    (r"^Warming_Up", "riscaldamento", None, "prepartita, non in partita"),
    (r"^(EndGame|Ceremony_EndGame|02_ForSequence)", "cerimonie", None, "sequenza di fine partita, non in partita"),
    (r"_edit$", "passaggi", None, "variante ritoccata di una clip gia' presa"),
    (r"^Keeper_Special", "portiere", None, "gesti speciali (rovesciata, esultanza) senza meccanica"),
    (r"^TricksReaction", "finte", None, "reazione di prova, non una finta"),
    (r"^(Avoid_|Ball_Avoid_(Jogging|Stand))", "schivate", None, "schivare un intervento: meccanica non presente"),
    (r"^(Block_|BlockShoot|BlockKick)", "difesa", None, "respinta del tiro col corpo: meccanica non presente"),
    (r"^(charging|Defender_|Striker_|Stand_Defender|Stand_Striker|Stand_Shoulder|Stand_Hand_Push|Upper_body)",
     "duelli di corpo", None, "spinte e spallate: meccanica non presente"),
    (r"^(Stand_Hand_up|Jogging_Hand_up|Jogging_avoid)", "gesti", None, "chiamata della palla e schivate in corsa: meccanica non presente"),
    (r"^Heel_pass", "passaggi", None, "colpo di tacco: comando non presente"),
    (r"^Jump_Pass", "passaggi", None, "passaggio in salto: comando non presente"),
    (r"^Tired_", "locomozione", None, "corsa stanca: la stanchezza non cambia l'animazione"),
    (r"^Dribble_NoBall", "conduzione", None, "conduzione mimata senza palla"),
    (r"^(Hit_Reaction|Hit_Weak|Small_Hit|Stand_Hit)", "cadute", None, "colpito dalla palla o da un avversario: meccanica non presente"),
    # --- extra: calci piazzati, esultanze
    (r"^KickOff_", "calci piazzati", "extra", "calcio d'inizio"),
    (r"^Ball_Avoid_Jump", "calci piazzati", "extra", "salto della barriera"),
    (r"^Celebration_", "esultanze", "extra", "esultanza dopo il gol"),
    (r"^Ceremony", "esultanze", "extra", "esultanza dopo il gol"),
    # --- core
    (r"^Keeper_(Ball_Throw|Ball_Kick)", "portiere", "core", "rinvio con le mani o al volo"),
    (r"^Keeper_(Ball_|BallKeeping)", "portiere", "core", "portiere con la palla in mano"),
    (r"^Keeper_(Save|SlidingCatch|Punching)", "portiere", "core", "parata"),
    (r"^Keeper_(NormalStand|WarnStand)", "portiere", "core", "portiere in guardia"),
    (r"^Keeper_(jog|Sprint|Walk)_Step", "portiere", "core", "spostamenti del portiere"),
    (r"^Tricks", "finte", "core", "finta"),
    (r"^Slide_", "scivolate", "core", "scivolata"),
    (r"^(Tackles_Stand|Jogging_Tackles|Run_Tackles|Small_Tackles)", "contrasti", "core", "contrasto in piedi"),
    (r"^(Tackles_Reaction|Tackles01_Reaction|Defense_Fall|Defense_Jump_Fall)", "cadute", "core", "caduta dopo un fallo"),
    (r"^Intercept_", "intercetti", "core", "intercetto di un passaggio"),
    (r"^Trapping_", "ricezioni", "core", "ricezione"),
    (r"^(Heading_|Jump_Head|Diving_Head)", "colpi di testa", "core", "colpo di testa"),
    (r"^(Shoot_|Low_Shoot|In_Place_Shoot|Volley_Shoot)", "tiri", "core", "tiro"),
    (r"^(lob_Pass|Long_Pass)", "lanci e cross", "core", "lancio e cross"),
    (r"^(Low_Pass|MED_Pass|Pass_Stand|Nonstop_Pass)", "passaggi", "core", "passaggio"),
    (r"^Dribble_.*(Start)", "conduzione", "core", "partenza in conduzione"),
    (r"^Dribble_.*(Stop)", "conduzione", "core", "arresto in conduzione"),
    (r"^Dribble_.*(Turn)", "conduzione", "core", "svolta in conduzione"),
    (r"^Dribble_", "conduzione", "core", "conduzione"),
    (r"^Defense_(Stand_Turn|Reaction)", "difesa", "core", "svolta in guardia"),
    (r"^Defense_Stand", "difesa", "core", "guardia"),
    (r"^Defense_", "difesa", "core", "corsa in guardia (jockey)"),
    (r"^Back steps", "locomozione", "core", "corsa all'indietro"),
    (r"^Sidestep_", "locomozione", "core", "passo laterale"),
    (r"(Start)", "partenze e arresti", "core", "partenza"),
    (r"(Stop)", "partenze e arresti", "core", "arresto"),
    (r"(Turn)", "svolte", "core", "svolta"),
    (r"^(Walk|Slow_Jogging|Jogging|FastJogging|Sprint)", "locomozione", "core", "corsa"),
    (r"^Stand", "locomozione", "core", "fermo"),
]

# doppioni esatti (stessa durata, stesso spostamento, stessa rotazione):
# si tiene il primo per numero
DUPLICATE_KEYS = ("duration", "dist", "yawLeft", "frames")


def short(name):
    return re.sub(r"^\d+_", "", name).replace(".psa", "")


def classify(name, meta=None):
    s = short(name)
    for pat, cat, pack, why in RULES:
        if re.search(pat, s):
            # il gioco ha una sola finta, la roulette (giro completo con la palla):
            # le altre sono mosse diverse, cioe' funzioni nuove
            if cat == "finte" and pack and meta is not None and abs(meta.get("yawPeak", 0)) < 300:
                return cat, None, "mossa diversa dalla roulette, l'unica finta del gioco"
            return cat, pack, why
    return "altro", None, "non classificata"


# --- ruolo di ogni clip nel gioco -------------------------------------------
# Il gioco sceglie le clip per corrispondenza dentro un ruolo (locomozione di
# uno stile, passaggio, parata...). (espressione, ruolo, stile)
ROLES = [
    (r"^Stand(_0\d)?$", "idle", "normal"),
    (r"^Defense_Stand0\d$", "idle", "defense"),
    (r"^Dribble_Stand01$", "idle", "dribble"),
    (r"^Keeper_NormalStand$", "idle", "keeper"),
    (r"^Keeper_WarnStand$", "ready", "keeper"),
    (r"^(Keeper_Ball_Stand01|Keeper_BallKeeping_Stand01)$", "idle", "keeperBall"),
    (r"^(Walk|Slow_Jogging|Jogging|FastJogging)(_45|_315)?$", "loco", "normal"),
    (r"^Sprint_0\d$", "loco", "normal"),
    (r"^Sprint_01_(45|315)$", "loco", "normal"),
    (r"^Sidestep_(Walk|Jogging|Fast_Jogging|Sprint)01_[LR]$", "loco", "normal"),
    (r"^Back steps_(Walk|Jogging|Sprint)_01(_135|_225)?$", "loco", "normal"),
    (r"^Back steps_Jogging_0[234]$", "loco", "normal"),
    (r"^Defense_(Walk|Jogging|FastJogging)(_\d+)?$", "loco", "defense"),
    (r"^Dribble_(Jogging0\d|FastJogging01|FastSprint01|Sprint0\d|Jogging_[LR]F01|Sprint_[LR]F01)$", "loco", "dribble"),
    (r"^Keeper_(Walk|jog|Sprint)_Step_\d+$", "loco", "keeper"),

    (r"^(Walk|Jogging|Sprint)_Start_\d+$", "start", "normal"),
    (r"^Dribble_Start_(Jogging|Sprint)_", "start", "dribble"),
    (r"^(Walk|Jogging|Sprint)_Stop(_\d+)?$", "stop", "normal"),
    (r"^Sidestep_(Jogging|Sprint)_Stop01_[LR]$", "stop", "normal"),
    (r"^Back steps_(Jogging|Sprint)_Stop(_01)?$", "stop", "normal"),
    (r"^Dribble_(Jogging|Sprint)_Stop(_\d+)?$", "stop", "dribble"),
    (r"^(Walk|Jogging|Sprint)_Turn_\d+(_[LR])?(_Run)?$", "turn", "normal"),

    (r"^Dribble_(Jogging|Sprint)(Arch)?_Turn_", "turn", "dribble"),
    (r"^Stand_Turn_\d+$", "turnInPlace", "normal"),
    (r"^Defense_Stand_Turn_\d+$", "turnInPlace", "defense"),
    (r"^Defense_Reaction_\d+_01$", "turnInPlace", "defense"),
    (r"^(Low_Pass|MED_Pass|Pass_Stand|Nonstop_Pass)_", "pass", None),
    (r"^(lob_Pass|Long_Pass)_", "long", None),
    (r"^(Shoot_Stand|Low_Shoot|In_Place_Shoot|Volley_Shoot)_", "shot", None),
    (r"^Trapping_", "trap", None),
    (r"^Intercept_", "intercept", None),
    (r"^(Tackles_Stand|Jogging_Tackles|Run_Tackles|Small_Tackles_Stand)_", "tackle", None),
    (r"^Slide_(Tackles|Intercept)", "slide", None),
    (r"^(Tackles01_Reaction_03|Defense_Jump_Fall_Reaction_0[12]_[LR])$", "fall", None),
    (r"^(Heading_Stand_01|Jump_Head_0)$", "header", None),
    (r"^Tricks$", "feint", None),
    (r"^KickOff_\d+$", "kickoff", None),
    (r"^Ball_Avoid_Jump$", "wallJump", None),
    (r"^(Celebration_0[12]_ForSequence|Ceremony_00[12])$", "celebrate", None),
    (r"^Keeper_Save_", "gkSave", None),
    (r"^Keeper_Punching_", "gkPunch", None),
    (r"^Keeper_Ball_(Center|Left01|Right01|Dive)_", "gkCatch", None),
    (r"^Keeper_SlidingCatch_[LR]", "gkCatch", None),
    (r"^Keeper_Ball_Throw_01$", "gkThrow", None),
    (r"^Keeper_Ball_Kick_01$", "gkKick", None),
]

# Pacchetto essenziale: caricato sempre, anche al livello basso. Tutto cio' che
# decide il gioco (tempi, spostamenti, parate) viene da qui, cosi' fisica e IA
# restano identiche a ogni livello; il resto aggiunge solo varieta'.
LOW = {
    # locomozione
    "Stand", "Walk", "Slow_Jogging", "Jogging", "FastJogging", "Sprint_01",
    # diagonali in avanti: senza, la fusione fra corsa avanti e passo laterale incrocia i piedi
    "Walk_45", "Walk_315", "Slow_Jogging_45", "Slow_Jogging_315", "Jogging_45", "Jogging_315",
    "FastJogging_45", "FastJogging_315", "Sprint_01_45", "Sprint_01_315",
    "Sidestep_Walk01_L", "Sidestep_Walk01_R", "Sidestep_Jogging01_L", "Sidestep_Jogging01_R",
    "Sidestep_Fast_Jogging01_L", "Sidestep_Fast_Jogging01_R", "Sidestep_Sprint01_L", "Sidestep_Sprint01_R",
    "Back steps_Walk_01", "Back steps_Walk_01_135", "Back steps_Walk_01_225",
    "Back steps_Jogging_01", "Back steps_Jogging_01_135", "Back steps_Jogging_01_225",
    "Back steps_Sprint_01", "Back steps_Sprint_01_135", "Back steps_Sprint_01_225",
    "Defense_Stand01",
    "Dribble_Stand01", "Dribble_Jogging01", "Dribble_Jogging03", "Dribble_Sprint03",
    "Keeper_NormalStand", "Keeper_WarnStand", "Keeper_Ball_Stand01",
    # arresti e giri sul posto piu' frequenti
    "Jogging_Stop", "Sprint_Stop", "Stand_Turn_90", "Stand_Turn_180", "Stand_Turn_270",
    # calci: un gesto per direzione e piede
    "Low_Pass_Stand_0", "Low_Pass_Stand_0_Lfoot", "Low_Pass_Stand_90", "Low_Pass_Stand_135",
    "Low_Pass_Stand_180_L", "Low_Pass_Stand_180_R", "Low_Pass_Stand_225", "Low_Pass_Stand_270",
    "Nonstop_Pass_Jogging_0", "Nonstop_Pass_Jogging_0_Lfoot",
    "lob_Pass_Stand_01", "lob_Pass_Stand_01_Lfoot", "Long_Pass_Stand_0", "Long_Pass_Stand_0_Lfoot",
    "Shoot_Stand_0", "Shoot_Stand_0_Lfoot", "Low_Shoot_Stand_0", "Low_Shoot_Stand_0_Lfoot", "Shoot_Stand_0_01",
    # ricezioni, contrasti, cadute, testa, finta
    "Trapping_Stand_0_Low01_RFoot", "Trapping_Stand_0_Low01_LFoot", "Trapping_Chest_Stand",
    "Trapping_Head_0", "Trapping_Foot_Stand_01", "Intercept_Stand_0",
    "Tackles_Stand_0", "Small_Tackles_Stand_Left", "Small_Tackles_Stand_Right", "Jogging_Tackles_01", "Run_Tackles_01",
    "Slide_Tackles01", "Tackles01_Reaction_03", "Defense_Jump_Fall_Reaction_01_L", "Defense_Jump_Fall_Reaction_01_R",
    "Heading_Stand_01", "Jump_Head_0", "KickOff_135", "KickOff_180", "KickOff_225", "Ball_Avoid_Jump",
}
LOW_NUMBERED = {"557_Tricks"}
# tutte le clip del portiere in partita stanno nel pacchetto essenziale:
# la parata dipende dalle mani vere, deve essere la stessa a ogni livello
LOW_ROLES = {"gkSave", "gkPunch", "gkCatch", "gkThrow", "gkKick"}
LOW_STYLES = {("loco", "defense"), ("loco", "keeper")}

# specchiate in fase di build: [originale, nome della copia]. La libreria ha una
# sola roulette e una sola scivolata dritta; lo stop laterale destro ha lo stesso
# movimento del sinistro (errore della libreria), si rifa' specchiando quello.
MIRROR = {
    "557_Tricks": "557_Tricks_M",
    "636_Slide_Tackles01": "636_Slide_Tackles01_M",
    "523_Sidestep_Jogging_Stop01_L": "523_Sidestep_Jogging_Stop01_L_M",
}


# clip utilizzabili ma senza un posto nel gioco: il motivo va nel catalogo
NO_ROLE = [
    (r"^Back steps_0$", "corsa all'indietro con giro completo: nessuna situazione di gioco la chiede"),
    (r"^Ceremony$", "esultanza in corsa: il giocatore resta sul posto e la corsa della clip andrebbe persa"),
    (r"^Defense_Fall_Reaction", "sbilanciamento di chi viene saltato: il gioco lo rende col rallentamento, senza gesto"),
    (r"^Defense_FastJogging_180_[LR]$", "corsa all'indietro col corpo girato: doppione della 180"),
    (r"^Defense_Jump_Fall_Reaction_03$", "inciampo senza caduta: nessuna situazione di gioco lo chiede"),
    (r"^Diving_Head", "tuffo di testa: comando non presente"),
    (r"^Tackles_Reaction_[LR]_01$", "inciampo senza caduta: nessuna situazione di gioco lo chiede"),
    (r"^Tackles01_Reaction_02$", "caduta di 7 secondi, troppo lunga per la partita"),
    (r"^Keeper_Ball_(Walk|Run)_", "il portiere con la palla in mano resta fermo fino al rinvio: nessuna situazione la chiede"),
    (r"Arch_Turn_[LR]$", "curva continua in corsa: la rendono il blend tree e l'inclinazione in curva"),
]


def no_role_reason(name):
    role, _ = role_of(name)
    if role in CANONICAL_ONLY:
        return CANONICAL_ONLY[role]
    s = short(name)
    for pat, why in NO_ROLE:
        if re.search(pat, s):
            return why
    return "nessun ruolo nel gioco"


# ruoli in cui la rotazione della radice resta dentro la clip: il corpo gira
# davvero (roulette, caduta che si avvita, tuffo di lato), il gioco no
KEEP_YAW = {"feint", "fall", "gkSave", "gkPunch", "gkCatch", "gkThrow", "gkKick", "celebrate", "slide"}


# Clip che deciderebbero il gioco (spostamento, tempi) e quindi restano una
# sola, nel pacchetto essenziale, uguale a ogni livello: le varianti non entrano.
CANONICAL_ONLY = {
    "feint": "altra roulette: il movimento della finta decide il gioco, resta quella del pacchetto essenziale",
    "slide": "altra scivolata: lo spostamento decide il gioco, resta quella del pacchetto essenziale",
    "fall": "altra caduta: tempi a terra e spostamento decidono il gioco, restano quelle del pacchetto essenziale",
}


def role_of(name):
    # due esultanze "Ceremony" sul posto, distinte solo dal numero
    if name in ("058_Ceremony", "059_Ceremony"):
        return "celebrate", None
    s = short(name)
    for pat, role, style in ROLES:
        if re.search(pat, s):
            return role, style
    return None, None


def plan(meta):
    """Clip da costruire: {src, role, style, pack, why}. pack: core | more | extra."""
    dups = duplicates(meta)
    out = []
    for name in sorted(meta):
        m = meta[name]
        cat, pack, why = classify(name, m)
        if name in dups or not pack:
            continue
        role, style = role_of(name)
        if role is None:
            continue
        s = short(name)
        if s in LOW or name in LOW_NUMBERED or role in LOW_ROLES or (role, style) in LOW_STYLES:
            level = "core"
        elif pack == "extra" or role == "celebrate":
            level = "extra"
        else:
            level = "more"
        if role in CANONICAL_ONLY and level != "core":
            continue
        out.append({"src": name, "role": role, "style": style, "pack": level, "why": why})
        if name in MIRROR:
            out.append({"src": name, "mirror": MIRROR[name], "role": role, "style": style, "pack": level,
                        "why": why + " (specchiata)"})
    return out


def duplicates(meta):
    """nome -> nome della clip identica tenuta al suo posto"""
    seen, out = {}, {}
    for name in sorted(meta):
        m = meta[name]
        if "error" in m:
            continue
        key = (re.sub(r"_\d+$", "", short(name).split("_")[0]),) + tuple(
            m.get(k) if not isinstance(m.get(k), float) else round(m.get(k), 3) for k in DUPLICATE_KEYS
        ) + (m["net"]["fwd"], m["net"]["right"], m["headMin"], m["pelvisMin"],
             tuple(m["footPeak"]["L"]), tuple(m["footPeak"]["R"]),
             tuple(m["ball"]["start"]) if m.get("ball") else None,
             tuple(m["ball"]["end"]) if m.get("ball") else None)
        if key in seen:
            out[name] = seen[key]
        else:
            seen[key] = name
    return out
