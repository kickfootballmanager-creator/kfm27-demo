"""Esultanze generate con Meshy, sul Calciatore (blocco F).

Meshy ha messo il suo scheletro (24 ossa, nomi alla Mixamo, niente dita) sul
nostro Calciatore nella posa di riposo (meshy_rig_input.py + meshy.py rig) e
ci ha applicato i movimenti (libreria o testo -> movimento). Qui:
- ogni osso del Calciatore ruota nel mondo quanto il corrispondente di Meshy
  rispetto alla posa di riposo (le due pose di riposo sono la stessa: lo
  scheletro di Meshy e' stato adattato alla nostra mesh); dita ferme;
- la clip diventa sul posto: lo spostamento orizzontale dell'anca va nei
  metadati (root: avanti, sinistra, imbardata a 30 fps), come per Studio33;
- metadati per il gioco (ruolo celebrate: entrano nel mazzo delle esultanze).

Scrive src/assets/match3d/anims-meshy.glb (ignorato da git come gli altri
pacchetti). Uso:
  blender -b --factory-startup -P tools/match3d/meshy_build.py
"""
import bpy, os, sys, json, math
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import glb_pack  # noqa: E402

REPO = os.path.dirname(os.path.dirname(HERE))
ASSETS = os.path.join(REPO, 'src', 'assets', 'match3d')
SRC = os.path.join(ASSETS, 'source')
MESHY = os.path.join(SRC, 'meshy')
FPS = 30
# nome nel gioco -> file di Meshy e parte da tenere (secondi; None = tutta)
CLIPS = [
    {'name': 'M01_Backflip', 'src': 'backflip__animation_glb_url.glb', 'from': 0, 'to': None},
    {'name': 'M02_Ruota_Pugni', 'src': 'ruota2_anim__animation_glb_url.glb', 'from': 0, 'to': None},
    {'name': 'M03_Capriola_Braccia', 'src': 'capriola_anim__animation_glb_url.glb', 'from': 0, 'to': None},
]
# catena del busto di Meshy, dall'anca al collo, -> Mixamo
CHAIN = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck']
LIMBS = ['Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm',
         'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
         'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase']


def say(*a):
    print('[meshy]', *a, flush=True)


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = FPS

# il Calciatore come in studio33_build.py (stessi nodi di player.glb)
before = set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=os.path.join(SRC, 'Calciatore.fbx'), automatic_bone_orientation=True)
objs = [o for o in bpy.data.objects if o not in before]
mix = next(o for o in objs if o.type == 'ARMATURE')
mix.name = 'Player'
mix.data.name = 'PlayerRig'
for o in objs:
    if o.type == 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
if mix.animation_data:
    mix.animation_data.action = None
PFX = next(b.name for b in mix.data.bones if b.name.endswith(':Hips')).split(':')[0] + ':'
for pb in mix.pose.bones:
    pb.rotation_mode = 'QUATERNION'
MW = mix.matrix_world.copy()
MW_INV = MW.inverted()
MW_R = MW.to_3x3().normalized()


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


M_ORDER = top_down(mix)
M_REL = {pb.name: (pb.bone.parent.matrix_local.inverted() @ pb.bone.matrix_local if pb.bone.parent else pb.bone.matrix_local.copy()) for pb in mix.pose.bones}
M_REL_INV = {k: v.inverted() for k, v in M_REL.items()}
M_REST_W = {pb.name: (MW @ pb.bone.matrix_local) for pb in mix.pose.bones}


def mapping(src):
    """Ossa di Meshy -> ossa del Calciatore: la catena dall'anca al collo per
    posizione, il resto per nome (Meshy usa i nomi di Mixamo)."""
    names = {b.name: b for b in src.data.bones}
    m = {}
    neck = next(n for n in names if n.lower() == 'neck')
    chain, b = [], names[neck]
    while b:
        chain.append(b.name)
        b = b.parent
    chain.reverse()          # Hips ... neck
    if len(chain) != len(CHAIN):
        say('catena del busto di', len(chain), 'ossa:', chain)
    for s, t in zip(chain, CHAIN):
        m[s] = PFX + t
    for t in LIMBS:
        if t in names:
            m[t] = PFX + t
    return m


