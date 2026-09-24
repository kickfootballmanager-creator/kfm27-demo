"""Misura le clip Mixamo originali e scrive src/assets/match3d/player.motion.json.

player.glb ha le clip senza spostamento orizzontale della radice: il movimento
lo decide il codice. Per riprodurre in codice uno spostamento credibile (tuffo,
scivolata, caduta) e per far partire la palla nel fotogramma giusto servono,
per ogni gesto:
- root: spostamento della radice [t, avanti, destra] rispetto al primo
  fotogramma, nel riferimento del personaggio;
- hips: altezza del bacino nel tempo (quando e' a terra);
- eventi: piede piu' veloce, testa piu' alta, mani piu' lontane.

Non tocca player.glb. Uso:
  blender -b --factory-startup -P tools/match3d/measure_clips.py
"""
import bpy, os, json, math
from mathutils import Vector

ROOT = r"C:\Users\UTENTE\Desktop\kfm27\src\assets\match3d"
SRC = os.path.join(ROOT, "source")
MANIFEST = os.path.join(ROOT, "player.clips.json")
OUT = os.path.join(ROOT, "player.motion.json")

# solo i gesti: le corse cicliche non si spostano
GESTURES = {
    "Calcio Di Inizio.fbx": "kickoff",
    "Celebration.fbx": "celebration",
    "Throw In.fbx": "throw_in",
    r"Animazionia per ricevi palla\Receive.fbx": "receive",
    r"Passaggi\Soccer Pass.fbx": "pass",
    r"Animazioni per tiri\Strike Foward Jog.fbx": "shot",
    r"Animazioni per tiri\Soccer Penalty Kick.fbx": "penalty",
    r"Animazioni per tiri\Tiro Rovesciata.fbx": "bicycle_kick",
    r"Animazioni per tiri\Soccer Header.fbx": "header_jump",
    r"Animazioni per tiri\Header Soccerball.fbx": "header",
    r"Animazioni Skill\Soccer Spin.fbx": "skill_spin",
    r"Animazioni per falli\Soccer Tackle 2.fbx": "tackle",
    r"Animazioni per difesa\Scivolata.fbx": "slide_tackle",
    r"Animazioni per falli\Soccer Trip.fbx": "tripped",
    r"Animazioni goalkeeper\Goalkeeper Catch.fbx": "gk_catch",
    r"Animazioni goalkeeper\Goalkeeper Catch 2.fbx": "gk_catch_high",
    r"Animazioni goalkeeper\Goalkeeper Catch 3.fbx": "gk_catch_run",
    r"Animazioni goalkeeper\Goalkeeper Diving Save.fbx": "gk_dive",
    r"Animazioni goalkeeper\Goalkeeper Body Block ha preso palla con la mano.fbx": "gk_block",
    r"Animazioni goalkeeper\Goalkeeper Scoop.fbx": "gk_scoop",
    r"Animazioni goalkeeper\Goalkeeper Drop Kick.fbx": "gk_dropkick",
    r"Animazioni goalkeeper\Goalie Throw Con Palla alle mani.fbx": "gk_throw",
    r"Animazioni goalkeeper\Goalkeeper Miss Dopo Aver preso goal.fbx": "gk_concede",
}

STEP = 2   # un campione ogni 2 fotogrammi (15 Hz): basta per interpolare


def find(arm, suffix):
    return next((pb for pb in arm.pose.bones if pb.name.endswith(suffix)), None)


def r3(v):
    return round(v, 3)


