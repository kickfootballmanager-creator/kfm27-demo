"""Pacchetti di animazioni dalla libreria Studio33 Soccer 8, sul Calciatore.

Per ogni clip scelta (studio33_select.plan):
- copia la posa del manichino della clip sul Footballer della libreria (stesse
  ossa Biped), poi la trasferisce allo scheletro Mixamo del Calciatore:
  ogni osso ruota nel mondo quanto il suo corrispondente Biped rispetto alla
  posa di riferimento (il Biped messo nella T-pose del Mixamo);
- IK sulle gambe: la caviglia va dove sta quella Biped, scalata per la
  lunghezza delle gambe (niente piedi che scivolano o affondano per colpa
  delle proporzioni diverse);
- la clip diventa "sul posto" nel riferimento dell'osso Root della libreria:
  lo spostamento e la rotazione della radice restano come metadati;
- metadati per il gioco: traiettoria della radice, piedi e mani per
  fotogramma, appoggi dei piedi nei cicli, e dall'osso Ball_Bone il contatto
  di tiri e passaggi, la palla in conduzione e il punto delle parate.

Scrive src/assets/match3d/anims-core.glb, anims-more.glb, anims-extra.glb (con
i metadati negli extras) e source/studio33-build.json. Tutto ignorato da git:
la licenza della libreria vieta la ridistribuzione.

Uso:
  blender -b --factory-startup -P tools/match3d/studio33_build.py -- [--only a,b] [--packs core,more,extra] [--out dir]
"""
import bpy, os, sys, json, math, time, struct
from mathutils import Vector, Matrix, Quaternion

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from studio33_select import plan, short, KEEP_YAW  # noqa: E402
import glb_pack  # noqa: E402

REPO = os.path.dirname(os.path.dirname(HERE))
ASSETS = os.path.join(REPO, "src", "assets", "match3d")
SRC = os.path.join(ASSETS, "source")
S33 = os.path.join(SRC, "studio33", "Models")
LIB = os.path.join(S33, "Animations", "generic")
MEASURE = os.path.join(SRC, "studio33-measure.json")

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None):
    return argv[argv.index("--" + name) + 1] if "--" + name in argv else default


ONLY = set(arg("only", "").split(",")) - {""}
PACKS = arg("packs", "core,more,extra").split(",")
OUT = arg("out", ASSETS)
REPORT = os.path.join(SRC, "studio33-build.json") if OUT == ASSETS else os.path.join(OUT, "studio33-build.json")
FPS = 30
t_start = time.time()


def say(*a):
    print("[build]", *a, flush=True)


# ---------------------------------------------------------------- ossa
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
INV = {v: k for k, v in MAP.items()}
AIM = {"Hips": "Spine", "Spine": "Spine1", "Spine1": "Spine2", "Spine2": "Neck", "Neck": "Head", "Head": None}
for M in ("Left", "Right"):
    AIM.update({
        M + "Shoulder": M + "Arm", M + "Arm": M + "ForeArm", M + "ForeArm": M + "Hand",
        M + "Hand": M + "HandMiddle1", M + "UpLeg": M + "Leg", M + "Leg": M + "Foot",
        M + "Foot": M + "ToeBase", M + "ToeBase": None,
    })
    for f in ("Thumb", "Index", "Middle", "Ring", "Pinky"):
        AIM[M + "Hand" + f + "1"] = M + "Hand" + f + "2"
        AIM[M + "Hand" + f + "2"] = None


def counterpart(name):
    if "Left" in name:
        return name.replace("Left", "Right")
    if "Right" in name:
        return name.replace("Right", "Left")
    return name


# ---------------------------------------------------------------- scena
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS


def import_fbx(path, auto):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=auto)
    return [o for o in bpy.data.objects if o not in before]


objs = import_fbx(os.path.join(S33, "models", "Footballer.fbx"), False)
s33 = next(o for o in objs if o.type == 'ARMATURE')
s33.name = "S33"
for o in objs:
    if o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)

# il Calciatore importato come in build_player_glb.py: stesse ossa, stessi assi,
# stessi nodi nel GLB di player.glb
objs = import_fbx(os.path.join(SRC, "Calciatore.fbx"), True)
mix = next(o for o in objs if o.type == 'ARMATURE')
mix.name = "Player"
mix.data.name = "PlayerRig"
for o in objs:
    if o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
if mix.animation_data:
    mix.animation_data.action = None
PFX = next(b.name for b in mix.data.bones if b.name.endswith(":Hips")).split(":")[0] + ":"
for pb in mix.pose.bones:
    pb.rotation_mode = 'QUATERNION'
UNIT = mix.matrix_world.to_scale().x      # armature -> metri (0.01: le ossa sono in cm)
assert abs(UNIT - s33.matrix_world.to_scale().x) < 1e-6


def top_down(arm):
    out = []

    def walk(pb):
        out.append(pb)
        for c in pb.children:
            walk(c)
    for pb in arm.pose.bones:
        if pb.parent is None:
            walk(pb)
    return out


S_ORDER, M_ORDER = top_down(s33), top_down(mix)
s_rest = {pb.name: pb.bone.matrix_local.copy() for pb in s33.pose.bones}
m_rest = {pb.name: pb.bone.matrix_local.copy() for pb in mix.pose.bones}


def rest_rel(pb):
    b = pb.bone
    return b.parent.matrix_local.inverted() @ b.matrix_local if b.parent else b.matrix_local.copy()


S_REL = {pb.name: rest_rel(pb) for pb in s33.pose.bones}
M_REL = {pb.name: rest_rel(pb) for pb in mix.pose.bones}
M_REL_INV = {k: v.inverted() for k, v in M_REL.items()}


def mb(short_name):
    return PFX + short_name


