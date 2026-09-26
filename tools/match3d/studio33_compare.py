"""Confronto delle due soluzioni sulle pose chiave della libreria Studio33.

Sinistra: il personaggio Footballer della libreria con le sue clip (nessun
retargeting). Destra: il Calciatore Mixamo attuale con le stesse clip
trasferite dal Biped di 3ds Max allo scheletro Mixamo.

Retargeting: si mette il Biped nella stessa posa di riposo del Mixamo
(T-pose, allineando la direzione di ogni osso), poi a ogni fotogramma ogni
osso Mixamo ruota nel mondo quanto ruota il suo corrispondente Biped rispetto
a quella posa. Il bacino si sposta in proporzione all'altezza delle anche.

Uso:
  blender -b --factory-startup -P tools/match3d/studio33_compare.py -- OUTDIR
Scrive OUTDIR/<posa>_s33.png, <posa>_mix.png e retarget_report.json.
"""
import bpy, os, sys, json, math
from mathutils import Vector, Matrix, Quaternion

ROOT = r"C:\Users\UTENTE\Desktop\kfm27\src\assets\match3d\source"
S33 = os.path.join(ROOT, "studio33", "Models")
LIB = os.path.join(S33, "Animations", "generic")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0]
os.makedirs(OUT, exist_ok=True)

# posa: (clip, fotogramma o regola, vista)
POSES = [
    ("corsa", "646_Sprint_01", ("frame", 3), "side"),
    ("tiro", "512_Shoot_Stand_0", ("ballfoot", "Bip001-R-Toe0"), "front"),
    ("tuffo", "404_Keeper_Save_Left02_Medium_01", ("ballhands", None), "front"),
    ("scivolata", "636_Slide_Tackles01", ("lowest", "pelvis"), "side"),
    ("testa", "329_Jump_Head_0", ("highest", "head"), "side"),
]

MAP = {
    "Bip001-Pelvis": "Hips", "Bip001-Spine": "Spine", "Bip001-Spine1": "Spine1",
    "Bip001-Spine2": "Spine2", "Bip001-Neck": "Neck", "Bip001-Head": "Head",
}
for S, M in (("L", "Left"), ("R", "Right")):
    MAP.update({
        "Bip001-%s-Clavicle" % S: M + "Shoulder", "Bip001-%s-UpperArm" % S: M + "Arm",
        "Bip001-%s-Forearm" % S: M + "ForeArm", "Bip001-%s-Hand" % S: M + "Hand",
        "Bip001-%s-Thigh" % S: M + "UpLeg", "Bip001-%s-Calf" % S: M + "Leg",
        "Bip001-%s-Foot" % S: M + "Foot", "Bip001-%s-Toe0" % S: M + "ToeBase",
        "Bip001-%s-Finger0" % S: M + "HandThumb1", "Bip001-%s-Finger01" % S: M + "HandThumb2",
        "Bip001-%s-Finger1" % S: M + "HandIndex1", "Bip001-%s-Finger11" % S: M + "HandIndex2",
        "Bip001-%s-Finger2" % S: M + "HandMiddle1", "Bip001-%s-Finger21" % S: M + "HandMiddle2",
        "Bip001-%s-Finger3" % S: M + "HandRing1", "Bip001-%s-Finger31" % S: M + "HandRing2",
        "Bip001-%s-Finger4" % S: M + "HandPinky1", "Bip001-%s-Finger41" % S: M + "HandPinky2",
    })
