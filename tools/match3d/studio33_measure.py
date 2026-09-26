"""Misura le clip della libreria Studio33 Soccer 8 e scrive un JSON di metadati.

Per ogni clip: durata, fotogrammi, root motion (distanza avanti/destra e
rotazione, nel riferimento del personaggio al primo fotogramma), se e' in
place, se il ciclo si chiude, altezze minime di bacino e testa, fotogramma
del contatto con la palla (dall'osso Ball_Bone, che nella libreria porta la
palla), picco di velocita' dei piedi e posizione della palla al contatto.

La libreria non va ridistribuita: il JSON prodotto sta fuori dal repository
(scratchpad o cartella ignorata). Uso:
  blender -b --factory-startup -P tools/match3d/studio33_measure.py -- OUT.json [da a]
"""
import bpy, os, sys, json, math
from mathutils import Vector, Matrix

LIB = r"C:\Users\UTENTE\Desktop\kfm27\src\assets\match3d\source\studio33\Models\Animations\generic"

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0]
lo = int(argv[1]) if len(argv) > 1 else 0
hi = int(argv[2]) if len(argv) > 2 else 10 ** 6

files = sorted(f for f in os.listdir(LIB) if f.lower().endswith(".fbx"))[lo:hi]


def r3(v):
    return round(float(v), 3)


def yaw_of(v):
    return math.degrees(math.atan2(v.y, v.x))


def wrap(a):
    while a > 180:
        a -= 360
    while a < -180:
        a += 360
    return a