# Biped nella posa di riposo del Mixamo: ogni osso riallineato alla direzione
# del suo corrispondente (solo rotazione di "swing", dall'alto in basso)
def m_dir(mname):
    child = AIM.get(mname)
    if not child:
        return None
    return m_rest[mb(child)].translation - m_rest[mb(mname)].translation


s_ref = {}
for pb in S_ORDER:
    name = pb.name
    if pb.parent is None:
        s_ref[name] = s_rest[name].copy()
        continue
    cur = s_ref[pb.parent.name] @ (s_rest[pb.parent.name].inverted() @ s_rest[name])
    mname = MAP.get(name)
    if mname and m_dir(mname) is not None:
        schild = INV.get(AIM[mname])
        if schild:
            sd = (cur @ (s_rest[name].inverted() @ s_rest[schild])).translation - cur.translation
            q = sd.normalized().rotation_difference(m_dir(mname).normalized())
            t = cur.translation.copy()
            cur = Matrix.Translation(t) @ q.to_matrix().to_4x4() @ Matrix.Translation(-t) @ cur
    s_ref[name] = cur
S_REF_INV = {k: v.to_3x3().normalized().inverted() for k, v in s_ref.items()}
M_REST_R = {k: v.to_3x3().normalized() for k, v in m_rest.items()}

# proporzioni: le gambe decidono passo e appoggi. Rapporto fra le altezze
# dell'articolazione dell'anca (nello spazio dell'armatura l'alto e' Y).
RATIO = m_rest[mb("LeftUpLeg")].translation.y / s_rest["Bip001-L-Thigh"].translation.y
# a riposo la caviglia Mixamo sta qui rispetto a quella Biped scalata
ANKLE_FIX = {}
for S, M in (("L", "Left"), ("R", "Right")):
    want = m_rest[mb(M + "UpLeg")].translation + (s_rest["Bip001-%s-Foot" % S].translation - s_rest["Bip001-%s-Thigh" % S].translation) * RATIO
    ANKLE_FIX[M] = m_rest[mb(M + "Foot")].translation - want
LEG = {}
for M in ("Left", "Right"):
    a, b, c = (m_rest[mb(M + x)].translation for x in ("UpLeg", "Leg", "Foot"))
    LEG[M] = ((b - a).length, (c - b).length)
say("rapporto gambe %.4f, correzione caviglia %.1f/%.1f cm, unita' %.3f" % (
    RATIO, ANKLE_FIX["Left"].length, ANKLE_FIX["Right"].length, UNIT))

# asse "avanti" dell'osso Root: nel riposo il personaggio guarda +Z (armatura)
ROOT_FWD_LOCAL = s_rest["Root"].to_3x3().inverted() @ Vector((0, 0, 1))


# ---------------------------------------------------------------- un fotogramma
def rotate_about(m, pivot, R3):
    return Matrix.Translation(pivot) @ R3.to_4x4() @ Matrix.Translation(-pivot) @ m


def leg_ik(m_pose, s_pose, M, S):
    """Caviglia Mixamo sulla caviglia Biped scalata (rispetto all'anca)."""
    up, kn, ft = mb(M + "UpLeg"), mb(M + "Leg"), mb(M + "Foot")
    A = m_pose[up].translation.copy()
    target = A + (s_pose["Bip001-%s-Foot" % S].translation - s_pose["Bip001-%s-Thigh" % S].translation) * RATIO + ANKLE_FIX[M]
    l1, l2 = LEG[M]
    B = m_pose[kn].translation.copy()
    C = m_pose[ft].translation.copy()
    d = target - A
    dist = min(l1 + l2 - 1e-3, max(abs(l1 - l2) + 1e-3, d.length))
    u = d.normalized()
    pv = (B - A) - u * (B - A).dot(u)
    if pv.length < 1e-6:
        pv = Vector((0, 0, 1)) - u * u.z
    pv.normalize()
    cosA = max(-1.0, min(1.0, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)))
    knee = A + u * (l1 * cosA) + pv * (l1 * math.sqrt(1 - cosA * cosA))
    ankle = A + u * dist
    foot_rot = m_pose[ft].to_3x3()
    old = {k: m_pose[k].copy() for k in (up, kn, ft)}
    # coscia verso il nuovo ginocchio, gamba verso la nuova caviglia
    q1 = (B - A).normalized().rotation_difference((knee - A).normalized()).to_matrix()
    m_pose[up] = rotate_about(m_pose[up], A, q1)
    m_pose[kn] = m_pose[up] @ (old[up].inverted() @ old[kn])
    B2 = m_pose[kn].translation.copy()
    C2 = (m_pose[kn] @ (old[kn].inverted() @ old[ft])).translation
    q2 = (C2 - B2).normalized().rotation_difference((ankle - B2).normalized()).to_matrix()
    m_pose[kn] = rotate_about(m_pose[kn], B2, q2)
    # il piede tiene la sua rotazione nel mondo
    m_pose[ft] = Matrix.Translation(ankle) @ foot_rot.to_4x4()
    return old[ft]