# osso "figlio" che da' la direzione di ciascun osso nella posa di riferimento
AIM = {
    "Hips": "Spine", "Spine": "Spine1", "Spine1": "Spine2", "Spine2": "Neck", "Neck": "Head",
    "Head": None,
}
for M in ("Left", "Right"):
    AIM.update({
        M + "Shoulder": M + "Arm", M + "Arm": M + "ForeArm", M + "ForeArm": M + "Hand",
        M + "Hand": M + "HandMiddle1", M + "UpLeg": M + "Leg", M + "Leg": M + "Foot",
        M + "Foot": M + "ToeBase", M + "ToeBase": None,
        M + "HandThumb1": M + "HandThumb2", M + "HandThumb2": None,
        M + "HandIndex1": M + "HandIndex2", M + "HandIndex2": None,
        M + "HandMiddle1": M + "HandMiddle2", M + "HandMiddle2": None,
        M + "HandRing1": M + "HandRing2", M + "HandRing2": None,
        M + "HandPinky1": M + "HandPinky2", M + "HandPinky2": None,
    })
report = {}

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    return [o for o in bpy.data.objects if o not in before]


# ---------------------------------------------------------------- personaggi
objs = import_fbx(os.path.join(S33, "models", "Footballer.fbx"))
s33 = next(o for o in objs if o.type == 'ARMATURE')
s33.name = "S33"
for o in objs:
    if o.type == 'MESH':
        if o.name.startswith("Object"):
            o.hide_render = True
            continue
        img = bpy.data.images.load(os.path.join(S33, "Textures", "Footballer", "A1.png"))
        mat = bpy.data.materials.new("s33")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = img
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        mat.node_tree.nodes.active = tex
        o.data.materials.clear()
        o.data.materials.append(mat)
        o.data.uv_layers.active_index = 0

objs = import_fbx(os.path.join(ROOT, "Calciatore.fbx"))
mix = next(o for o in objs if o.type == 'ARMATURE')
mix.name = "MIX"
for o in objs:
    if o.type == 'MESH' and "Eyelashes" in o.name:
        bpy.data.objects.remove(o, do_unlink=True)
if mix.animation_data:
    mix.animation_data.action = None
PFX = next(b.name for b in mix.data.bones if b.name.endswith(":Hips")).split(":")[0] + ":"


def mb(name):
    return mix.pose.bones[PFX + name]


def rest_rel(pb):
    b = pb.bone
    return b.parent.matrix_local.inverted() @ b.matrix_local if b.parent else b.matrix_local


def top_down(arm):
    out, seen = [], set()

    def walk(pb):
        out.append(pb)
        for c in pb.children:
            walk(c)
    for pb in arm.pose.bones:
        if pb.parent is None:
            walk(pb)
    return out


S_ORDER = top_down(s33)
M_ORDER = top_down(mix)


def swing(a, b):
    a, b = a.normalized(), b.normalized()
    return a.rotation_difference(b)


# posa di riferimento del Biped = riposo del Mixamo (armature space, stesse
# unita' e stessa rotazione dell'oggetto per i due personaggi)
inv_map = {v: k for k, v in MAP.items()}
m_rest = {pb.name: pb.bone.matrix_local.copy() for pb in mix.pose.bones}
s_rest = {pb.name: pb.bone.matrix_local.copy() for pb in s33.pose.bones}


def m_dir(mname):
    child = AIM.get(mname)
    if not child:
        return None
    return m_rest[PFX + child].translation - m_rest[PFX + mname].translation


s_ref = {}
for pb in S_ORDER:
    name = pb.name
    if pb.parent is None:
        s_ref[name] = s_rest[name].copy()
        continue
    # l'osso segue il genitore gia' riallineato
    parent = pb.parent.name
    local = s_rest[parent].inverted() @ s_rest[name]
    cur = s_ref[parent] @ local
    mname = MAP.get(name)
    if mname and m_dir(mname) is not None:
        schild = inv_map.get(AIM[mname])
        if schild:
            # la direzione del figlio va misurata con questo osso gia' al suo posto
            sd = (cur @ (s_rest[name].inverted() @ s_rest[schild])).translation - cur.translation
            q = swing(sd, m_dir(mname))
            R = q.to_matrix().to_4x4()
            t = cur.translation.copy()
            cur = Matrix.Translation(t) @ R @ Matrix.Translation(-t) @ cur
    s_ref[name] = cur

