"""Palla della partita 3D dal modello dell'utente.

src/assets/match3d/ball/soccerball.fbx ha 590.000 triangoli, nessuna mappa UV
e nessun materiale: gli spicchi (32, cuciti) sono solo rilievo. Da qui escono:

  ball.glb         sfera bassa (SEGS x RINGS) con la mappatura UV
                   equirettangolare creata qui, adattata alla forma del modello
                   (spicchi gonfi) e scalata a 22 cm di diametro;
  ball-maps.png    R = numero dello spicchio (x 7), G = rilievo (cuciture e
                   spicchi gonfi letti sul modello), B = maschera delle cuciture.

Le mappe stanno nella stessa parametrizzazione delle UV: per il texel (u, v)
la direzione dal centro, nelle coordinate di three.js (Y in alto), e'
  phi = 2 pi u - pi, theta = pi (1 - v)
  d = (sin theta sin phi, cos theta, sin theta cos phi)
(src/js/match3d/ball-look.js usa la stessa formula per colori e loghi).

  blender -b --factory-startup -P tools/match3d/ball_build.py -- [--size 2048]
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src', 'assets', 'match3d', 'ball', 'soccerball.fbx')
OUT = os.path.join(ROOT, 'src', 'assets', 'match3d', 'ball')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SIZE = int(argv[argv.index('--size') + 1]) if '--size' in argv else 2048
SEGS, RINGS = 64, 40
RADIUS = 0.11


def say(*a):
    print('[ball]', *a, flush=True)


def to_blender(v):
    # three (x, y, z) -> Blender (x, -z, y): l'esportatore glTF fa l'inverso
    return Vector((v[0], -v[2], v[1]))


def direction(u, v):
    phi = 2 * math.pi * u - math.pi
    th = math.pi * (1 - v)
    return (math.sin(th) * math.sin(phi), math.cos(th), math.sin(th) * math.cos(phi))


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
hi = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
dg = bpy.context.evaluated_depsgraph_get()
bvh = BVHTree.FromObject(hi, dg)
co = np.array([hi.matrix_world @ v.co for v in hi.data.vertices])
center = Vector(((co.max(0) + co.min(0)) / 2).tolist())
say('triangoli', len(hi.data.polygons), 'centro', tuple(round(c, 4) for c in center))


def radius_along(d3):
    d = to_blender(d3).normalized()
    hit = bvh.ray_cast(center, d)
    if hit[0] is None:
        hit = bvh.ray_cast(center + d * 5, -d)
        return (hit[0] - center).length if hit[0] is not None else None
    return hit[3]


# ---- rilievo lungo ogni direzione della mappa
W, H = SIZE, SIZE // 2
theta = np.pi * (np.arange(H) + 0.5) / H
sinr = np.maximum(np.sin(theta), 0.02)


def bake(rot):
    """Raggio del modello per ogni texel; rot: direzione della mappa -> direzione del modello."""
    out = np.zeros((H, W), np.float64)
    for j in range(H):
        v = 1 - (j + 0.5) / H
        for i in range(W):
            r = radius_along(rot(direction((i + 0.5) / W, v)))
            out[j, i] = r if r is not None else np.nan
        if j % 256 == 0:
            say('riga', j, '/', H)
    out[np.isnan(out)] = np.nanmean(out)
    return out


def blur_u(a, k):
    # finestra in u che segue la distorsione: k texel all'equatore, k / sin(theta) ai poli
    out = np.empty_like(a)
    c = np.concatenate([a, a, a], axis=1).cumsum(axis=1)
    for j in range(H):
        kk = int(min(W // 2 - 1, max(1, round(k / sinr[j]))))
        lo, hi = W - kk - 1, W + kk
        out[j] = (c[j, hi:hi + W] - c[j, lo:lo + W]) / (2 * kk + 1)
    return out


def blur_v(a, k):
    p = np.pad(a, ((k, k), (0, 0)), mode='edge')
    c = np.concatenate([np.zeros((1, W)), p.cumsum(axis=0)], axis=0)
    return (c[2 * k + 1:2 * k + 1 + H] - c[0:H]) / (2 * k + 1)


def blur(a, k):
    return blur_v(blur_u(a, k), k)


SCALE = SIZE / 1024


def segment(rad):
    """Spicchi: regioni connesse fuori dai solchi (differenza fra due sfocature)."""
    g = (rad - rad.min()) / max(1e-9, rad.max() - rad.min())
    ks, km = max(1, round(SCALE)), max(2, round(5 * SCALE))
    val = blur(blur(g, km), km) - blur(blur(g, ks), ks)
    seam = val > 0.012
    s2 = seam | np.roll(seam, 1, 1) | np.roll(seam, -1, 1)
    s2[1:] |= seam[:-1]
    s2[:-1] |= seam[1:]
    lab = np.where(s2, -1, np.arange(W * H).reshape(H, W))
    for it in range(6000):
        cur = lab.copy()
        for nb in (np.roll(lab, 1, 1), np.roll(lab, -1, 1), np.vstack([lab[:1], lab[:-1]]), np.vstack([lab[1:], lab[-1:]])):
            ok = (nb >= 0) & (cur >= 0)
            cur = np.where(ok & (nb < cur), nb, cur)
        for row in (0, H - 1):
            r = cur[row]
            m = r >= 0
            if m.any():
                r[m] = r[m].min()
        if np.array_equal(cur, lab):
            break
        lab = cur
    return lab, val


def uv_of(d):
    phi = math.atan2(d[0], d[2])
    th = math.acos(max(-1, min(1, d[1])))
    return (phi + math.pi) / (2 * math.pi), 1 - th / math.pi


rad = bake(lambda d: d)
# seconda mappa con i poli sull'asse X: li' gli spicchi polari stanno all'equatore
rad2 = bake(lambda d: (d[1], -d[0], d[2]))
mean = float(rad.mean())
say('raggio medio', round(mean, 4), 'min', round(float(rad.min()), 4), 'max', round(float(rad.max()), 4))
lab1, val = segment(rad)
lab2, _ = segment(rad2)
say('regioni', len(np.unique(lab1[lab1 >= 0])), len(np.unique(lab2[lab2 >= 0])))

# per ogni texel della prima mappa: lo spicchio della mappa in cui sta
# lontano dai poli (|y| < 0,7 nella prima, altrimenti la seconda)
lab2_of = np.full((H, W), -1, np.int64)
ycoord = np.cos(theta)[:, None] * np.ones((1, W))
for j in range(H):
    v = 1 - (j + 0.5) / H
    for i in range(0, W):
        if abs(ycoord[j, i]) < 0.3:
            continue
        d = direction((i + 0.5) / W, v)
        # direzione del modello d -> direzione nella seconda mappa (inversa di (y, -x, z))
        u2, v2 = uv_of((-d[1], d[0], d[2]))
        lab2_of[j, i] = lab2[min(H - 1, int((1 - v2) * H)), min(W - 1, int(u2 * W))]
# corrispondenza fra le etichette nella fascia in cui le due mappe sono buone
parent = {}


def find(a):
    while parent.get(a, a) != a:
        parent[a] = parent.get(parent[a], parent[a])
        a = parent[a]
    return a


band = (np.abs(ycoord) > 0.35) & (np.abs(ycoord) < 0.65) & (lab1 >= 0) & (lab2_of >= 0)
pairs, counts = np.unique(np.stack([lab1[band], lab2_of[band]], 1), axis=0, return_counts=True)
for (a, b), c in zip(pairs, counts):
    if c >= 40 * SCALE * SCALE:
        ra, rb = find(('1', int(a))), find(('2', int(b)))
        if ra != rb:
            parent[ra] = rb
final = np.full((H, W), -1, np.int64)
keys = {}
for j in range(H):
    pole = abs(ycoord[j, 0]) >= 0.7
    for i in range(W):
        key = ('2', int(lab2_of[j, i])) if pole and lab2_of[j, i] >= 0 else ('1', int(lab1[j, i])) if lab1[j, i] >= 0 else None
        if key is None:
            continue
        root = find(key)
        final[j, i] = keys.setdefault(root, len(keys))
wrow = np.sin(theta)[:, None] * np.ones((1, W))
area = np.bincount(final[final >= 0], weights=wrow[final >= 0])
tot = area.sum()
keep = [k for k in range(len(area)) if area[k] > 0.006 * tot]
remap = np.full(len(area) + 1, 255)
for n, k in enumerate(sorted(keep, key=lambda k: -area[k])):
    remap[k] = n
panel = np.where(final >= 0, remap[np.maximum(final, 0)], 255)
say('spicchi', len(keep), 'aree %', sorted([round(area[k] / tot * 100, 2) for k in keep], reverse=True))
depth = blur(rad, max(2, round(8 * SCALE))) - rad
# cuciture e briciole: lo spicchio piu' vicino (propagazione)
for it in range(400):
    hole = panel == 255
    if not hole.any():
        break
    for sh, ax in ((1, 1), (-1, 1), (1, 0), (-1, 0)):
        nb = np.roll(panel, sh, axis=ax)
        fill = hole & (nb != 255)
        panel[fill] = nb[fill]
        hole = panel == 255

# ---- immagine: R spicchio, G rilievo, B maschera delle cuciture
g = np.clip((rad - rad.min()) / max(1e-6, rad.max() - rad.min()), 0, 1)
sm = np.clip(1 - depth / (0.012 * mean), 0, 1)
img = np.zeros((H, W, 4), np.float32)
img[..., 0] = np.clip(panel * 7, 0, 255) / 255
img[..., 1] = g
img[..., 2] = sm
img[..., 3] = 1
im = bpy.data.images.new('ball-maps', W, H, alpha=False, float_buffer=False)
im.colorspace_settings.name = 'Non-Color'
# Blender scrive le righe dal basso
im.pixels.foreach_set(img[::-1].reshape(-1))
im.filepath_raw = os.path.join(OUT, 'ball-maps.png')
im.file_format = 'PNG'
im.save()
say('mappe', im.filepath_raw)

# ---- sfera bassa con le UV, sulla forma del modello, 22 cm
bm = bmesh.new()
uvl = bm.loops.layers.uv.new('UVMap')
grid = []
for jj in range(RINGS + 1):
    v = 1 - jj / RINGS
    row = []
    for ii in range(SEGS + 1):
        u = ii / SEGS
        d = direction(u, v)
        r = radius_along(d) if 0 < jj < RINGS else mean
        s = RADIUS * (r or mean) / mean
        row.append((bm.verts.new(to_blender((d[0] * s, d[1] * s, d[2] * s))), u, v))
    grid.append(row)
for jj in range(RINGS):
    for ii in range(SEGS):
        a, b, c, d = grid[jj][ii], grid[jj][ii + 1], grid[jj + 1][ii + 1], grid[jj + 1][ii]
        for tri in ((a, d, c), (a, c, b)) if 0 < jj < RINGS - 1 else ((a, d, c),) if jj == RINGS - 1 else ((a, c, b),):
            try:
                f = bm.faces.new([t[0] for t in tri])
            except ValueError:
                continue
            for loop, t in zip(f.loops, tri):
                loop[uvl].uv = (t[1], t[2])
bm.normal_update()
me = bpy.data.meshes.new('ball')
bm.to_mesh(me)
bm.free()
for p in me.polygons:
    p.use_smooth = True
lo = bpy.data.objects.new('ball', me)
bpy.context.scene.collection.objects.link(lo)
# normali verso l'esterno
bpy.context.view_layer.objects.active = lo
for o in bpy.context.scene.objects:
    o.select_set(o == lo)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'ball.glb'), use_selection=True, export_format='GLB', export_materials='NONE')
say('mesh', len(me.vertices), 'vertici', len(me.polygons), 'triangoli', os.path.join(OUT, 'ball.glb'))