def frame_pose(D):
    """Pose (armature space) del Footballer e del Mixamo per il fotogramma corrente."""
    P = D.pose.bones
    s_pose = {}
    for pb in S_ORDER:
        name = pb.name
        if name in P:
            d = P[name]
            local = d.parent.matrix.inverted() @ d.matrix if d.parent else d.matrix.copy()
        else:
            local = S_REL[name]
        s_pose[name] = (s_pose[pb.parent.name] @ local) if pb.parent else local
    m_pose = {}
    for pb in M_ORDER:
        short_n = pb.name[len(PFX):]
        sname = INV.get(short_n)
        parent_pose = m_pose[pb.parent.name] if pb.parent else Matrix.Identity(4)
        placed = parent_pose @ M_REL[pb.name]
        if sname:
            R = s_pose[sname].to_3x3().normalized() @ S_REF_INV[sname] @ M_REST_R[pb.name]
            if short_n == "Hips":
                t = m_rest[pb.name].translation + (s_pose[sname].translation - s_rest[sname].translation) * RATIO
            else:
                t = placed.translation
            m_pose[pb.name] = Matrix.Translation(t) @ R.to_4x4()
        else:
            m_pose[pb.name] = placed
    for M, S in (("Left", "L"), ("Right", "R")):
        old_ft = leg_ik(m_pose, s_pose, M, S)
        # la punta segue il piede con la stessa rotazione relativa; la fine
        # della punta (senza clip) resta alla sua posa di riposo
        tb, te = mb(M + "ToeBase"), mb(M + "Toe_End")
        m_pose[tb] = m_pose[mb(M + "Foot")] @ (old_ft.inverted() @ m_pose[tb])
        if te in m_pose:
            m_pose[te] = m_pose[tb] @ M_REL[te]
        split_twist(m_pose, M)
    return s_pose, m_pose


# Il Biped mette tutta la rotazione attorno all'avambraccio nella mano (fino a
# 109 gradi); lo scheletro Mixamo non ha ossa di torsione e la pelle del
# Calciatore si aspetta che l'avambraccio ne porti una parte: con tutto nel
# polso il polsino si strozza. La mano resta dov'e' nel mondo.
TWIST_SHARE = 0.5


def split_twist(m_pose, M):
    fa, hd = mb(M + "ForeArm"), mb(M + "Hand")
    F, H = m_pose[fa], m_pose[hd]
    Fr, Hr = F.to_3x3().normalized(), H.to_3x3().normalized()
    axis = Fr.inverted() @ (H.translation - F.translation).normalized()
    rel = (Fr.inverted() @ Hr).to_quaternion()
    proj = axis * Vector((rel.x, rel.y, rel.z)).dot(axis)
    tw = Quaternion((rel.w, proj.x, proj.y, proj.z))
    if tw.magnitude < 1e-8:
        return
    tw.normalize()
    ang = 2 * math.atan2(Vector((tw.x, tw.y, tw.z)).dot(axis), tw.w)
    ang = math.atan2(math.sin(ang), math.cos(ang))
    part = Quaternion(axis, ang * TWIST_SHARE)
    m_pose[fa] = Matrix.Translation(F.translation) @ (Fr @ part.to_matrix()).to_4x4()


SPIKE = 0.28          # rad fra due chiavi (8,4 rad/s): sotto non e' uno scatto
SPIKE_RATIO = 2.5     # ... e tante volte piu' veloce delle chiavi vicine


def despike(frames, cyclic):
    """Scatti isolati nelle catture Studio33 (un piede o una mano che in una
    chiave ruota 3 volte piu' veloce delle vicine, fino a 35 rad/s): la
    rotazione locale di quell'osso si leviga (1-4-6-4-1) solo attorno allo
    scatto, poi le pose si ricompongono dall'alto. Ritorna gli scatti tolti."""
    n = len(frames)
    if n < 5:
        return 0
    m = n - 1 if cyclic else n
    loc = []
    for fr in frames:
        P = fr["pose"]
        loc.append({pb.name: (P[pb.parent.name].inverted() @ P[pb.name]) if pb.parent else P[pb.name].copy() for pb in M_ORDER})
    fixed = 0
    for pb in M_ORDER:
        b = pb.name
        qs = [loc[i][b].to_quaternion() for i in range(n)]
        for i in range(1, n):
            if qs[i].dot(qs[i - 1]) < 0:
                qs[i].negate()
        d = [qs[i].rotation_difference(qs[(i + 1) % m if cyclic else i + 1]).angle for i in range(m if cyclic else n - 1)]
        k = len(d)
        hit = set()
        for i in range(k):
            a = d[(i - 1) % k] if (cyclic or i > 0) else 0.0
            c = d[(i + 1) % k] if (cyclic or i < k - 1) else 0.0
            if d[i] > SPIKE and d[i] > SPIKE_RATIO * max(a, c, 0.02):
                for j in range(i - 1, i + 3):
                    hit.add(j % m if cyclic else j)
        hit = {j for j in hit if 0 <= j < m}
        if not hit:
            continue
        fixed += 1
        new = {}
        for i in hit:
            acc = Quaternion((0, 0, 0, 0))
            for kk, w in ((-2, 1), (-1, 4), (0, 6), (1, 4), (2, 1)):
                j = (i + kk) % m if cyclic else min(n - 1, max(0, i + kk))
                q = qs[j] if qs[j].dot(qs[i]) >= 0 else -qs[j]
                acc = Quaternion((acc.w + q.w * w, acc.x + q.x * w, acc.y + q.y * w, acc.z + q.z * w))
            acc.normalize()
            new[i] = acc
        for i, q in new.items():
            t = loc[i][b].translation.copy()
            loc[i][b] = Matrix.Translation(t) @ q.to_matrix().to_4x4()
            if cyclic and i == 0:
                loc[n - 1][b] = loc[i][b].copy()
    if fixed:
        for i, fr in enumerate(frames):
            P = {}
            for pb in M_ORDER:
                P[pb.name] = (P[pb.parent.name] @ loc[i][pb.name]) if pb.parent else loc[i][pb.name]
            fr["pose"] = P
    return fixed