def sample(entry):
    path = os.path.join(MESHY, entry['src'])
    if not os.path.exists(path):
        say('manca', entry['src'])
        return None
    before = set(bpy.data.objects)
    acts_before = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    src = next(o for o in new if o.type == 'ARMATURE')
    act = next(a for a in bpy.data.actions if a not in acts_before)
    src.animation_data.action = act
    MAP = mapping(src)
    inv = {v: k for k, v in MAP.items()}
    # posa di riposo di Meshy nel mondo (la stessa forma della nostra)
    s_rest = {b.name: (src.matrix_world @ b.matrix_local) for b in src.data.bones}
    f0, f1 = act.frame_range
    a = f0 + entry['from'] * FPS
    b = f1 if entry['to'] is None else min(f1, f0 + entry['to'] * FPS)
    sc = bpy.context.scene
    frames, hips0 = [], None
    f = a
    while f <= b + 1e-6:
        sc.frame_set(int(f), subframe=f - int(f))
        sw = {pb.name: (src.matrix_world @ pb.matrix) for pb in src.pose.bones}
        hw = sw[inv[PFX + 'Hips']].translation
        if hips0 is None:
            hips0 = hw.copy()
        d = hw - hips0
        # avanti = -Y del mondo (viso verso -Y in Blender), sinistra = +X
        root = [round(-d.y, 4), round(d.x, 4), 0.0]
        pose = {}
        for pb in M_ORDER:
            n = pb.name
            parent = pose[pb.parent.name] if pb.parent else Matrix.Identity(4)
            base = parent @ M_REL[n]
            if n in inv:
                s = inv[n]
                Rw = sw[s].to_3x3().normalized() @ s_rest[s].to_3x3().normalized().inverted() @ M_REST_W[n].to_3x3().normalized()
                R = MW_R.inverted() @ Rw
                if pb.parent is None or n == PFX + 'Hips':
                    # anca: sul posto in orizzontale, in altezza come la clip
                    rest_w = M_REST_W[n].translation
                    pw = Vector((rest_w.x, rest_w.y, rest_w.z + (hw.z - s_rest[s].translation.z)))
                    M = R.to_4x4()
                    M.translation = MW_INV @ pw
                    pose[n] = M
                else:
                    M = R.to_4x4()
                    M.translation = base.translation
                    pose[n] = elbow(pb, M, pose) if n.endswith('ForeArm') else M
            else:
                pose[n] = base
        frames.append({'pose': pose, 'root': root})
        f += 1
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    for x in list(bpy.data.actions):
        if x not in acts_before:
            bpy.data.actions.remove(x)
    return frames


ELBOW = (30.0, 25.0, 20.0)   # cerniera massima (il gioco ne tollera 35), piega da cui si controlla, piega dopo la correzione (gradi)
fixes = {'gomiti': 0}


def elbow(pb, M, pose):
    """Gomito piegato fuori dalla sua cerniera (asse Z locale del braccio, come
    in rig.armAngles del gioco) o al contrario: l'avambraccio si raddrizza fino a
    ELBOW[2] gradi di piega; la mano tiene il suo orientamento."""
    arm = pose[pb.parent.name]
    side = 1 if 'Left' in pb.name else -1
    u = (arm.to_3x3() @ Vector((0, 1, 0))).normalized()
    def check(R):
        f = (R @ Vector((0, 1, 0))).normalized()
        flex = math.degrees(u.angle(f, 0))
        nn = u.cross(f)
        if flex <= ELBOW[1] or nn.length < 0.17:
            return flex, 0.0
        nl = arm.to_3x3().normalized().inverted() @ nn.normalized()
        return flex, math.degrees(math.acos(max(-1, min(1, nl.z * side))))
    R = M.to_3x3().normalized()
    flex, hinge = check(R)
    if hinge <= ELBOW[0]:
        return M
    straight = (arm @ M_REL[pb.name]).to_3x3().normalized().to_quaternion()
    q = R.to_quaternion()
    lo, hi = 0.0, 1.0
    for _ in range(20):
        k = (lo + hi) / 2
        fl, hg = check(q.slerp(straight, k).to_matrix())
        # lontano dalla soglia del controllo (la compressione a 16 bit sposta di qualche decimo)
        if fl <= ELBOW[2] or (fl > ELBOW[1] + 3 and hg <= ELBOW[0] - 5):
            hi = k
        else:
            lo = k
    out = q.slerp(straight, hi).to_matrix().to_4x4()
    out.translation = M.translation
    fixes['gomiti'] += 1
    return out


