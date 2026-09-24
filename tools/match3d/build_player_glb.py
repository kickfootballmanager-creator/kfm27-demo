"""Costruisce src/assets/match3d/player.glb da Calciatore.fbx + le animazioni Mixamo.

- decima la mesh a ~3.500 triangoli
- separa maglia / pantaloncini / calzettoni in tre materiali a tinta unita
- un'unica texture: l'atlante del corpo a 1024
- importa le animazioni, le rinomina, toglie lo spostamento orizzontale della radice
- esporta un solo GLB in metri (~1,79 m) + un JSON con lo spostamento originale di ogni clip
"""
import bpy, os, json, math, statistics
from mathutils import Vector, Matrix

ROOT = r"C:\Users\UTENTE\Desktop\kfm27\src\assets\match3d"
SRC = os.path.join(ROOT, "source")
OUT_GLB = os.path.join(ROOT, "player.glb")
OUT_JSON = os.path.join(ROOT, "player.clips.json")
TMP = r"C:\Users\UTENTE\AppData\Local\Temp\claude\C--Users-UTENTE-Desktop-kfm27\fcd67a9a-535a-4d2b-ae0b-95e5db3267cb\scratchpad"

# il prefisso Mixamo di questo rig e' "mixamorig5:", non "mixamorig:":
# l'osso radice va cercato, mai scritto a mano.
def hips_of(armature):
    for pb in armature.pose.bones:
        if pb.name.endswith(":Hips") or pb.name == "Hips":
            return pb
    for pb in armature.pose.bones:
        if pb.parent is None:
            return pb
    return None

# nome file relativo a source/  ->  nome clip
CLIPS = {
    "Slow Run.fbx": "run",
    "Fast Run.fbx": "sprint",
    "Camminata.fbx": "walk",
    "Animazioni che aspettano il calcio di inizio in formazione.fbx": "idle",
    "Calcio Di Inizio.fbx": "kickoff",
    "Celebration.fbx": "celebration",
    "Throw In.fbx": "throw_in",
    r"Animazionia per ricevi palla\Jog Forward Diagonall Palla che arriva dall'alto da un cross filtrante.fbx": "jog_diag_fwd",
    r"Animazionia per ricevi palla\Jog Backward Diagonal Palla che arriva dall'alto da un cross.fbx": "jog_diag_back",
    r"Animazionia per ricevi palla\Jog Strafe Left Palla che arriva dall'alto da un cross.fbx": "strafe_left",
    r"Animazionia per ricevi palla\Jog Strafe Right Palla che arriva dall'alto da un cross.fbx": "strafe_right",
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
    r"Animazioni per falli\Fallen Idle.fbx": "down_idle",
    r"Animazioni goalkeeper\Goalkeeper Sidestep.fbx": "gk_sidestep",
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

# gesti di gioco che riusano una clip esistente invece di averne una propria
ALIASES = {
    "cross": "pass",
}

# doppioni e filmati: non entrano nel GLB
SKIPPED = {
    r"Animazioni per tiri\Header.fbx": "doppione di header",
    r"Animazioni per falli\Soccer Tackle.fbx": "doppione di slide_tackle",
    r"Animazionia per ricevi palla\Jog Backward Diagonal Palla che arriva dall'alto da un cross 2.fbx": "versione non in-place di jog_diag_back",
    r"Animazioni goalkeeper\Goalkeeper Placing Ball.fbx": "filmato, non gameplay",
    r"Animazioni goalkeeper\Goalkeeper Placing Ball 2.fbx": "filmato, non gameplay",
}

# mesh -> (triangoli obiettivo, nome materiale, colore di base, metallico, rugosita')
MESH_PLAN = {
    "Ch38_Body":  (1400, "skin",       None,                       0.0, 0.70),
    "Ch38_Shirt": (700,  "kit_shirt",  (0.85, 0.85, 0.87, 1.0),    0.0, 0.62),
    "Ch38_Shorts": (500, "kit_shorts", (0.12, 0.13, 0.16, 1.0),    0.0, 0.62),
    "Ch38_Socks": (250,  "kit_socks",  (0.85, 0.85, 0.87, 1.0),    0.0, 0.70),
    "Ch38_Shoes": (350,  "boots",      (0.04, 0.04, 0.05, 1.0),    0.1, 0.35),
    "Ch38_Hair":  (400,  "hair",       (0.055, 0.042, 0.035, 1.0), 0.0, 0.85),
}
DROP_MESHES = ("Ch38_Eyelashes",)

log = []


def say(*a):
    s = " ".join(str(x) for x in a)
    log.append(s)
    print("[build]", s)


def tri_count(ob):
    me = ob.data
    return sum(max(len(p.vertices) - 2, 0) for p in me.polygons)


# ---------------------------------------------------------------- personaggio
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=os.path.join(SRC, "Calciatore.fbx"),
                         automatic_bone_orientation=True)

arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
arm.name = "Player"
arm.data.name = "PlayerRig"

for name in DROP_MESHES:
    ob = bpy.data.objects.get(name)
    if ob:
        bpy.data.objects.remove(ob, do_unlink=True)
        say("rimossa mesh", name)

# l'atlante del corpo, ridotto a 1024 e salvato come JPEG
diffuse = next((i for i in bpy.data.images if "Diffuse" in i.name), None)
if diffuse is None:
    raise RuntimeError("atlante diffuse del corpo non trovato")
say("atlante originale", diffuse.name, diffuse.size[:])
diffuse.scale(1024, 1024)
diffuse.filepath_raw = os.path.join(TMP, "body_1024.jpg")
diffuse.file_format = 'JPEG'
bpy.context.scene.render.image_settings.quality = 88
diffuse.save()
diffuse.name = "player_body"
diffuse.pack()
say("atlante ridotto a", diffuse.size[:], "->", os.path.getsize(os.path.join(TMP, "body_1024.jpg")) // 1024, "KB")


def make_material(name, color, metallic, rough, image=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if image is not None:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = image
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = color
    return mat


mesh_report = []
for name, (target, matname, color, metallic, rough) in MESH_PLAN.items():
    ob = bpy.data.objects.get(name)
    if ob is None:
        say("ATTENZIONE: mesh mancante", name)
        continue
    before = tri_count(ob)

    ob.data.materials.clear()
    ob.data.materials.append(make_material(matname, color, metallic, rough,
                                           diffuse if matname == "skin" else None))

    ratio = min(1.0, target / float(before))
    mod = ob.modifiers.new("decimate", 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)

    after = tri_count(ob)
    mesh_report.append((name, before, after, matname))
    say("%-16s %6d -> %5d tris   materiale %s" % (name, before, after, matname))

total_tris = sum(r[2] for r in mesh_report)
say("TOTALE triangoli", total_tris)

zs = [(ob.matrix_world @ Vector(c)).z
      for ob in bpy.data.objects if ob.type == 'MESH' for c in ob.bound_box]
height_m = max(zs) - min(zs)
root_name = hips_of(arm).name
bone_prefix = root_name[: root_name.index(":") + 1] if ":" in root_name else ""
rig_bones = set(b.name for b in arm.data.bones)
say("altezza in Blender %.3f m   osso radice %s" % (height_m, root_name))

# ---------------------------------------------------------------- animazioni
def fcurves_of(action):
    """Blender 4.4+ mette le curve dentro layer/strip/channelbag; l'accesso
    diretto action.fcurves resta solo come scorciatoia. Provo la via nuova e
    ricado su quella vecchia."""
    try:
        if getattr(action, "layers", None) and len(action.layers):
            strip = action.layers[0].strips[0]
            cb = strip.channelbag(action.slots[0], ensure=True)
            return cb.fcurves
    except Exception:  # noqa: BLE001
        pass
    return action.fcurves


LOCOMOTION = ("walk", "run", "sprint", "jog_diag_fwd", "jog_diag_back",
              "strafe_left", "strafe_right", "gk_sidestep")

# clip che esistono da un lato solo e vanno riflesse per avere anche l'altro.
# La riflessa e' mocap vera quanto l'originale: nessun fotogramma inventato.
MIRROR = ("gk_dive", "gk_catch_run", "gk_block", "gk_scoop",
          "slide_tackle", "skill_spin", "jog_diag_fwd", "jog_diag_back")

MIRROR_PLANE = Matrix.Diagonal((-1.0, 1.0, 1.0, 1.0))


def counterpart(name):
    """L'osso simmetrico. Mixamo scrive Left/Right dentro al nome, non come
    suffisso .L/.R, quindi gli strumenti standard di Blender non lo trovano."""
    if "Left" in name:
        return name.replace("Left", "Right")
    if "Right" in name:
        return name.replace("Right", "Left")
    return name


def check_rig_symmetry(armature):
    """Riflettere ha senso solo se il riposo e' simmetrico rispetto a x=0.
    Su un rig storto la riflessione storcerebbe la posa senza dirlo."""
    # head_local e' in unita' dell'armature, che qui e' scalata 0.01: senza
    # convertire, 5 mm sembrano mezzo metro.
    scale = armature.matrix_world.to_scale().x
    found = []
    for b in armature.data.bones:
        other = armature.data.bones.get(counterpart(b.name))
        if other is None:
            raise RuntimeError("osso senza simmetrico: %s" % b.name)
        expected = Vector((-other.head_local.x, other.head_local.y, other.head_local.z))
        found.append(((b.head_local - expected).length * scale, b.name))
    found.sort(reverse=True)
    return found


def bones_top_down(armature):
    order, seen = [], set()

    def walk(pb):
        if pb.name in seen:
            return
        seen.add(pb.name)
        order.append(pb)
        for c in pb.children:
            walk(c)

    for pb in armature.pose.bones:
        if pb.parent is None:
            walk(pb)
    return order


def sample_poses(action, armature):
    """Matrici di posa in spazio oggetto, fotogramma per fotogramma."""
    f0, f1 = (int(round(v)) for v in action.frame_range)
    out = []
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        out.append({pb.name: pb.matrix.copy() for pb in armature.pose.bones})
    return f0, f1, out


def mirror_action(action, armature, newname):
    """Crea la clip riflessa: ogni osso prende la posa del suo simmetrico,
    ribaltata rispetto al piano x=0."""
    S = MIRROR_PLANE
    f0, f1, poses = sample_poses(action, armature)
    order = bones_top_down(armature)

    # posa riflessa -> matrix_basis, dall'alto verso il basso perche' ogni osso
    # dipende dalla posa gia' corretta del genitore
    curves = {}
    for i, frame in enumerate(range(f0, f1 + 1)):
        target = {}
        for pb in order:
            target[pb.name] = S @ poses[i][counterpart(pb.name)] @ S
        for pb in order:
            if pb.parent is None:
                rest_rel = pb.bone.matrix_local
                parent_pose = Matrix.Identity(4)
            else:
                rest_rel = pb.parent.bone.matrix_local.inverted() @ pb.bone.matrix_local
                parent_pose = target[pb.parent.name]
            basis = rest_rel.inverted() @ parent_pose.inverted() @ target[pb.name]
            loc, quat, _scale = basis.decompose()
            slot = curves.setdefault(pb.name, {"location": [[], [], []],
                                               "rotation_quaternion": [[], [], [], []]})
            for k in range(3):
                slot["location"][k].append((frame, loc[k]))
            for k in range(4):
                slot["rotation_quaternion"][k].append((frame, quat[k]))

    act_m = action.copy()
    act_m.name = newname
    act_m.use_fake_user = True
    fcs = fcurves_of(act_m)
    for fc in list(fcs):
        fcs.remove(fc)
    kw = "group_name" if "group_name" in fcs.new.__doc__ else "action_group"
    for bone, chans in curves.items():
        base = 'pose.bones["%s"].' % bone
        for prop, arrays in chans.items():
            for idx, pairs in enumerate(arrays):
                fc = fcs.new(base + prop, index=idx, **{kw: bone})
                fc.keyframe_points.add(len(pairs))
                flat = []
                for fr, v in pairs:
                    flat += [fr, v]
                fc.keyframe_points.foreach_set("co", flat)
                fc.keyframe_points.foreach_set("interpolation", [1] * len(pairs))
                fc.update()
    return act_m


def verify_mirror(original_poses, act_m, armature):
    """Prova del nove: rivaluta la clip riflessa e confronta ogni osso con la
    riflessione del suo simmetrico nell'originale. Ritorna (errore, differenza).
    L'errore dice se la riflessione e' giusta, la differenza se e' servita a
    qualcosa: su un gesto simmetrico la riflessa sarebbe identica all'originale."""
    S = MIRROR_PLANE
    armature.animation_data.action = act_m
    try:
        armature.animation_data.action_slot = act_m.slots[0]
    except Exception:  # noqa: BLE001
        pass
    _f0, _f1, got = sample_poses(act_m, armature)
    # pb.matrix e' in spazio oggetto, dove l'armature e' scalata 0.01: senza
    # convertire, 3 mm di scarto sembrano 35 cm.
    scale = armature.matrix_world.to_scale().x
    err = diff = 0.0
    for i, frame_poses in enumerate(got):
        if i >= len(original_poses):
            break
        for name, m in frame_poses.items():
            want = S @ original_poses[i][counterpart(name)] @ S
            err = max(err, (m.translation - want.translation).length * scale)
            diff = max(diff, (m.translation - original_poses[i][name].translation).length * scale)
    return err, diff


def detect_side(action, armature):
    """Da che parte va la clip, vista dal personaggio. Il versore 'destra' viene
    dalle spalle, quindi non dipende da come il FBX e' orientato nel mondo."""
    def find(s):
        return next((pb for pb in armature.pose.bones if pb.name.endswith(s)), None)

    hips = hips_of(armature)
    la, ra = find(":LeftArm"), find(":RightArm")
    lf = find(":LeftToeBase") or find(":LeftFoot")
    rf = find(":RightToeBase") or find(":RightFoot")
    f0, f1 = (int(round(v)) for v in action.frame_range)
    M = armature.matrix_world

    rights, hp, feet = [], [], ([], [])
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        r = (M @ ra.head) - (M @ la.head)
        r.z = 0
        if r.length > 1e-6:
            rights.append(r.normalized())
        hp.append((M @ hips.head).copy())
        feet[0].append((M @ lf.head).copy())
        feet[1].append((M @ rf.head).copy())
    r = Vector((sum(v.x for v in rights), sum(v.y for v in rights), 0.0)).normalized()
    fwd = Vector((0, 0, 1)).cross(r)

    # 1) la radice si sposta di lato
    disp = hp[-1] - hp[0]
    disp.z = 0
    lateral = disp.dot(r)
    if abs(lateral) > 0.25:
        return ("right" if lateral > 0 else "left",
                "la radice va di lato di %+.2f m" % lateral)

    # 2) clip in place: la direzione la da' il piede in appoggio, che arretra
    acc = Vector((0, 0, 0))
    for pts in feet:
        zs = [p.z for p in pts]
        thr = min(zs) + (max(zs) - min(zs)) * 0.33
        for i in range(len(pts) - 1):
            if zs[i] <= thr and zs[i + 1] <= thr:
                acc -= (pts[i + 1] - pts[i])
    acc.z = 0
    if acc.length > 0.1:
        return ("right" if acc.dot(r) > 0 else "left",
                "il piede in appoggio porta di lato di %+.2f m" % acc.dot(r))

    # 3) resta la gamba che guida, al fotogramma di massima estensione
    gap = [(p[1] - p[0]).dot(fwd) for p in zip(feet[0], feet[1])]
    k = max(range(len(gap)), key=lambda i: abs(gap[i]))
    return ("right" if gap[k] > 0 else "left",
            "la gamba avanti e' la destra di %+.2f m" % gap[k])


def natural_speed(action, armature):
    """Velocita' a cui il ciclo 'vuole' avanzare, in m/s. Serve a legare la
    velocita' di riproduzione a quella reale: se non combaciano, i piedi
    scivolano.

    Due casi, e vanno distinti:
    - clip con root motion: il piede in appoggio e' fermo a terra, la velocita'
      e' quella della radice;
    - clip in place: la radice non si muove, quindi e' il piede in appoggio ad
      arretrare, e la sua velocita' e' quella che il ciclo sottintende.
    Va chiamata PRIMA di togliere lo spostamento della radice."""
    def find(suffix):
        return next((pb for pb in armature.pose.bones if pb.name.endswith(suffix)), None)

    hips = hips_of(armature)
    feet = [find(":LeftToeBase") or find(":LeftFoot"),
            find(":RightToeBase") or find(":RightFoot")]
    if hips is None or not all(feet):
        return None

    f0, f1 = (int(round(v)) for v in action.frame_range)
    fps = bpy.context.scene.render.fps
    dt = 1.0 / fps
    M = armature.matrix_world
    hp, tracks = [], [[], []]
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        hp.append((M @ hips.head).copy())
        for k in range(2):
            tracks[k].append((M @ feet[k].head).copy())

    root_v = (hp[-1].xy - hp[0].xy).length / max((f1 - f0) * dt, 1e-6)
    if root_v > 0.2:
        return round(root_v, 2)

    # il piede e' in appoggio quando sta nel terzo piu' basso della sua escursione
    speeds = []
    for pts in tracks:
        zs = [p.z for p in pts]
        thr = min(zs) + (max(zs) - min(zs)) * 0.33
        for i in range(len(pts) - 1):
            if zs[i] <= thr and zs[i + 1] <= thr:
                speeds.append((pts[i + 1].xy - pts[i].xy).length / dt)
    return round(statistics.median(speeds), 2) if speeds else None


def summarise(heads):
    """Escursione della radice in metri. In Blender il piano e' XY, l'alto e' Z."""
    return {
        "x": round(max(h.x for h in heads) - min(h.x for h in heads), 4),
        "y": round(max(h.y for h in heads) - min(h.y for h in heads), 4),
        "up": round(max(h.z for h in heads) - min(h.z for h in heads), 4),
        "net": round(math.hypot(heads[-1].x - heads[0].x, heads[-1].y - heads[0].y), 4),
    }


def measure_root(action, armature):
    """Rimisura la radice dopo la correzione, per avere una prova e non una speranza."""
    pb = hips_of(armature)
    f0, f1 = (int(round(v)) for v in action.frame_range)
    M = armature.matrix_world @ pb.bone.matrix_local
    heads = []
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        heads.append(M @ pb.location.copy())
    return summarise(heads)


def strip_root_motion(action, armature):
    """Azzera lo spostamento orizzontale (mondo XY) dell'osso radice, tenendo il
    saliscendi verticale. Va eseguita sull'armature appena importata, dove
    l'importatore ha gia' legato l'action: su un'altra armature le curve non
    verrebbero valutate e la posa resterebbe ferma.
    Ritorna lo spostamento originale in metri, da conservare nel JSON."""
    pb = hips_of(armature)
    if pb is None:
        return None
    f0, f1 = (int(round(v)) for v in action.frame_range)

    # M porta una posizione locale dell'osso in coordinate mondo
    M = armature.matrix_world @ pb.bone.matrix_local
    Minv = M.inverted()

    heads, locs = [], []
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        heads.append(M @ pb.location.copy())
        locs.append(pb.location.copy())

    start = heads[0]
    travel = summarise(heads)

    # riscrive le curve di posizione tenendo solo la componente verticale
    fcs = fcurves_of(action)
    for i in range(3):
        fc = fcs.find(pb.path_from_id("location"), index=i)
        if fc:
            fcs.remove(fc)
    # la collezione nuova (channelbag) vuole group_name, quella vecchia action_group
    kw = "group_name" if "group_name" in fcs.new.__doc__ else "action_group"
    curves = [fcs.new(pb.path_from_id("location"), index=i, **{kw: pb.name})
              for i in range(3)]
    for k, f in enumerate(range(f0, f1 + 1)):
        fixed = M @ locs[k]
        fixed.x, fixed.y = start.x, start.y
        newloc = Minv @ fixed
        for i in range(3):
            kp = curves[i].keyframe_points.insert(f, newloc[i])
            kp.interpolation = 'LINEAR'
    for c in curves:
        c.update()
    return travel


sym = check_rig_symmetry(arm)
if sym[0][0] > 0.02:
    raise RuntimeError("rig non simmetrico: %s" % [(round(d, 4), n) for d, n in sym[:5]])
say("simmetria del rig: i tre scarti peggiori sono %s"
    % ", ".join("%s %.1f mm" % (n.split(":")[-1], d * 1000) for d, n in sym[:3]))

clip_meta = []
for rel, clipname in CLIPS.items():
    path = os.path.join(SRC, rel)
    if not os.path.exists(path):
        say("ATTENZIONE: file mancante", rel)
        continue
    before_objs = set(bpy.data.objects)
    before_acts = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=True)
    new_objs = [o for o in bpy.data.objects if o not in before_objs]
    new_acts = [a for a in bpy.data.actions if a not in before_acts]
    if not new_acts:
        say("ATTENZIONE: nessuna action in", rel)
        continue

    act = new_acts[0]
    act.name = clipname
    act.use_fake_user = True

    # la correzione va fatta sull'armature appena importata: e' l'unica a cui
    # l'action e' davvero legata, quindi l'unica in cui la posa viene valutata
    tmparm = next((o for o in new_objs if o.type == 'ARMATURE'), None)
    if tmparm is None:
        say("ATTENZIONE: nessuna armature in", rel)
        continue

    # un'action che nomina ossa diverse non anima niente e non se ne accorge
    # nessuno: il GLB esce con la clip presente ma il personaggio immobile
    theirs = set(b.name for b in tmparm.data.bones)
    if theirs != rig_bones:
        raise RuntimeError(
            "scheletro diverso in %s: %d ossa invece di %d, mancano %s, in piu' %s"
            % (rel, len(theirs), len(rig_bones),
               sorted(rig_bones - theirs)[:6], sorted(theirs - rig_bones)[:6]))
    f0, f1 = (int(round(v)) for v in act.frame_range)
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = f0, f1
    speed = natural_speed(act, tmparm) if clipname in LOCOMOTION else None
    side, why = detect_side(act, tmparm) if clipname in MIRROR else (None, None)
    travel = strip_root_motion(act, tmparm)
    after = measure_root(act, tmparm)

    made = [(clipname, None)]
    if clipname in MIRROR:
        other = "left" if side == "right" else "right"
        act.name = "%s_%s" % (clipname, side)
        _f0, _f1, before_poses = sample_poses(act, tmparm)
        act_m = mirror_action(act, tmparm, "%s_%s" % (clipname, other))
        err, diff = verify_mirror(before_poses, act_m, tmparm)
        # lo scarto residuo non puo' scendere sotto l'asimmetria del rig stesso
        if err > 0.010:
            raise RuntimeError("riflessione sbagliata in %s: scarto massimo %.1f mm"
                               % (clipname, err * 1000))
        if diff < 0.05:
            raise RuntimeError("la riflessa di %s e' uguale all'originale: gesto "
                               "gia' simmetrico, non serve specchiarlo" % clipname)
        say("  riflessa %-20s originale a %-5s (%s), scarto %.1f mm, differenza %.2f m"
            % (act_m.name, side, why, err * 1000, diff))
        made = [(act.name, side), (act_m.name, other)]

    for o in new_objs:
        bpy.data.objects.remove(o, do_unlink=True)

    for made_name, made_side in made:
        clip_meta.append({
            "name": made_name,
            "source": rel.replace("\\", "/"),
            "mirrored": bool(made_side and made_side != side),
            "side": made_side,
            "frames": [f0, f1],
            "fps": bpy.context.scene.render.fps,
            "duration": round((f1 - f0) / float(bpy.context.scene.render.fps), 3),
            "rootTravel": travel,
            "residual": after,
            "naturalSpeed": speed,
            "loop": clipname in ("idle", "walk", "run", "sprint", "jog_diag_fwd",
                                 "jog_diag_back", "strafe_left", "strafe_right",
                                 "gk_sidestep", "down_idle"),
        })
    say("clip %-14s %3d frame  %5.2fs  originale %5.2f m -> residuo %.3f m  (su/giu %.2f m)"
        % (clipname, f1 - f0 + 1, (f1 - f0) / 30.0,
           travel["net"], after["net"], after["up"]))

# controlli: se qualcosa non torna, meglio fermarsi che esportare un GLB sbagliato
moved = [c for c in clip_meta if c["rootTravel"]["net"] > 0.5]
if not moved:
    raise RuntimeError("nessuna clip risulta spostarsi: la misura della radice non ha funzionato")
say("clip che si spostavano davvero:", len(moved))
residual = [c["name"] for c in clip_meta if c["residual"]["net"] > 0.02]
if residual:
    raise RuntimeError("spostamento orizzontale ancora presente in: %s" % residual)
flat = [c["name"] for c in clip_meta if c["residual"]["up"] < 0.002]
if flat:
    say("ATTENZIONE: radice senza saliscendi verticale in:", flat)

# l'action che il FBX del personaggio si porta dietro non deve finire nel GLB
keep = set(c["name"] for c in clip_meta)
for a in list(bpy.data.actions):
    if a.name not in keep:
        say("scartata action estranea:", a.name)
        bpy.data.actions.remove(a, do_unlink=True)

if arm.animation_data:
    arm.animation_data.action = None

# ---------------------------------------------------------------- export
kwargs = dict(
    filepath=OUT_GLB,
    export_format='GLB',
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_bake_animation=False,
    export_force_sampling=True,
    export_optimize_animation_size=True,
    # a True questa opzione tiene TUTTI i canali di ogni osso e annulla
    # l'ottimizzazione: 65 ossa x 3 canali = 195 tracce anche dove sono costanti
    export_optimize_animation_keep_anim_armature=False,
    export_anim_slide_to_zero=True,
    export_nla_strips=False,
    export_apply=False,
    export_skins=True,
    export_morph=False,
    export_cameras=False,
    export_lights=False,
    export_yup=True,
    export_image_format='JPEG',
    export_jpeg_quality=88,
    export_texcoords=True,
    export_normals=True,
    export_tangents=False,
    export_extras=False,
    use_selection=False,
)
valid = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
dropped = [k for k in kwargs if k not in valid]
kwargs = {k: v for k, v in kwargs.items() if k in valid}
if dropped:
    say("opzioni di export non supportate da questa versione, ignorate:", dropped)

bpy.ops.export_scene.gltf(**kwargs)
say("scritto", OUT_GLB, os.path.getsize(OUT_GLB) // 1024, "KB")

meta = {
    "source": "Calciatore.fbx + Mixamo",
    "unit": "metri",
    "height": round(height_m, 3),
    "bonePrefix": bone_prefix,
    "rootBone": root_name,
    "triangles": total_tris,
    "meshes": [{"mesh": m, "trisBefore": b, "trisAfter": a, "material": mt}
               for m, b, a, mt in mesh_report],
    "rootMotion": ("spostamento orizzontale rimosso da tutte le clip, saliscendi "
                   "verticale conservato. rootTravel sono i metri dell'originale "
                   "Mixamo, da riprodurre via codice; residual e' la verifica dopo "
                   "la correzione."),
    "skipped": [{"source": k.replace("\\", "/"), "reason": v} for k, v in SKIPPED.items()],
    "aliases": ALIASES,
    "clips": clip_meta,
}
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=1, ensure_ascii=False)
say("scritto", OUT_JSON)
print("---BUILD-OK---")