def smooth_toes(frames, cyclic):
    """Punte dei piedi levigate nel tempo (rispetto al piede, 1-4-6-4-1): nelle
    catture Studio33 la punta torna piatta in un solo fotogramma a fine spinta
    (fino a 25 rad/s), uno scatto visibile della scarpa. I cicli restano chiusi."""
    n = len(frames)
    if n < 5:
        return
    m = n - 1 if cyclic else n        # nei cicli l'ultimo fotogramma ripete il primo
    for M in ("Left", "Right"):
        ft, tb = mb(M + "Foot"), mb(M + "ToeBase")
        rel = [(fr["pose"][ft].inverted() @ fr["pose"][tb]) for fr in frames]
        qs = [r.to_quaternion() for r in rel]
        for i in range(1, n):
            if qs[i].dot(qs[i - 1]) < 0:
                qs[i].negate()
        out = []
        for i in range(m):
            acc = Quaternion((0, 0, 0, 0))
            for k, w in ((-2, 1), (-1, 4), (0, 6), (1, 4), (2, 1)):
                j = (i + k) % m if cyclic else min(n - 1, max(0, i + k))
                q = qs[j] if qs[j].dot(qs[i]) >= 0 else -qs[j]
                acc = Quaternion((acc.w + q.w * w, acc.x + q.x * w, acc.y + q.y * w, acc.z + q.z * w))
            acc.normalize()
            out.append(acc)
        if cyclic:
            out.append(out[0].copy())
        for fr, r, q in zip(frames, rel, out):
            fr["pose"][tb] = fr["pose"][ft] @ (Matrix.Translation(r.translation) @ q.to_matrix().to_4x4())
            te = mb(M + "Toe_End")
            if te in fr["pose"]:
                fr["pose"][te] = fr["pose"][tb] @ M_REL[te]


def root_frame(D):
    """Riferimento del Root: posizione a terra e imbardata (antioraria, 0 = +Z)."""
    r = D.pose.bones["Root"].matrix
    fwd = r.to_3x3() @ ROOT_FWD_LOCAL
    yaw = math.atan2(fwd.x, fwd.z)
    pos = Vector((r.translation.x, 0.0, r.translation.z))
    return pos, yaw


def rf_matrix(pos, yaw):
    return Matrix.Translation(pos) @ Matrix.Rotation(yaw, 4, 'Y')


# ---------------------------------------------------------------- una clip
def sample_clip(src, keep_yaw=False, cyclic=False):
    """Fotogrammi della clip: pose Mixamo sul posto e punti utili, in metri,
    nel riferimento del Root del fotogramma (x sinistra, y su, z avanti).
    keep_yaw: si toglie solo lo spostamento, la rotazione resta nella clip.
    cyclic: clip in ciclo (le punte si levigano senza aprire il ciclo)."""
    acts_before = set(bpy.data.actions)
    objs = import_fbx(os.path.join(LIB, src + ".fbx"), False)
    D = next(o for o in objs if o.type == 'ARMATURE')
    for o in objs:
        if o.type == 'MESH':
            bpy.data.objects.remove(o, do_unlink=True)
    act = D.animation_data.action
    f0, f1 = (int(round(v)) for v in act.frame_range)
    frames = []
    pos0 = yaw0 = None
    prev_yaw = None
    unwrap = 0.0
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        s_pose, m_pose = frame_pose(D)
        pos, yaw = root_frame(D)
        if pos0 is None:
            pos0, yaw0 = pos.copy(), yaw
        if prev_yaw is not None:
            unwrap += math.atan2(math.sin(yaw - prev_yaw), math.cos(yaw - prev_yaw))
        prev_yaw = yaw
        fyaw = yaw0 if keep_yaw else yaw
        RFi = rf_matrix(pos, fyaw).inverted()
        ip = {k: RFi @ v for k, v in m_pose.items()}
        # traiettoria della radice nel riferimento del primo fotogramma, scalata
        d = Matrix.Rotation(-yaw0, 4, 'Y') @ (pos - pos0)
        pt = lambda v: [round(v.x * UNIT, 4), round(v.y * UNIT, 4), round(v.z * UNIT, 4)]
        palm = lambda M: pt(ip[mb(M + "Hand")].translation.lerp(ip[mb(M + "HandMiddle1")].translation, 0.6))

        def spalm(S):
            # palmo del Biped originale: dove la libreria ha registrato il contatto
            h = s_pose["Bip001-%s-Hand" % S].translation.lerp(s_pose["Bip001-%s-Finger2" % S].translation, 0.6)
            w = Vector(((h.x - pos.x) * RATIO + pos.x, h.y * RATIO, (h.z - pos.z) * RATIO + pos.z))
            return pt(RFi @ w)
        # la palla scalata come il personaggio, rispetto al Root
        bt = D.pose.bones["Ball_Bone"].matrix.translation
        ball = RFi @ Vector(((bt.x - pos.x) * RATIO + pos.x, bt.y * RATIO, (bt.z - pos.z) * RATIO + pos.z))
        frames.append({
            "pose": ip,
            "root": [round(d.z * UNIT * RATIO, 4), round(d.x * UNIT * RATIO, 4), round(unwrap, 4)],
            # imbardata del riferimento dei punti qui sotto (0 se la rotazione resta nella clip)
            "fyaw": 0.0 if keep_yaw else round(unwrap, 4),
            "hips": pt(ip[mb("Hips")].translation),
            "lf": pt(ip[mb("LeftFoot")].translation), "rf": pt(ip[mb("RightFoot")].translation),
            "lt": pt(ip[mb("LeftToeBase")].translation), "rt": pt(ip[mb("RightToeBase")].translation),
            "lh": palm("Left"), "rh": palm("Right"), "slh": spalm("L"), "srh": spalm("R"),
            "head": pt(ip[mb("Head")].translation.lerp(ip[mb("HeadTop_End")].translation, 0.45)),
            "ball": [round(ball.x * UNIT, 4), round(ball.y * UNIT, 4), round(ball.z * UNIT, 4)],
        })
    bpy.data.objects.remove(D, do_unlink=True)
    # l'importer FBX tiene le sue azioni anche senza utenti: via, o finirebbero nell'export
    for a in list(bpy.data.actions):
        if a not in acts_before:
            bpy.data.actions.remove(a)
    smooth_toes(frames, cyclic)
    # una levigatura puo' lasciare uno scatto piu' piccolo accanto: al massimo tre passate
    for _ in range(3):
        if not despike(frames, cyclic):
            break
    return frames