# nello spazio dell'armatura l'alto e' Y (l'oggetto e' ruotato di 90 gradi su X)
hip_ratio = m_rest[PFX + "Hips"].translation.y / s_rest["Bip001-Pelvis"].translation.y
report["hipRatio"] = hip_ratio

# lunghezze delle ossa: il Biped delle clip e' proporzionato come il Footballer?
# (se no, le traslazioni locali della clip deformerebbero la mesh)


def retarget_frame(dummy):
    """Copia la posa del manichino della clip sul Footballer e la trasferisce
    al Mixamo. Ritorna le matrici armature-space dei due."""
    D = dummy.pose.bones
    # 1) Footballer: stesse trasformazioni locali (rispetto al genitore) del manichino
    s_pose = {}
    for pb in S_ORDER:
        name = pb.name
        if name in D:
            d = D[name]
            local = d.parent.matrix.inverted() @ d.matrix if d.parent else d.matrix.copy()
        else:
            local = rest_rel(pb)
        s_pose[name] = (s_pose[pb.parent.name] @ local) if pb.parent else local
        pb.matrix_basis = rest_rel(pb).inverted() @ local
    # 2) Mixamo: rotazione nel mondo = delta del Biped rispetto al riferimento
    m_pose = {}
    for pb in M_ORDER:
        short = pb.name[len(PFX):]
        sname = inv_map.get(short)
        if pb.parent is None:
            parent_pose = Matrix.Identity(4)
            rel = pb.bone.matrix_local
        else:
            parent_pose = m_pose[pb.parent.name]
            rel = rest_rel(pb)
        placed = parent_pose @ rel
        if sname:
            Rs = s_pose[sname].to_3x3().normalized()
            Rref = s_ref[sname].to_3x3().normalized()
            Rm = m_rest[pb.name].to_3x3().normalized()
            R = (Rs @ Rref.inverted() @ Rm).to_4x4()
            if short == "Hips":
                d = s_pose[sname].translation - s_rest[sname].translation
                t = m_rest[pb.name].translation + d * hip_ratio
            else:
                t = placed.translation
            pose = Matrix.Translation(t) @ R
        else:
            pose = placed
        m_pose[pb.name] = pose
        pb.matrix_basis = rel.inverted() @ parent_pose.inverted() @ pose
    return s_pose, m_pose


def choose_frame(dummy, rule, f0, f1):
    kind, arg = rule
    if kind == "frame":
        return f0 + arg
    D = dummy.pose.bones
    M = dummy.matrix_world
    best, bv = f0, None
    prev = None
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        if kind == "peak":
            p = (M @ D["Bip001-R-Toe0"].head).copy()
            if prev is not None:
                v = (p - prev).length
                if bv is None or v > bv:
                    bv, best = v, f
            prev = p
        elif kind == "ballfoot":
            h = (M @ D[arg].head - M @ D["Ball_Bone"].head).length
            if bv is None or h < bv:
                bv, best = h, f
        elif kind == "lowest":
            z = (M @ D["Bip001-Pelvis"].head).z
            if bv is None or z < bv:
                bv, best = z, f
        elif kind == "highest":
            z = (M @ D["Bip001-Head"].head).z
            if bv is None or z > bv:
                bv, best = z, f
        elif kind == "ballhands":
            b = M @ D["Ball_Bone"].head
            h = min((M @ D["Bip001-L-Hand"].head - b).length, (M @ D["Bip001-R-Hand"].head - b).length)
            if bv is None or h < bv:
                bv, best = h, f
    return best


# ---------------------------------------------------------------- resa
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = False
scene.render.resolution_x = 640
scene.render.resolution_y = 800
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("w")
scene.display.shading.background_type = 'VIEWPORT' if hasattr(scene.display.shading, 'background_type') else None
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
ground = bpy.context.active_object
gm = bpy.data.materials.new("ground")
gm.diffuse_color = (0.23, 0.42, 0.22, 1)
ground.data.materials.append(gm)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, location=(0, 0, 0.11))
ball = bpy.context.active_object
bm = bpy.data.materials.new("ball")
bm.diffuse_color = (0.95, 0.95, 0.95, 1)
ball.data.materials.append(bm)
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 45
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

