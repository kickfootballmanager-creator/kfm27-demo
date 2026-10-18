"""Teste generate con Meshy sul Calciatore (blocco F).

Per ogni testa di Meshy (GLB 4K in source/meshy, viso, capelli ed eventuale
barba insieme):
- la testa si allinea a quella del Calciatore (larghezza, punta del naso);
- i vertici di testa e collo del Calciatore vanno sulla superficie della
  testa di Meshy (punto piu' vicino), con un peso che sale da 0 sopra il
  colletto della maglia a 1 sotto la mascella: la giunzione col corpo resta
  quella del modello, identica per tutte le teste;
- il colore della testa passa nelle UV del corpo (punto piu' vicino); si tiene solo il
  riquadro della testa, al massimo CROP px (master 4K in source/meshy);
- il tono della pelle (mediana sulle guance) serve al gioco per tingere il
  resto del corpo.

Scrive src/assets/match3d/heads.glb (ignorato da git): nel JSON le varianti
(nome, pelle, riquadro UV, immagine), nel binario le posizioni di riposo dei
vertici toccati, gli spostamenti di ogni testa e i PNG dei riquadri.

  blender -b --factory-startup -P tools/match3d/meshy_heads.py -- [--only nome,nome] [--preview DIR]
"""
import bpy, bmesh, os, sys, json, math, struct, tempfile
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
ASSETS = os.path.join(REPO, 'src', 'assets', 'match3d')
MESHY = os.path.join(ASSETS, 'source', 'meshy')
OUT = os.path.join(ASSETS, 'heads.glb')
TMP = os.path.join(tempfile.gettempdir(), 'kfm_heads')
os.makedirs(TMP, exist_ok=True)
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None):
    return argv[argv.index(n) + 1] if n in argv else d
ONLY = set((arg('--only') or '').split(',')) - {''}
PREVIEW = arg('--preview')
CROP = 512
BLEND = (0.012, 0.075)     # metri sopra il colletto: inizio e pieno della proiezione
NEAR = 0.012               # colore di Meshy solo entro tanto dalla sua superficie
MAX_MOVE = 0.08            # oltre tanto un vertice resta dov'e' (bocca, interno)
# testa -> file GLB di Meshy (nome dato a meshy.py text3d)
HEADS = json.load(open(os.path.join(MESHY, 'teste.json'), encoding='utf-8')) if os.path.exists(os.path.join(MESHY, 'teste.json')) else [{'name': 'capelli_pilota'}]


def say(*a):
    print('[teste]', *a, flush=True)


def load_player():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ASSETS, 'player.glb'))
    body = bpy.data.objects['Ch38_Body']
    shirt = bpy.data.objects['Ch38_Shirt']
    hair = bpy.data.objects['Ch38_Hair']
    return body, shirt, hair


body, shirt, hair = load_player()
MW = body.matrix_world.copy()
gi = {g.index: g.name for g in body.vertex_groups}
def wsum(v, suffixes):
    return sum(g.weight for g in v.groups if gi[g.group].endswith(suffixes))
W = [MW @ v.co for v in body.data.vertices]
w_head = np.array([wsum(v, ('Head',)) for v in body.data.vertices])
w_neck = np.array([wsum(v, ('Neck',)) for v in body.data.vertices])
region = [i for i in range(len(W)) if w_head[i] + w_neck[i] > 0.05]
head_ids = [i for i in range(len(W)) if w_head[i] > 0.5]
# colletto: il punto piu' alto della maglia vicino al collo
collar = max((shirt.matrix_world @ v.co).z for v in shirt.data.vertices if abs((shirt.matrix_world @ v.co).x) < 0.09)
hx = [W[i].x for i in head_ids]
head_w = max(hx) - min(hx)
nose = min((W[i] for i in head_ids), key=lambda p: p.y)
say('vertici di testa e collo', len(region), 'colletto', round(collar, 3), 'larghezza', round(head_w, 3), 'naso', tuple(round(c, 3) for c in nose))