MIRROR_S = Matrix.Diagonal((-1.0, 1.0, 1.0, 1.0))


def mirror_frames(frames):
    """Clip riflessa: ogni osso prende la posa del simmetrico, ribaltata sul
    piano x=0; punti con la sinistra cambiata di segno, sinistro e destro scambiati."""
    out = []
    pairs = (("lf", "rf"), ("lt", "rt"), ("lh", "rh"), ("slh", "srh"))
    for fr in frames:
        n = {"pose": {k: MIRROR_S @ fr["pose"][counterpart(k)] @ MIRROR_S for k in fr["pose"]}}
        r = fr["root"]
        n["root"] = [r[0], -r[1], -r[2]]
        n["fyaw"] = -fr["fyaw"]
        for k in ("hips", "head", "ball"):
            v = fr[k]
            n[k] = [-v[0], v[1], v[2]]
        for a, b in pairs:
            n[a] = [-fr[b][0], fr[b][1], fr[b][2]]
            n[b] = [-fr[a][0], fr[a][1], fr[a][2]]
        out.append(n)
    return out


def write_action(name, frames):
    """Azione sul Player: rotazioni di tutte le ossa, posizione della sola anca."""
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    if not mix.animation_data:
        mix.animation_data_create()
    mix.animation_data.action = act
    n = len(frames)
    for pb in M_ORDER:
        rows_q, rows_t = [], []
        prev = None
        for fr in frames:
            pose = fr["pose"]
            parent_pose = pose[pb.parent.name] if pb.parent else Matrix.Identity(4)
            basis = M_REL_INV[pb.name] @ parent_pose.inverted() @ pose[pb.name]
            q = basis.to_quaternion()
            if prev is not None and prev.dot(q) < 0:
                q.negate()
            prev = q
            rows_q.append(q)
            rows_t.append(basis.translation)
        path = 'pose.bones["%s"]' % pb.name
        for i in range(4):
            fc = act.fcurve_ensure_for_datablock(mix, path + ".rotation_quaternion", index=i, group_name=pb.name)
            fc.keyframe_points.add(n)
            flat = []
            for k, q in enumerate(rows_q):
                flat += [k + 1, q[i]]
            fc.keyframe_points.foreach_set("co", flat)
            fc.keyframe_points.foreach_set("interpolation", [1] * n)
            fc.update()
        if pb.parent is None:
            for i in range(3):
                fc = act.fcurve_ensure_for_datablock(mix, path + ".location", index=i, group_name=pb.name)
                fc.keyframe_points.add(n)
                flat = []
                for k, t in enumerate(rows_t):
                    flat += [k + 1, t[i]]
                fc.keyframe_points.foreach_set("co", flat)
                fc.keyframe_points.foreach_set("interpolation", [1] * n)
                fc.update()
    mix.animation_data.action = None
    return act


# ---------------------------------------------------------------- metadati
def lerp_row(frames, key, t):
    """Valore di `key` al tempo t (s), fra due fotogrammi."""
    x = t * FPS
    i = max(0, min(len(frames) - 1, int(math.floor(x))))
    j = min(len(frames) - 1, i + 1)
    a = x - i
    va, vb = frames[i][key], frames[j][key]
    return [va[k] + (vb[k] - va[k]) * a for k in range(len(va))]


def rnd(v, k=4):
    return [round(x, k) for x in v]


def dist3(a, b):
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


def world_point(fr, p):
    """Punto nel riferimento del Root del primo fotogramma (x sinistra, z avanti)."""
    f, l, _ = fr["root"]
    y = fr.get("fyaw", fr["root"][2])
    c, s = math.cos(y), math.sin(y)
    # p: [x sinistra, y su, z avanti] nel riferimento del Root del fotogramma
    return [l + p[0] * c + p[2] * s, p[1], f - p[0] * s + p[2] * c]


def feet_row(fr):
    """Come feetPose del gioco: piedi rispetto all'anca, x sinistra, y altezza, z avanti."""
    h = fr["hips"]
    return [round(fr["lf"][0] - h[0], 4), fr["lf"][1], round(fr["lf"][2] - h[2], 4),
            round(fr["rf"][0] - h[0], 4), fr["rf"][1], round(fr["rf"][2] - h[2], 4)]


def speed_series(frames, key):
    out = []
    for i in range(len(frames) - 1):
        a, b = world_point(frames[i], frames[i][key]), world_point(frames[i + 1], frames[i + 1][key])
        out.append(dist3(a, b) * FPS)
    out.append(out[-1] if out else 0)
    return out


def contact_foot(frames, keys=("rt", "lt", "rf", "lf")):
    """Contatto del piede con la palla. Il piede che calcia (o affonda) e'
    quello con lo slancio piu' veloce della clip; il contatto e' il suo
    fotogramma piu' vicino alla palla entro 0,2 s dal picco dello slancio.
    Senza palla nella clip (Ball_Bone sotto terra): il picco stesso."""
    speeds = {k: speed_series(frames, k) for k in keys}
    key = max(keys, key=lambda k: max(speeds[k]))
    peak = max(range(len(frames)), key=lambda j: speeds[key][j])
    if frames[0]["ball"][1] < 0:
        fr = frames[peak]
        return {"t": round(peak / FPS, 4), "foot": "L" if key[0] == "l" else "R", "dist": None,
                "ball": None, "ballW": None, "yaw": fr["root"][2], "noBall": True}
    side = key[0]
    w = int(round(0.2 * FPS))
    best = None
    for i in range(max(0, peak - w), min(len(frames), peak + w + 1)):
        fr = frames[i]
        for k in (side + "t", side + "f"):
            d = dist3(fr[k], fr["ball"])
            if best is None or d < best[0]:
                best = (d, i)
    d, i = best
    if d > 0.3:
        # lo slancio piu' veloce non e' sulla palla (tiro al volo, intercetto):
        # il piede veloce che le passa piu' vicino
        per = []
        for k in keys:
            pk = max(speeds[k])
            for j, fr in enumerate(frames):
                if speeds[k][j] >= pk * 0.5:
                    per.append((dist3(fr[k], fr["ball"]), j, k))
        dd, jj, kk = min(per)
        if dd < d:
            d, i, side = dd, jj, kk[0]
    fr = frames[i]
    return {"t": round(i / FPS, 4), "foot": "L" if side == "l" else "R", "dist": round(d, 3),
            "ball": fr["ball"], "ballW": rnd(world_point(fr, fr["ball"])), "yaw": fr["root"][2]}