s_meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent == s33 and not o.hide_render]
m_meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o.parent == mix]


def look(center, view, dist=3.3):
    if view == "side":
        off = Vector((dist, -dist * 0.35, 0.35))
    else:
        off = Vector((dist * 0.45, -dist, 0.4))
    cam.location = center + off
    d = center - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


for label, clip, rule, view in POSES:
    objs = import_fbx(os.path.join(LIB, clip + ".fbx"))
    dummy = next(o for o in objs if o.type == 'ARMATURE')
    for o in objs:
        if o.type == 'MESH':
            o.hide_render = True
            o.hide_viewport = True
    act = dummy.animation_data.action
    f0, f1 = (int(round(v)) for v in act.frame_range)
    f = choose_frame(dummy, rule, f0, f1)
    scene.frame_set(f)
    # proporzioni: lunghezze delle ossa del manichino rispetto al Footballer
    worst = 0.0
    for pb in dummy.pose.bones:
        if pb.parent and pb.name in s33.pose.bones and not pb.name.startswith(("Ball", "Bip001-Pelvis")) and pb.name != "Bip001":
            a = (pb.matrix.translation - pb.parent.matrix.translation).length
            sb = s33.pose.bones[pb.name]
            b = (sb.bone.matrix_local.translation - sb.parent.bone.matrix_local.translation).length
            worst = max(worst, abs(a - b) * 0.01)
    s_pose, m_pose = retarget_frame(dummy)
    bpy.context.view_layer.update()
    Ms = s33.matrix_world
    Mm = mix.matrix_world
    # palla nella posizione della clip (per il Mixamo, scalata come il bacino)
    bw = dummy.matrix_world @ dummy.pose.bones["Ball_Bone"].head
    # errori del retargeting: piedi e mani del Mixamo rispetto al Biped, in metri,
    # misurati rispetto al bacino e scalati per l'altezza delle anche
    errs = {}
    for sname, mname in (("Bip001-L-Foot", "LeftFoot"), ("Bip001-R-Foot", "RightFoot"),
                         ("Bip001-L-Hand", "LeftHand"), ("Bip001-R-Hand", "RightHand"),
                         ("Bip001-Head", "Head")):
        sp = (Ms @ s33.pose.bones[sname].head) - (Ms @ s33.pose.bones["Bip001-Pelvis"].head)
        mp = (Mm @ mb(mname).head) - (Mm @ mb("Hips").head)
        errs[mname] = round((sp * hip_ratio - mp).length, 3)
    report[label] = {"clip": clip, "frame": f, "boneLenDiff": round(worst, 4), "endErr": errs}
    print("[compare]", label, clip, "frame", f, "bone len diff %.4f" % worst, errs, flush=True)

    for who in ("s33", "mix"):
        for o in s_meshes:
            o.hide_render = who != "s33"
        for o in m_meshes:
            o.hide_render = who != "mix"
        if who == "s33":
            center = Ms @ s33.pose.bones["Bip001-Pelvis"].head
            ball.location = bw
        else:
            center = Mm @ mb("Hips").head
            hips_s = Ms @ s33.pose.bones["Bip001-Pelvis"].head
            ball.location = center + (bw - hips_s) * hip_ratio
            ball.location.z = bw.z * hip_ratio
        c = center.copy()
        c.z = 0.95
        look(c, view)
        scene.render.filepath = os.path.join(OUT, "%s_%s.png" % (label, who))
        bpy.ops.render.render(write_still=True)
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)

with open(os.path.join(OUT, "retarget_report.json"), "w") as fh:
    json.dump(report, fh, indent=1)
print("---COMPARE-OK---")
