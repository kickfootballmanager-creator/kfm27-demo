"""Sagome del pubblico e fila di seggiolini per lo stadio (blocco E), rese
dai modelli del progetto 3ds Max esportati in FBX (debug/stadio/asset).

  crowd.png  una riga di celle CELL_W x CELL_H: prima meta' i colori (alfa =
             forma), seconda meta' la maschera (rosso = maglia, sciarpa,
             bandiera: prendono il colore della squadra). In ogni meta' prima
             le P persone a braccia giu', poi le stesse a braccia su.
  seats.png  32 posti in fila visti dal campo (aperti e chiusi a caso).

  blender -b --factory-startup -P tools/match3d/stadium_sprites.py -- [--asset DIR] [--out DIR]
"""
import bpy, sys, os, math, glob, random
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(os.environ.get('KFM_MAIN', os.path.join(ROOT, '..', 'kfm27')), 'debug', 'stadio')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default
ASSET = arg('--asset', os.path.join(SRC, 'asset'))
OUT = arg('--out', os.path.join(SRC, 'sprites'))
CELL_W, CELL_H = 64, 128
FRAME_H = 2.3            # metri inquadrati in altezza (persona con braccia alzate o bandiera)
ELEV = math.radians(8)   # la telecamera di gioco vede le tribune quasi di fronte, poco dall'alto
SHIRT = ('Spine', 'Clavicle', 'UpperArm')
os.makedirs(OUT, exist_ok=True)
random.seed(3)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE_NEXT'
    sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.75, 0.8, 0.9, 1)
    bg.inputs[1].default_value = 0.55
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 2.6
    sun.rotation_euler = (math.radians(50), 0, math.radians(20))
    sc.collection.objects.link(sun)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    sc.collection.objects.link(cam)
    sc.camera = cam
    return sc, cam


def aim(cam, center, width, height, px_w, px_h, front=Vector((0, -1, 0))):
    """Ortografica davanti a `center`, rivolta verso +front opposto, poco dall'alto."""
    d = Vector((front.x * math.cos(ELEV), front.y * math.cos(ELEV), math.sin(ELEV)))
    cam.location = center + d * 20
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = px_w, px_h
    cam.data.ortho_scale = max(width, height)
    sc.render.pixel_aspect_x = sc.render.pixel_aspect_y = 1
    cam.data.sensor_fit = 'VERTICAL' if height >= width else 'HORIZONTAL'
    cam.data.clip_end = 100


def render_px():
    sc = bpy.context.scene
    path = os.path.join(OUT, '_r.png')
    sc.render.filepath = path
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(path)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)[::-1]
    bpy.data.images.remove(im)
    return a


def mask_materials(objs, shirt_of):
    """Emissione bianca dove c'e' maglia, sciarpa o bandiera, nera altrove (colori dei vertici)."""
    mat = bpy.data.materials.new('mask')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    attr = nt.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'mask'
    em = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(attr.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    saved = {}
    for o in objs:
        me = o.data
        if 'mask' not in me.color_attributes:
            a = me.color_attributes.new('mask', 'BYTE_COLOR', 'POINT')
            vals = shirt_of(o)
            c = np.zeros((len(me.vertices), 4), dtype=np.float32); c[:, 3] = 1
            c[:, 0] = c[:, 1] = c[:, 2] = vals
            a.data.foreach_set('color', c.ravel())
        saved[o] = [s.material for s in o.material_slots]
        for s in o.material_slots:
            s.material = mat
    return saved


def restore(saved):
    for o, mats in saved.items():
        for s, m in zip(o.material_slots, mats):
            s.material = m


def shirt_weights(o, arm):
    """1 per i vertici che seguono soprattutto busto, clavicole e braccia; per
    sciarpe e bandiere (oggetti senza pelle) tutto 1."""
    n = len(o.data.vertices)
    name = o.name.lower()
    if any(k in name for k in ('scarf', 'flag', 'sciarp', 'bandier')) and 'stick' not in name and 'pole' not in name:
        return np.ones(n, dtype=np.float32)
    groups = {g.index: g.name for g in o.vertex_groups}
    if not groups:
        return np.zeros(n, dtype=np.float32)
    out = np.zeros(n, dtype=np.float32)
    for v in o.data.vertices:
        best, bw = None, 0
        for g in v.groups:
            if g.weight > bw:
                best, bw = groups.get(g.group, ''), g.weight
        if best and any(k in best for k in SHIRT):
            out[v.index] = 1
    return out


def hand_height(arm, frame):
    bpy.context.scene.frame_set(frame)
    hs = [arm.matrix_world @ b.head for b in arm.pose.bones if b.name.endswith(('L Hand', 'R Hand'))]
    return sum(h.z for h in hs) / max(1, len(hs))


def fan(path):
    """Due pose (braccia giu', braccia su) di un tifoso: colore e maschera."""
    sc, cam = reset()
    bpy.ops.import_scene.fbx(filepath=path)
    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    act = arm.animation_data.action if arm and arm.animation_data else None
    f0, f1 = (int(act.frame_range[0]), int(act.frame_range[1])) if act else (0, 0)
    hs = [(hand_height(arm, f), f) for f in range(f0, f1 + 1, 2)] if act else [(0, 0)]
    down, up = min(hs)[1], max(hs)[1]
    cells = []
    for f in (down, up):
        sc.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        lo = Vector((1e9, 1e9, 1e9)); hi = -lo
        for o in meshes:
            ev = o.evaluated_get(dg)
            for c in ev.bound_box:
                w = o.matrix_world @ Vector(c)
                lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
        # piedi in fondo alla cella, persona al centro
        center = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z + FRAME_H / 2 - 0.03))
        aim(cam, center, FRAME_H * CELL_W / CELL_H, FRAME_H, CELL_W * 4, CELL_H * 4)
        col = render_px()
        saved = mask_materials(meshes, lambda o: shirt_weights(o, arm))
        msk = render_px()
        restore(saved)
        cells.append((col, msk))
    return cells