def measure(arm, action):
    M = arm.matrix_world
    fps = bpy.context.scene.render.fps
    f0, f1 = (int(round(v)) for v in action.frame_range)
    bones = {k: find(arm, s) for k, s in {
        "hips": ":Hips", "head": ":Head", "la": ":LeftArm", "ra": ":RightArm",
        "lh": ":LeftHand", "rh": ":RightHand",
        "lf": ":LeftToeBase", "rf": ":RightToeBase"}.items()}
    frames = []
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        frames.append({k: (M @ b.head).copy() for k, b in bones.items()})

    # riferimento del personaggio al primo fotogramma: destra dalle spalle
    r = frames[0]["ra"] - frames[0]["la"]
    r.z = 0
    r.normalize()
    fwd = Vector((0, 0, 1)).cross(r)
    o = frames[0]["hips"]

    def local(p):
        d = p - o
        return d.dot(fwd), d.dot(r), p.z

    ground = min(min(fr["lf"].z, fr["rf"].z) for fr in frames)
    out = {"fps": fps, "frames": f1 - f0 + 1, "root": [], "hips": []}
    for i in range(0, len(frames), STEP):
        t = i / fps
        a, s, z = local(frames[i]["hips"])
        out["root"].append([r3(t), r3(a), r3(s)])
        out["hips"].append([r3(t), r3(z - ground)])

    def speed_peak(key):
        best, bt = 0.0, 0.0
        for i in range(1, len(frames)):
            v = (frames[i][key] - frames[i - 1][key]).length * fps
            if v > best:
                best, bt = v, (i - 0.5) / fps
        return r3(bt), r3(best)

    rt, rv = speed_peak("rf")
    lt, lv = speed_peak("lf")
    out["foot"] = {"right": [rt, rv], "left": [lt, lv]}
    hk = max(range(len(frames)), key=lambda i: frames[i]["head"].z)
    out["headTop"] = [r3(hk / fps), r3(frames[hk]["head"].z - ground)]
    lk = min(range(len(frames)), key=lambda i: frames[i]["hips"].z)
    out["hipsLow"] = [r3(lk / fps), r3(frames[lk]["hips"].z - ground)]

    # mani: il punto piu' lontano dal bacino di partenza (tuffi, parate)
    def hand_far(key):
        k = max(range(len(frames)), key=lambda i: (frames[i][key] - o).length)
        a, s, z = local(frames[k][key])
        return [r3(k / fps), r3(a), r3(s), r3(z - ground)]
    out["hands"] = {"left": hand_far("lh"), "right": hand_far("rh")}
    # mani: il fotogramma in cui sono piu' alte (presa alta, rimessa)
    hk = max(range(len(frames)), key=lambda i: frames[i]["lh"].z + frames[i]["rh"].z)
    out["handsTop"] = [r3(hk / fps), r3((frames[hk]["lh"].z + frames[hk]["rh"].z) / 2 - ground)]
    # mani: massima velocita' in avanti (rilascio di rimessa e lancio del portiere)
    best, bt = -1e9, 0.0
    for i in range(1, len(frames)):
        v = ((frames[i]["lh"] + frames[i]["rh"]) - (frames[i - 1]["lh"] + frames[i - 1]["rh"])).dot(fwd) * fps / 2
        if v > best:
            best, bt = v, (i - 0.5) / fps
    out["handsThrow"] = [r3(bt), r3(best)]
    return out


def mirrored(m):
    """La clip riflessa: destra e sinistra si scambiano."""
    c = json.loads(json.dumps(m))
    c["root"] = [[t, a, -s] for t, a, s in c["root"]]
    c["foot"] = {"right": m["foot"]["left"], "left": m["foot"]["right"]}
    hl, hr = m["hands"]["right"], m["hands"]["left"]
    c["hands"] = {"left": [hl[0], hl[1], -hl[2], hl[3]], "right": [hr[0], hr[1], -hr[2], hr[3]]}
    return c


manifest = json.load(open(MANIFEST, encoding="utf-8"))
by_source = {}
for c in manifest["clips"]:
    by_source.setdefault(c["source"].replace("/", "\\"), []).append(c)

result = {"note": "generato da tools/match3d/measure_clips.py; metri e secondi, "
                  "root = [t, avanti, destra] del bacino rispetto al primo fotogramma",
          "clips": {}}
for rel, base in GESTURES.items():
    path = os.path.join(SRC, rel)
    if not os.path.exists(path):
        print("[measure] manca", rel)
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=True)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    act = arm.animation_data.action
    f0, f1 = (int(round(v)) for v in act.frame_range)
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = f0, f1
    m = measure(arm, act)
    for c in by_source.get(rel, []):
        result["clips"][c["name"]] = mirrored(m) if c.get("mirrored") else m
        print("[measure]", c["name"], "foot", result["clips"][c["name"]]["foot"],
              "root end", result["clips"][c["name"]]["root"][-1])

with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(result, fh, separators=(",", ":"))
print("[measure] scritto", OUT, len(result["clips"]), "clip")