def contact_part(frames, key):
    best = None
    for i, fr in enumerate(frames):
        d = dist3(fr[key], fr["ball"])
        if best is None or d < best[0]:
            best = (d, i)
    d, i = best
    return {"t": round(i / FPS, 4), "dist": round(d, 3), "ball": frames[i]["ball"],
            "ballW": rnd(world_point(frames[i], frames[i]["ball"]))}


def palms_mid(fr):
    return [(fr["lh"][k] + fr["rh"][k]) / 2 for k in range(3)]


def loop_gait(frames):
    """Cicli: velocita' naturale, verso, appoggi (fase 0 = destro a terra) e
    pose dei piedi per fase, come measureClips del gioco."""
    n = len(frames) - 1            # l'ultimo fotogramma ripete il primo
    D = n / FPS
    r0, r1 = frames[0]["root"], frames[n]["root"]
    speed = math.hypot(r1[0] - r0[0], r1[1] - r0[1]) / D
    dirn = math.atan2(r1[1] - r0[1], r1[0] - r0[0]) if speed > 0.05 else 0.0
    # campioni fitti (4 per fotogramma) delle punte e caviglie nel mondo
    N = n * 4
    rows = []
    for k in range(N + 1):
        t = k / N * D
        fr = {"root": lerp_row(frames, "root", t), "fyaw": lerp_row(frames, "root", t)[2]}
        row = {}
        for key in ("lt", "rt", "lf", "rf"):
            row[key] = world_point(fr, lerp_row(frames, key, t))
        rows.append(row)

    def planted(side):
        out = [False] * N
        for key in (side + "t", side + "f"):
            ys = [rows[k][key][1] for k in range(N)]
            lo = min(ys)
            for k in range(N):
                a, b = rows[(k - 1) % N][key], rows[(k + 1) % N][key]
                v = math.hypot(b[0] - a[0], b[2] - a[2]) / (2 * D / N)
                if ys[k] < lo + 0.06 and (speed < 0.2 or v < 0.35 * max(speed, 0.5)):
                    out[k] = True
        return [on and (out[(k - 1) % N] or out[(k + 1) % N]) for k, on in enumerate(out)]

    g = {"speed": round(speed, 4), "dir": round(dirn, 4), "dur": round(D, 4)}
    runs = {}
    for side, K in (("r", "R"), ("l", "L")):
        c = planted(side)
        rs = []
        for k in range(N):
            if not c[k] or c[(k - 1) % N]:
                continue
            m = 0
            while m < N and c[(k + m) % N]:
                m += 1
            rs.append((k, m))
        best, blen = max(rs, key=lambda r: r[1]) if rs else (0, 0)
        g["strike" + K] = round(best / N, 4)
        g["stance" + K] = round(blen / N, 4)
        # gli appoggi brevi sono il piede che sfiora l'erba, non un passo
        top = max((r[1] for r in rs), default=0)
        runs[K] = [(r[0], K, r[1]) for r in rs if r[1] >= 0.4 * top]
    # Piu' coppie di passi in un ciclo (passi laterali, alcune corse): tutti
    # gli appoggi, alternati destro e sinistro. La fase comune copre una
    # coppia; con un solo appoggio per piede resta quello piu' lungo.
    ev = sorted(runs["R"] + runs["L"])
    k = len(runs["R"])
    if 1 < k <= 10 and len(runs["L"]) == k and all(ev[i][1] != ev[(i + 1) % len(ev)][1] for i in range(len(ev))):
        i0 = next(i for i, e in enumerate(ev) if e[1] == "R")
        ev = ev[i0:] + ev[:i0]
        g["strikesR"] = [round(ev[2 * i][0] / N, 4) for i in range(k)]
        g["strikesL"] = [round(ev[2 * i + 1][0] / N, 4) for i in range(k)]
        g["strikeR"], g["strikeL"] = g["strikesR"][0], g["strikesL"][0]
        g["stanceR"] = round(sum(ev[2 * i][2] for i in range(k)) / k / N, 4)
        g["stanceL"] = round(sum(ev[2 * i + 1][2] for i in range(k)) / k / N, 4)
    return g


def gait_pairs(g):
    """Numero di coppie di passi del ciclo (1 se la clip ne ha una sola)."""
    return len(g.get("strikesR", [0]))


def clip_frac(g, phase, c=0):
    """Fase comune della coppia `c` -> frazione della clip (come clipFrac del gioco)."""
    u = phase - math.floor(phase)
    sR, sL = g.get("strikesR", [g["strikeR"]]), g.get("strikesL", [g["strikeL"]])
    k = len(sR)
    c %= k
    gap = (sL[c] - sR[c]) % 1.0 or 0.5 / k
    back = 1 - gap if k == 1 else ((sR[(c + 1) % k] - sL[c]) % 1.0 or 0.5 / k)
    if u < 0.5:
        return (sR[c] + u * 2 * gap) % 1.0
    return (sL[c] + (u - 0.5) * 2 * back) % 1.0