def downsample(a, k=4):
    """Media pesata con l'alfa (bordi puliti), da 4x a 1x."""
    h, w = a.shape[0] // k, a.shape[1] // k
    b = a[:h * k, :w * k].reshape(h, k, w, k, 4)
    al = b[..., 3:4]
    rgb = (b[..., :3] * al).sum(axis=(1, 3)) / np.maximum(al.sum(axis=(1, 3)), 1e-6)
    return np.concatenate([rgb, al.mean(axis=(1, 3))], axis=-1)


def save_png(a, path):
    h, w = a.shape[:2]
    im = bpy.data.images.new(os.path.basename(path), w, h, alpha=True)
    im.pixels[:] = np.ascontiguousarray(a[::-1]).ravel()
    im.filepath_raw = path
    im.file_format = 'PNG'
    im.save()
    bpy.data.images.remove(im)


def crowd():
    files = sorted(glob.glob(os.path.join(ASSET, 'Fan_*.fbx')))
    people = [fan(p) for p in files]
    P = len(people)
    color = np.zeros((CELL_H, CELL_W * 2 * P, 4), dtype=np.float32)
    mask = np.zeros_like(color)
    for i, cells in enumerate(people):
        for pose, (col, msk) in enumerate(cells):
            x = (i + pose * P) * CELL_W
            c = downsample(col)
            m = downsample(msk)
            color[:, x:x + CELL_W] = c
            mask[:, x:x + CELL_W, 0] = m[..., 0] * (m[..., 3] > 0.01)
            mask[:, x:x + CELL_W, 3] = c[..., 3]
    atlas = np.concatenate([color, mask], axis=1)
    save_png(atlas, os.path.join(OUT, 'crowd.png'))
    print('tifosi', P, 'persone', [os.path.basename(f) for f in files])
    return P


def seats():
    """Fila di 32 posti: il modello Seat_01a aperto e chiuso (seduta ruotata)."""
    sc, cam = reset()
    bpy.ops.import_scene.fbx(filepath=os.path.join(ASSET, 'Seat_01a.fbx'))
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    lo = Vector((1e9, 1e9, 1e9)); hi = -lo
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    size = hi - lo
    print('seggiolino', tuple(round(v, 3) for v in size))
    # davanti: il lato opposto allo schienale (lo schienale e' l'oggetto piu' alto)
    back = max(objs, key=lambda o: (o.matrix_world @ Vector(o.bound_box[1])).z if 'Back' in o.name else -1)
    bc = sum((back.matrix_world @ Vector(c) for c in back.bound_box), Vector()) / 8
    mid = (lo + hi) / 2
    d = Vector((mid.x - bc.x, mid.y - bc.y, 0))
    front = d.normalized() if d.length > 1e-3 else Vector((0, -1, 0))
    pan = next((o for o in objs if o is not back), None)
    W = 0.5
    H = 0.85
    shots = []
    for folded in (False, True):
        if pan:
            pan.rotation_mode = 'XYZ'
            if folded:
                # cerniera sul bordo posteriore della seduta: ruotata in su di 80 gradi
                hinge = bc + (mid - bc) * 0.15
                axis = Vector((-front.y, front.x, 0))
                R = Matrix.Translation(hinge) @ Matrix.Rotation(math.radians(-80), 4, axis) @ Matrix.Translation(-hinge)
                pan.matrix_world = R @ pan.matrix_world
        center = Vector((mid.x, mid.y, lo.z + H / 2))
        aim(cam, center, W, H, 64 * 4, int(64 * 4 * H / W), front=-front)
        shots.append(downsample(render_px()))
    rnd = random.Random(7)
    row = np.concatenate([shots[1 if rnd.random() < 0.55 else 0] for _ in range(32)], axis=1)
    save_png(row, os.path.join(OUT, 'seats.png'))


if '--seats-only' not in argv:
    crowd()
seats()