def measure(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    act = arm.animation_data.action if arm.animation_data else None
    if act is None:
        return {"error": "nessuna action"}
    fps = bpy.context.scene.render.fps
    f0, f1 = (int(round(v)) for v in act.frame_range)
    P = arm.pose.bones
    M = arm.matrix_world
    need = {"root": "Root", "com": "Bip001", "pelvis": "Bip001-Pelvis",
            "lf": "Bip001-L-Foot", "rf": "Bip001-R-Foot",
            "lt": "Bip001-L-Toe0", "rt": "Bip001-R-Toe0",
            "head": "Bip001-Head", "lh": "Bip001-L-Hand", "rh": "Bip001-R-Hand",
            "lc": "Bip001-L-UpperArm", "rc": "Bip001-R-UpperArm",
            "ball": "Ball_Bone"}
    B = {k: P.get(n) for k, n in need.items()}
    missing = [need[k] for k, b in B.items() if b is None]
    root = B["root"]
    # asse "avanti" dell'osso Root: nel riposo il personaggio guarda -Y
    fwd_local = root.bone.matrix_local.to_3x3().inverted() @ (M.to_3x3().inverted() @ Vector((0, -1, 0)))
    frames = []
    rots = []
    rfw = []
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        frames.append({k: (M @ b.head).copy() for k, b in B.items() if b is not None})
        rots.append((M @ B["pelvis"].matrix).to_3x3().normalized())
        v = (M @ root.matrix).to_3x3() @ fwd_local
        v.z = 0
        rfw.append(v.normalized())
    n = len(frames)
    dt = 1.0 / fps

    # riferimento del personaggio: l'osso Root al primo fotogramma
    fwd0 = rfw[0].copy()
    right0 = fwd0.cross(Vector((0, 0, 1)))
    o = frames[0]["root"].copy()

    def local(v):
        d = v - o
        return Vector((d.dot(fwd0), d.dot(right0), v.z))

    def body_yaw(fr):
        r = fr["rc"] - fr["lc"]
        r.z = 0
        return yaw_of(Vector((0, 0, 1)).cross(r.normalized()))

    # rotazione del Root: positivo = antiorario visto dall'alto = verso sinistra,
    # come nei nomi della libreria (_90 sinistra, _270 destra)
    ryaw = [wrap(yaw_of(v) - yaw_of(fwd0)) for v in rfw]
    # svolgimento continuo, per le svolte oltre 180
    un = [0.0]
    for i in range(1, n):
        un.append(un[-1] + wrap(ryaw[i] - ryaw[i - 1]))
    yaw_left = un[-1]
    peak = max(un, key=abs)
    body0 = wrap(body_yaw(frames[0]) - yaw_of(rfw[0]))
    body1 = wrap(body_yaw(frames[-1]) - yaw_of(rfw[-1]))

    com = [local(fr["root"]) for fr in frames]
    net = com[-1] - com[0]
    path_len = sum(((com[i + 1] - com[i]).xy).length for i in range(n - 1))
    root_moves = max((p.xy - com[0].xy).length for p in com) > 0.02

    # ciclo chiuso: posa (relativa al bacino) uguale fra primo e ultimo fotogramma
    def rel(fr):
        return [fr[k] - fr["com"] for k in ("lf", "rf", "lh", "rh", "head")]
    a, b = rel(frames[0]), rel(frames[-1])
    loop_err = max((x - y).length for x, y in zip(a, b))

    feet_min = min(min(fr["lt"].z, fr["rt"].z, fr["lf"].z, fr["rf"].z) for fr in frames)
    pelvis_min = min(fr["pelvis"].z for fr in frames)
    head_min = min(fr["head"].z for fr in frames)
    head_max = max(fr["head"].z for fr in frames)

    # velocita' media sul piano (per la locomozione)
    speed = net.xy.length / max((n - 1) * dt, 1e-6)
    # direzione del moto rispetto al Root iniziale, antioraria (sinistra positiva)
    move_dir = math.degrees(math.atan2(-net.y, net.x)) if net.xy.length > 0.05 else None

    # velocita' naturale di una clip in place: il piede in appoggio arretra
    stance = []
    for key in ("lt", "rt"):
        zs = [fr[key].z for fr in frames]
        thr = min(zs) + (max(zs) - min(zs)) * 0.33
        for i in range(n - 1):
            if zs[i] <= thr and zs[i + 1] <= thr:
                d = frames[i + 1][key] - frames[i][key]
                stance.append(Vector((d.x, d.y)).length / dt)
    stance.sort()
    foot_speed = stance[len(stance) // 2] if stance else None

    # palla: Ball_Bone. Il contatto e' il primo fotogramma in cui scatta via
    ball = None
    if "ball" in frames[0]:
        bp = [local(fr["ball"]) for fr in frames]
        bs = [((bp[i + 1] - bp[i]).length / dt) for i in range(n - 1)]
        moving = max((p - bp[0]).length for p in bp) > 0.05
        contact = None
        rel_ball = [(frames[i]["ball"] - frames[i]["com"]).length for i in range(n)]
        for i in range(1, n - 1):
            if bs[i] > 4.0 and bs[i] > 2.5 * max(bs[i - 1], 0.5):
                contact = i
                break
        ball = {
            "moves": moving,
            "start": [r3(v) for v in bp[0]],
            "contactFrame": contact,
            "contactTime": r3(contact * dt) if contact is not None else None,
            "at": [r3(v) for v in bp[contact]] if contact is not None else None,
            "exitSpeed": r3(max(bs[contact:contact + 3])) if contact is not None else None,
            "maxSpeed": r3(max(bs) if bs else 0),
            "end": [r3(v) for v in bp[-1]],
        }

    # piede piu' veloce (calcio): fotogramma di picco per ciascun piede
    def peak_speed(key):
        best, at = 0.0, None
        for i in range(n - 1):
            s = (frames[i + 1][key] - frames[i][key]).length / dt
            if s > best:
                best, at = s, i
        return r3(best), at

    lsp, lat = peak_speed("lt")
    rsp, rat = peak_speed("rt")

    # traiettoria del Root a 10 Hz: [t, avanti, destra, yaw sinistra]
    traj = []
    step = max(1, int(round(fps / 10)))
    for i in list(range(0, n, step)) + ([n - 1] if (n - 1) % step else []):
        traj.append([r3(i * dt), r3(com[i].x), r3(com[i].y), round(un[i], 1)])

    return {
        "fps": fps,
        "frames": n,
        "duration": r3((n - 1) * dt),
        "missing": missing,
        "rootBoneMoves": root_moves,
        "net": {"fwd": r3(net.x), "right": r3(net.y)},
        "dist": r3(net.xy.length),
        "path": r3(path_len),
        "yawLeft": round(yaw_left, 1),
        "yawPeak": round(peak, 1),
        "bodyYaw": [round(body0, 1), round(body1, 1)],
        "speed": r3(speed),
        "moveDir": round(move_dir, 1) if move_dir is not None else None,
        "footSpeed": r3(foot_speed) if foot_speed is not None else None,
        "loopErr": r3(loop_err),
        "feetMin": r3(feet_min),
        "pelvisMin": r3(pelvis_min),
        "pelvisStart": r3(frames[0]["pelvis"].z),
        "headMin": r3(head_min),
        "headMax": r3(head_max),
        "footPeak": {"L": [lsp, lat], "R": [rsp, rat]},
        "ball": ball,
        "traj": traj,
    }


out = {}
if os.path.exists(OUT):
    with open(OUT, encoding="utf-8") as f:
        out = json.load(f)
for i, fn in enumerate(files):
    name = fn[:-4]
    if name in out:
        continue
    try:
        out[name] = measure(os.path.join(LIB, fn))
    except Exception as e:  # noqa: BLE001
        out[name] = {"error": repr(e)}
    if i % 20 == 0:
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(out, f)
        print("[measure] %d/%d %s" % (i, len(files), name), flush=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f)
print("---MEASURE-OK---", len(out))