def touches(frames):
    """Conduzione: i tocchi di palla (la palla accelera nel mondo) e il piede."""
    out = []
    n = len(frames)
    wp = [world_point(fr, fr["ball"]) for fr in frames]
    sp = [dist3(wp[i + 1], wp[i]) * FPS for i in range(n - 1)]
    for i in range(1, n - 2):
        if sp[i] > sp[i - 1] + 1.5 and sp[i] >= sp[i + 1] * 0.9:
            fr = frames[i]
            dl = min(dist3(fr["lt"], fr["ball"]), dist3(fr["lf"], fr["ball"]))
            dr = min(dist3(fr["rt"], fr["ball"]), dist3(fr["rf"], fr["ball"]))
            out.append({"t": round(i / FPS, 4), "foot": "L" if dl < dr else "R"})
    return out


def build_meta(e, frames):
    n = len(frames)
    role = e["role"]
    loop = role in ("loco", "idle", "ready")
    m = {
        "src": e["src"], "role": role, "style": e.get("style"), "pack": e["pack"],
        "dur": round((n - 1) / FPS, 4), "n": n, "loop": loop, "keepYaw": role in KEEP_YAW,
        "root": [x for fr in frames for x in fr["root"]],
    }
    r = frames[-1]["root"]
    m["net"] = [round(r[0], 3), round(r[1], 3), round(r[2], 4)]
    m["ball0"] = rnd(frames[0]["ball"])
    # velocita' della radice all'inizio e alla fine (partenze, arresti, svolte)
    k = min(4, n - 1)
    a0, a1 = frames[0]["root"], frames[k]["root"]
    b0, b1 = frames[n - 1 - k]["root"], frames[n - 1]["root"]
    m["vIn"] = round(math.hypot(a1[0] - a0[0], a1[1] - a0[1]) * FPS / k, 3)
    m["vOut"] = round(math.hypot(b1[0] - b0[0], b1[1] - b0[1]) * FPS / k, 3)
    m["dirOut"] = round(math.atan2(b1[1] - b0[1], b1[0] - b0[0]), 4) if m["vOut"] > 0.3 else None
    ys = [fr["hips"][1] for fr in frames]
    m["hipsMin"] = round(min(ys), 3)
    # piedi per fotogramma: servono a far partire un gesto dal passo in corso
    if not loop:
        m["feet"] = [x for fr in frames for x in feet_row(fr)]
    else:
        g = loop_gait(frames)
        m["gait"] = g
        # 48 pose per fase, per ogni coppia di passi del ciclo
        poses = []
        for c in range(gait_pairs(g)):
            for kk in range(48):
                t = clip_frac(g, kk / 48, c) * g["dur"]
                fr = {kk2: lerp_row(frames, kk2, t) for kk2 in ("hips", "lf", "rf")}
                poses += feet_row(fr)
        g["poses"] = [round(x, 4) for x in poses]
        if e.get("style") == "dribble":
            # tocchi di palla: il gioco tocca la palla al passo della clip
            g["touches"] = touches(frames)
    if e.get("style") in ("keeper", "keeperBall") or role.startswith("gk"):
        m["palms"] = [x for fr in frames for x in (fr["lh"] + fr["rh"])]
    ev = {}
    if role in ("pass", "long", "shot", "kickoff", "tackle", "intercept", "slide"):
        c = contact_foot(frames)
        if c:
            ev["contact"] = c
    if role == "trap":
        c = contact_foot(frames, ("rt", "lt", "rf", "lf"))
        ev["ball0"] = frames[0]["ball"]
        ev["ballEnd"] = frames[-1]["ball"]
        ev["yawEnd"] = frames[-1]["root"][2]
        if c:
            ev["touch"] = c
    if role == "header":
        ev["contact"] = contact_part(frames, "head")
    if role in ("gkSave", "gkPunch", "gkCatch"):
        # la palla dove le mani la incontrano: il fotogramma con i palmi piu'
        # vicini alla palla (nelle prese la palla poi segue le mani)
        # (i palmi del Biped: il Calciatore ha le braccia piu' corte, l'IK
        # delle braccia nel gioco chiude la differenza)
        smid = lambda fr: [(fr["slh"][k] + fr["srh"][k]) / 2 for k in range(3)]
        sclose = lambda fr: min(dist3(fr["slh"], fr["ball"]), dist3(fr["srh"], fr["ball"]), dist3(smid(fr), fr["ball"]))
        best = None
        for i, fr in enumerate(frames):
            d = sclose(fr)
            if best is None or d < best[0]:
                best = (d, i)
        d, i = best
        if role == "gkCatch" and dist3(smid(frames[0]), frames[0]["ball"]) < 0.3:
            # palla attaccata alle mani fin dall'inizio: la presa e' dove le
            # braccia arrivano piu' lontano, prima di ricadere
            h0 = world_point(frames[0], frames[0]["hips"])
            i = max(range(max(1, int(n * 0.75))), key=lambda k: dist3(world_point(frames[k], smid(frames[k])), h0))
            d = sclose(frames[i])
        elif role == "gkCatch":
            for j in range(n):
                fr = frames[j]
                if dist3(smid(fr), fr["ball"]) < 0.25 and all(dist3(smid(q), q["ball"]) < 0.35 for q in frames[j:j + 6]):
                    i, d = j, dist3(smid(fr), fr["ball"])
                    break
        fr = frames[i]
        near = min((fr["lh"], fr["rh"]), key=lambda h: dist3(h, fr["ball"]))
        ev["contact"] = {"t": round(i / FPS, 4), "dist": round(d, 3),
                         "ballW": rnd(world_point(fr, fr["ball"])), "hands": rnd(world_point(fr, near))}
        ev["dive"] = m["hipsMin"] < 0.55
    if role in ("fall",):
        # a terra: il bacino piu' basso; rialzato: di nuovo sopra 0,75 m dopo
        lo = min(range(n), key=lambda i: frames[i]["hips"][1])
        up = next((i for i in range(lo, n) if frames[i]["hips"][1] > 0.75), n - 1)
        down = next((i for i in range(n) if frames[i]["hips"][1] < frames[lo]["hips"][1] + 0.08), lo)
        # ultimo istante ancora a terra prima del rialzo: qui si puo' restare fermi
        rest = max(i for i in range(lo, up + 1) if frames[i]["hips"][1] < frames[lo]["hips"][1] + 0.1)
        ev["down"] = round(down / FPS, 4)
        ev["ground"] = round(lo / FPS, 4)
        ev["rest"] = round(rest / FPS, 4)
        ev["up"] = round(up / FPS, 4)
    if role in ("gkThrow", "gkKick"):
        # rilascio: la palla si stacca dalla mano piu' vicina; prima, quando le
        # mani si separano, la palla resta in una mano sola
        rel, one = None, None
        for i, fr in enumerate(frames):
            dl, dr = dist3(fr["lh"], fr["ball"]), dist3(fr["rh"], fr["ball"])
            if one is None and dist3(palms_mid(fr), fr["ball"]) > 0.2 and min(dl, dr) < 0.2:
                one = {"at": round(i / FPS, 4), "hand": "Left" if dl < dr else "Right"}
            if min(dl, dr) > 0.25:
                rel = i
                break
        if one:
            ev["oneHand"] = one
        c = contact_foot(frames) if role == "gkKick" else None
        ev["release"] = round((rel if rel is not None else n // 2) / FPS, 4)
        if c:
            ev["contact"] = c
    if role in ("start", "stop", "turn", "turnInPlace", "arch"):
        # quando la rotazione e' a meta', e quanto dura
        yaw = [fr["root"][2] for fr in frames]
        tot = yaw[-1]
        if abs(tot) > 0.1:
            half = next((i for i in range(n) if abs(yaw[i]) >= abs(tot) / 2), n - 1)
            beg = next((i for i in range(n) if abs(yaw[i]) >= abs(tot) * 0.1), 0)
            end = next((i for i in range(n) if abs(yaw[i]) >= abs(tot) * 0.9), n - 1)
            ev["turn"] = {"half": round(half / FPS, 4), "from": round(beg / FPS, 4), "to": round(end / FPS, 4)}
    if role == "feint":
        ev["touches"] = touches(frames)
    if ev:
        m["ev"] = ev
    return m


# ---------------------------------------------------------------- selezione
measure = json.load(open(MEASURE, encoding="utf-8"))
entries = plan(measure)
if ONLY:
    entries = [e for e in entries if e["src"] in ONLY or short(e["src"]) in ONLY]
entries = [e for e in entries if e["pack"] in PACKS]
say("clip da costruire:", len(entries), "pacchetti", PACKS)


report = {"ratio": RATIO, "clips": [], "packs": {}}
EXPORT = dict(
    export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
    export_force_sampling=True, export_optimize_animation_size=False,
    export_optimize_animation_keep_anim_armature=True, export_anim_slide_to_zero=True,
    export_skins=True, export_morph=False, export_cameras=False, export_lights=False,
    export_yup=True, export_apply=False, export_extras=False, use_selection=True,
    export_nla_strips=False, export_bake_animation=False,
)
valid = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
EXPORT = {k: v for k, v in EXPORT.items() if k in valid}

# un pacchetto alla volta: l'exporter prende tutte le azioni del file
for pack in PACKS:
    todo = [e for e in entries if e["pack"] == pack]
    if not todo:
        continue
    metas, cache, t_sample = {}, {}, 0.0
    for i, e in enumerate(todo):
        t0 = time.time()
        frames = cache.get(e["src"]) or sample_clip(e["src"], e["role"] in KEEP_YAW, e["role"] in ("loco", "idle", "ready"))
        # l'originale serve ancora alla sua copia specchiata
        if not e.get("mirror") and any(x.get("mirror") and x["src"] == e["src"] for x in todo):
            cache[e["src"]] = frames
        if e.get("mirror"):
            frames = mirror_frames(frames)
            cache.pop(e["src"], None)
        name = e.get("mirror") or e["src"]
        write_action(name, frames)
        metas[name] = build_meta(e, frames)
        t_sample += time.time() - t0
        report["clips"].append({"name": name, "source": e["src"], "pack": pack, "role": e["role"],
                                "style": e.get("style"), "frames": len(frames),
                                "uses": [e["role"] + (("/" + e["style"]) if e.get("style") else "")]})
        if i % 25 == 0:
            say("%s %d/%d %s  (%.0fs)" % (pack, i + 1, len(todo), name, time.time() - t_start))
    say("%s: campionamento e retargeting %.1fs" % (pack, t_sample))
    raw = os.path.join(OUT, "_raw-" + pack + ".glb")
    t0 = time.time()
    # solo lo scheletro del Calciatore (il Footballer serve solo al retargeting)
    bpy.ops.object.select_all(action='DESELECT')
    mix.select_set(True)
    bpy.context.view_layer.objects.active = mix
    bpy.ops.export_scene.gltf(filepath=raw, **EXPORT)
    say("export %s: %.1fs" % (pack, time.time() - t0))
    out = os.path.join(OUT, "anims-" + pack + ".glb")
    info = glb_pack.pack(raw, out, metas, hips=mb("Hips"))
    os.remove(raw)
    report["packs"][pack] = info
    say("scritto %s: %d clip, %.2f MB, %s" % (out, len(metas), os.path.getsize(out) / 1e6, info))
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

with open(REPORT, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=1)
say("fatto in %.1fs" % (time.time() - t_start))
print("---BUILD-OK---")