def blend(z):
    a, b = collar + BLEND[0], collar + BLEND[1]
    u = min(1.0, max(0.0, (z - a) / (b - a)))
    return u * u * (3 - 2 * u)


def import_head(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    h = bpy.context.view_layer.objects.active
    for o in new:
        if o != h:
            bpy.data.objects.remove(o, do_unlink=True)
    mw = h.matrix_world.copy()
    h.parent = None
    h.data.transform(mw)
    h.matrix_world.identity()
    return h


def fit(h):
    """Busto o sola testa: la testa sta sopra il punto piu' stretto del collo.
    Larghezza della testa come la nostra, punta del naso sulla nostra."""
    from mathutils import Matrix
    vs = [v.co.copy() for v in h.data.vertices]
    z0, z1 = min(v.z for v in vs), max(v.z for v in vs)
    H = z1 - z0
    # larghezza per fette di 2% dell'altezza, dall'alto
    n = 50
    slices = [[] for _ in range(n)]
    for v in vs:
        k = min(n - 1, int((z1 - v.z) / H * n))
        slices[k].append(v.x)
    width = [(max(s) - min(s)) if len(s) > 2 else 0 for s in slices]
    # collo: la fetta piu' stretta fra il 20% e il 75% dall'alto (dopo la testa)
    lo_k, hi_k = int(n * 0.2), int(n * 0.75)
    neck_k = min(range(lo_k, hi_k), key=lambda k: width[k] if width[k] > 0 else 1e9)
    neck_z = z1 - (neck_k + 0.5) / n * H
    head = [v for v in vs if v.z > neck_z]
    hw = max(width[:neck_k]) if neck_k else max(width)
    s = head_w / hw
    # naso: il punto piu' avanti (-Y) della testa vicino al piano di simmetria
    cx = (min(v.x for v in head) + max(v.x for v in head)) / 2
    tip = min((v for v in head if abs(v.x - cx) < hw * 0.12), key=lambda v: v.y)
    h.data.transform(Matrix.Translation(-tip))
    h.data.transform(Matrix.Scale(s, 4))
    h.data.transform(Matrix.Translation(Vector((nose.x, nose.y, nose.z))))
    fit.neck = (neck_z - tip.z) * s + nose.z
    return s


def project(h):
    bm = bmesh.new()
    bm.from_mesh(h.data)
    tree = BVHTree.FromBMesh(bm)
    bm.free()
    disp = {}
    for i in region:
        p = W[i]
        k = blend(p.z)
        if k <= 0:
            continue
        hit = tree.find_nearest(p)
        if not hit or hit[0] is None:
            continue
        d = hit[0] - p
        if d.length > MAX_MOVE:
            continue
        disp[i] = d * k
    return disp


def meshy_texture(h):
    """Colore base della testa di Meshy come array (ridotto a 2048)."""
    for m in h.data.materials:
        if not m or not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image and any(l.to_socket.name == 'Base Color' for l in n.outputs['Color'].links):
                im = n.image
                if max(im.size) > 2048:
                    im.scale(2048, 2048)
                a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
                return a
    return None


def bake(h, disp, name):
    """Colore della testa di Meshy nelle UV del corpo: per ogni texel delle facce
    toccate, il punto 3D (vertici spostati) prende il colore del punto piu'
    vicino della testa di Meshy; verso il colletto sfuma nell'originale."""
    tex = meshy_texture(h)
    th, tw = tex.shape[:2]
    # testa di Meshy in triangoli, con le UV per angolo
    bm = bmesh.new()
    bm.from_mesh(h.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    uvl = bm.loops.layers.uv.active
    bm.faces.ensure_lookup_table()
    tri_uv = [[l[uvl].uv.copy() for l in f.loops] for f in bm.faces]
    tri_co = [[v.co.copy() for v in f.verts] for f in bm.faces]
    tree = BVHTree.FromBMesh(bm)
    bm.free()
    src_img = next(im for im in bpy.data.images if im.size[0] >= 512 and 'body' in im.name.lower())
    W_, H_ = src_img.size
    base = np.array(src_img.pixels[:], dtype=np.float32).reshape(H_, W_, 4)
    # tinta del corpo: pelle della testa nuova sulle guance / pelle originale negli stessi punti
    def sample_tex(p):
        hit = tree.find_nearest(p)
        fi, q = hit[2], hit[0]
        A, B, C = tri_co[fi]
        v0, v1, v2 = B - A, C - A, q - A
        d00, d01, d11, d20, d21 = v0.dot(v0), v0.dot(v1), v1.dot(v1), v2.dot(v0), v2.dot(v1)
        dd = (d00 * d11 - d01 * d01) or 1e-18
        bb, cc = (d11 * d20 - d01 * d21) / dd, (d00 * d21 - d01 * d20) / dd
        U = tri_uv[fi][0] * (1 - bb - cc) + tri_uv[fi][1] * bb + tri_uv[fi][2] * cc
        return tex[min(th - 1, max(0, int((U[1] % 1.0) * th))), min(tw - 1, max(0, int((U[0] % 1.0) * tw))), :3]
    me0 = body.data
    uv0 = me0.uv_layers.active.data
    new_s, old_s = [], []
    for poly in me0.polygons:
        for j in poly.loop_indices:
            vi = me0.loops[j].vertex_index
            p = W[vi]
            if vi in disp and p.y < nose.y + 0.05 and nose.z - 0.06 < p.z < nose.z + 0.01 and 0.025 < abs(p.x) < 0.06:
                new_s.append(sample_tex(p + disp[vi]))
                u, v = uv0[j].uv
                old_s.append(base[min(H_ - 1, int(v * H_)), min(W_ - 1, int(u * W_)), :3])
    skin = np.median(np.array(new_s), axis=0) if new_s else np.array([0.6, 0.45, 0.35])
    ref = np.median(np.array(old_s), axis=0) if old_s else skin
    tint = np.clip(skin / np.maximum(ref, 0.05), 0.75, 1.3)
    tinted = base[..., :3] * tint
    out = base.copy()
    filled = np.zeros((H_, W_), dtype=bool)
    me = body.data
    uv = me.uv_layers.active.data
    me.calc_loop_triangles()
    pos = {i: (W[i] + disp.get(i, Vector())) for i in region}
    kv = {i: blend(W[i].z) for i in region}
    us, vs = [], []
    for lt in me.loop_triangles:
        vi = lt.vertices
        if not all(v in disp for v in vi):
            continue
        uvs = [uv[l].uv for l in lt.loops]
        P = [pos[v] for v in vi]
        K = [kv[v] for v in vi]
        xs = [u[0] * W_ - 0.5 for u in uvs]
        ys = [u[1] * H_ - 0.5 for u in uvs]
        us += [u[0] for u in uvs]; vs += [u[1] for u in uvs]
        x0, x1 = max(0, int(math.floor(min(xs)))), min(W_ - 1, int(math.ceil(max(xs))))
        y0, y1 = max(0, int(math.floor(min(ys)))), min(H_ - 1, int(math.ceil(max(ys))))
        den = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(den) < 1e-12:
            continue
        for py in range(y0, y1 + 1):
            for px in range(x0, x1 + 1):
                a = ((ys[1] - ys[2]) * (px - xs[2]) + (xs[2] - xs[1]) * (py - ys[2])) / den
                b = ((ys[2] - ys[0]) * (px - xs[2]) + (xs[0] - xs[2]) * (py - ys[2])) / den
                c = 1 - a - b
                if a < -0.02 or b < -0.02 or c < -0.02:
                    continue
                p = P[0] * a + P[1] * b + P[2] * c
                k = K[0] * a + K[1] * b + K[2] * c
                hit = tree.find_nearest(p)
                if not hit or hit[2] is None:
                    continue
                if hit[3] > NEAR:
                    # sotto il taglio del collo di Meshy: pelle del corpo, tinta
                    out[py, px, :3] = tinted[py, px]
                    filled[py, px] = True
                    continue
                fi = hit[2]
                q = hit[0]
                A, B, C = tri_co[fi]
                # baricentriche del punto sul triangolo di Meshy
                v0, v1, v2 = B - A, C - A, q - A
                d00, d01, d11 = v0.dot(v0), v0.dot(v1), v1.dot(v1)
                d20, d21 = v2.dot(v0), v2.dot(v1)
                dd = d00 * d11 - d01 * d01
                if abs(dd) < 1e-18:
                    continue
                bb = (d11 * d20 - d01 * d21) / dd
                cc = (d00 * d21 - d01 * d20) / dd
                aa = 1 - bb - cc
                U = tri_uv[fi][0] * aa + tri_uv[fi][1] * bb + tri_uv[fi][2] * cc
                tx = min(tw - 1, max(0, int((U[0] % 1.0) * tw)))
                ty = min(th - 1, max(0, int((U[1] % 1.0) * th)))
                col = tex[ty, tx, :3]
                out[py, px, :3] = tinted[py, px] * (1 - k) + col * k
                filled[py, px] = True
    # margine: due passi di dilatazione dei texel scritti sui vicini vuoti
    for _ in range(3):
        grow = np.zeros_like(filled)
        acc = np.zeros_like(out[..., :3])
        cnt = np.zeros(filled.shape, dtype=np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.roll(filled, dy, 0), dx, 1)
            col = np.roll(np.roll(out[..., :3], dy, 0), dx, 1)
            m = sh & ~filled
            acc[m] += col[m]
            cnt[m] += 1
            grow |= m
        out[grow, :3] = acc[grow] / cnt[grow][:, None]
        filled |= grow
    us, vs = np.array(us), np.array(vs)
    u0, u1, v0, v1 = max(0, us.min() - 0.01), min(1, us.max() + 0.01), max(0, vs.min() - 0.01), min(1, vs.max() + 0.01)
    x0, x1, y0, y1 = int(u0 * W_), int(math.ceil(u1 * W_)), int(v0 * H_), int(math.ceil(v1 * H_))
    crop = out[y0:y1, x0:x1].copy()
    # fuori dalle facce della testa trasparente: li' il gioco tiene il corpo tinto
    crop[..., 3] = filled[y0:y1, x0:x1].astype(np.float32)
    img = bpy.data.images.new('tex_' + name, W_, H_, alpha=True)
    img.pixels[:] = out.ravel()
    bake.last = img
    k = min(1.0, CROP / max(crop.shape[0], crop.shape[1]))
    ci = bpy.data.images.new('crop_' + name, crop.shape[1], crop.shape[0], alpha=True)
    ci.pixels[:] = crop.ravel()
    if k < 1:
        ci.scale(max(8, int(crop.shape[1] * k)), max(8, int(crop.shape[0] * k)))
    path = os.path.join(TMP, name + '.png')
    ci.filepath_raw = path
    ci.file_format = 'PNG'
    ci.save()
    png = open(path, 'rb').read()
    return png, [round(float(u0), 5), round(float(v0), 5), round(float(u1), 5), round(float(v1), 5)], [round(float(c), 4) for c in skin], [round(float(c), 4) for c in tint]


def preview(h, disp, name, img):
    """Testa spostata col colore cotto, di fronte e di lato (Workbench)."""
    sc = bpy.context.scene
    me = body.data.copy()
    mat = bpy.data.materials.new('prev_' + name)
    mat.use_nodes = True
    tn = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tn.image = img
    mat.node_tree.links.new(tn.outputs['Color'], mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    me.materials.clear()
    me.materials.append(mat)
    o = bpy.data.objects.new('prev_' + name, me)
    sc.collection.objects.link(o)
    o.matrix_world = MW
    inv = MW.inverted().to_3x3()
    for i, d in disp.items():
        me.vertices[i].co = me.vertices[i].co + inv @ d
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.color_type = 'TEXTURE'
    sc.render.resolution_x, sc.render.resolution_y = 400, 400
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 0.42
    hidden = [x for x in sc.objects if x not in (o, cam) and x.type == 'MESH']
    for x in hidden:
        x.hide_render = True
    c = Vector((0, nose.y + 0.08, nose.z + 0.02))
    for tag, d in (('fronte', Vector((0, -1, 0))), ('lato', Vector((1, -0.3, 0)).normalized())):
        cam.location = c + d * 3
        cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(PREVIEW, f'{name}_{tag}.png')
        bpy.ops.render.render(write_still=True)
    for x in hidden:
        x.hide_render = False
    bpy.data.objects.remove(cam, do_unlink=True)
    bpy.data.objects.remove(o, do_unlink=True)


variants, blobs, disps = [], [], []
for e in HEADS:
    name = e['name']
    if ONLY and name not in ONLY:
        continue
    path = os.path.join(MESHY, name + '__model_urls_glb.glb')
    if not os.path.exists(path):
        say('manca', path)
        continue
    h = import_head(path)
    s = fit(h)
    disp = project(h)
    png, rect, skin, tint = bake(h, disp, name)
    if PREVIEW:
        os.makedirs(PREVIEW, exist_ok=True)
        preview(h, disp, name, bake.last)
    variants.append({'name': name, 'rect': rect, 'skin': skin, 'tint': tint, 'hair': bool(e.get('hair', True)), 'moved': len(disp)})
    blobs.append(png)
    disps.append(disp)
    bpy.data.objects.remove(h, do_unlink=True)
    say(name, 'scala', round(s, 4), 'collo di Meshy a', round(fit.neck, 3), 'vertici spostati', len(disp), 'pelle', skin)

# posizioni di riposo nello spazio della geometria in three.js: i dati della
# mesh importata sono gia' negli assi del glTF (Y in alto), la scala sta
# nell'oggetto (centimetri dell'armatura Mixamo)
keys = sorted(set(i for d in disps for i in d))
K = MW.to_scale().x
def to_gltf(v):
    return (v.x * K, v.y * K, v.z * K)
inv = MW.inverted().to_3x3()
pos = np.array([to_gltf(body.data.vertices[i].co) for i in keys], dtype=np.float32).ravel()
arrays = [pos]
for d in disps:
    a = np.zeros((len(keys), 3), dtype=np.float32)
    for k, i in enumerate(keys):
        if i in d:
            a[k] = to_gltf(inv @ d[i])
    arrays.append(a.ravel())

# GLB a mano: JSON con le varianti, binario con le posizioni, gli spostamenti e i PNG
bin_ = bytearray()
views = []
def add(b):
    while len(bin_) % 4:
        bin_.append(0)
    views.append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(b)})
    bin_.extend(b)
    return len(views) - 1
ref_pos = {'view': add(arrays[0].tobytes()), 'n': int(arrays[0].size)}
for v, a, png in zip(variants, arrays[1:], blobs):
    v['disp'] = {'view': add(a.tobytes()), 'n': int(a.size)}
    v['image'] = {'view': add(png), 'mime': 'image/png'}
gltf = {'asset': {'version': '2.0', 'generator': 'kfm27 meshy_heads.py'}, 'buffers': [{'byteLength': 0}], 'bufferViews': views,
        'extras': {'heads': variants, 'positions': ref_pos, 'blend': BLEND, 'source': 'Meshy text-to-3d'}}
while len(bin_) % 4:
    bin_.append(0)
gltf['buffers'][0]['byteLength'] = len(bin_)
js = json.dumps(gltf, separators=(',', ':')).encode()
while len(js) % 4:
    js += b' '
total = 12 + 8 + len(js) + 8 + len(bin_)
with open(OUT, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)
say('scritto', OUT, len(variants), 'teste', round(total / 1024), 'KB')
print('---TESTE-OK---')