def write_action(name, frames):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    if not mix.animation_data:
        mix.animation_data_create()
    mix.animation_data.action = act
    n = len(frames)
    for pb in M_ORDER:
        rows_q, rows_t, prev = [], [], None
        for fr in frames:
            pose = fr['pose']
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
            fc = act.fcurve_ensure_for_datablock(mix, path + '.rotation_quaternion', index=i, group_name=pb.name)
            fc.keyframe_points.add(n)
            flat = []
            for k, q in enumerate(rows_q):
                flat += [k + 1, q[i]]
            fc.keyframe_points.foreach_set('co', flat)
            fc.keyframe_points.foreach_set('interpolation', [1] * n)
            fc.update()
        if pb.parent is None:
            for i in range(3):
                fc = act.fcurve_ensure_for_datablock(mix, path + '.location', index=i, group_name=pb.name)
                fc.keyframe_points.add(n)
                flat = []
                for k, t in enumerate(rows_t):
                    flat += [k + 1, t[i]]
                fc.keyframe_points.foreach_set('co', flat)
                fc.keyframe_points.foreach_set('interpolation', [1] * n)
                fc.update()
    mix.animation_data.action = None
    return act


def world(fr, short):
    return MW @ fr['pose'][PFX + short].translation


def meta(entry, frames):
    n = len(frames)
    rows, hips_y = [], []
    for fr in frames:
        h, lf, rf = world(fr, 'Hips'), world(fr, 'LeftFoot'), world(fr, 'RightFoot')
        hips_y.append(h.z)
        # piedi rispetto all'anca: x sinistra, y altezza, z avanti (metri)
        rows += [round(lf.x - h.x, 4), round(lf.z, 4), round(-(lf.y - h.y), 4),
                 round(rf.x - h.x, 4), round(rf.z, 4), round(-(rf.y - h.y), 4)]
    r = frames[-1]['root']
    k = min(4, n - 1)
    a0, a1, b0, b1 = frames[0]['root'], frames[k]['root'], frames[n - 1 - k]['root'], frames[n - 1]['root']
    v_out = round(math.hypot(b1[0] - b0[0], b1[1] - b0[1]) * FPS / k, 3)
    return {
        'src': 'meshy:' + entry['src'], 'role': 'celebrate', 'style': None, 'pack': 'meshy',
        'dur': round((n - 1) / FPS, 4), 'n': n, 'loop': False, 'keepYaw': False,
        'root': [x for fr in frames for x in fr['root']],
        'net': [round(r[0], 3), round(r[1], 3), 0.0], 'ball0': None,
        'vIn': round(math.hypot(a1[0] - a0[0], a1[1] - a0[1]) * FPS / k, 3), 'vOut': v_out,
        'dirOut': round(math.atan2(b1[1] - b0[1], b1[0] - b0[0]), 4) if v_out > 0.3 else None,
        'hipsMin': round(min(hips_y), 3), 'feet': rows,
    }


metas, report = {}, []
for e in CLIPS:
    frames = sample(e)
    if not frames:
        continue
    write_action(e['name'], frames)
    metas[e['name']] = meta(e, frames)
    m = metas[e['name']]
    report.append({'name': e['name'], 'frames': len(frames), 'dur': m['dur'], 'net': m['net'], 'hipsMin': m['hipsMin']})
    say(e['name'], len(frames), 'fotogrammi', m['dur'], 's, spostamento', m['net'], 'anca minima', m['hipsMin'])

if metas:
    EXPORT = dict(export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
                  export_force_sampling=True, export_optimize_animation_size=False,
                  export_optimize_animation_keep_anim_armature=True, export_anim_slide_to_zero=True,
                  export_skins=True, export_morph=False, export_cameras=False, export_lights=False,
                  export_yup=True, export_apply=False, export_extras=False, use_selection=True,
                  export_nla_strips=False, export_bake_animation=False)
    valid = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    EXPORT = {k: v for k, v in EXPORT.items() if k in valid}
    raw = os.path.join(ASSETS, '_raw-meshy.glb')
    bpy.ops.object.select_all(action='DESELECT')
    mix.select_set(True)
    bpy.context.view_layer.objects.active = mix
    bpy.ops.export_scene.gltf(filepath=raw, **EXPORT)
    out = os.path.join(ASSETS, 'anims-meshy.glb')
    body = [PFX + b for b in CHAIN + LIMBS if b not in ('LeftToeBase', 'RightToeBase')]
    info = glb_pack.pack(raw, out, metas, hips=PFX + 'Hips', keep_rest=body)
    os.remove(raw)
    say('scritto', out, round(os.path.getsize(out) / 1e6, 2), 'MB', info, 'gomiti raddrizzati', fixes['gomiti'])
    json.dump(report, open(os.path.join(MESHY, 'meshy-build.json'), 'w', encoding='utf-8'), indent=1)
print('---MESHY-OK---')
