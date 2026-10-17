"""Stadio della partita 3D dal progetto 3ds Max "Soccer Stadium CF" (blocco E).

Ingresso (fuori da git, prodotti da debug/stadio/strumenti con 3dsmaxbatch):
  stadium.fbx   strutture senza luci, proxy, personaggi e oggetti di MultiScatter
  splines.json  spline di distribuzione di MultiScatter (seggiolini e tifosi)
  sprites/      seats.png e crowd.png di stadium_sprites.py (facoltativi)

Uscita: src/assets/match3d/stadium/stadium-<livello>.glb (in .gitignore: licenza
TurboSquid, repository pubblico). Per livello:
  - via porte, bandierine, pallone, linee, terreno, cartelloni a terra e
    panchine dettagliate (il campo e le porte sono quelli del gioco);
  - dissoluzione dei piani e riduzione dei triangoli fino al budget;
  - oggetti fusi e poi divisi per materiale (una draw call per materiale);
  - texture al massimo TEX px, banner e maxischermo neutri (il gioco ci mette
    i suoi sponsor): nessun logo TurboSquid/DTP.3D esce da qui;
  - occlusione ambientale cotta con Cycles nei colori dei vertici;
  - seggiolini: una striscia per fila lungo le spline (versione leggera di
    MultiScatter), con la texture di una fila di posti;
  - tifosi: una nuvola di punti (Crowd) sulle spline dei tifosi, in ordine
    casuale, che stadium.js trasforma in sagome instanziate.

  blender -b --factory-startup -P tools/match3d/stadium_build.py -- [--levels high,low] [--no-ao] [--preview DIR]
"""
import bpy, bmesh, sys, os, json, math, random, tempfile
import numpy as np
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(os.environ.get('KFM_MAIN', os.path.join(ROOT, '..', 'kfm27')), 'debug', 'stadio')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default
FBX = arg('--fbx', os.path.join(SRC, 'export', 'stadium.fbx'))
SPLINES = arg('--splines', os.path.join(SRC, 'export', 'splines.json'))
SPRITES = arg('--sprites', os.path.join(SRC, 'sprites'))
OUT = arg('--out', os.path.join(ROOT, 'src', 'assets', 'match3d', 'stadium'))
PREVIEW = arg('--preview')
TMP = os.path.join(tempfile.gettempdir(), 'kfm_stadium')   # texture ridotte, fuori dal repository
LEVELS = arg('--levels', 'high,low').split(',')
AO = '--no-ao' not in argv

# triangoli per oggetto al livello alto, scelti misurando quanto ogni oggetto
# si vede dalle visuali di gioco e di replay (debug/stadio/strumenti/visibili.py):
# la telecamera di gioco vede soprattutto la tribuna bassa di fronte, i replay
# anche le altre. Cio' che non e' qui non entra (porte, bandierine, pallone,
# linee, terreno e cartelloni a terra sono quelli del gioco; panchine e
# tralicci sopra il tetto non si vedono). Livello basso: LOW_K dei triangoli.
KEEP = {
    'Bottom Tier': 27500, 'Top Tier': 30000, 'VIP Tier': 22000, 'Middle Tier': 3300,
    'Stadium Banners': 1720, 'Stair Steps (Bottom Tier)': 4000, 'Stair Steps (Top Tier)': 5000,
    'Stair Steps (VIP Tier)': 1600, 'Barriers (Bottom Tier)': 24000, 'Barriers (Top Tier)': 16000,
    'Barriers (ViP Tier)': 7000, 'Stadium to Field Steps': 9000, 'Coach Area': 5000, 'Pillars': 9000,
    'Roof Scaffolding (Pillars)': 7000, 'Roof Top Scaffolding': 4000, 'Lighting (Middle Tier)': 3000,
    'Lighting (Bottom Tier)': 2000, 'Spot Lights': 4000, 'Under Roof Lighting': 2400, 'Roof Top': 900,
    'Roof Glass Plates': 720, 'Outside Metal Plates': 3450, 'Outside Glass': 2256,
    'Tv Bim 1': 3000, 'Tv Bim 2': 3000, 'Back Fence': 748, 'Gates': 68, 'Window Blinds': 40,
    'Ground': 256,
}
LOW_K = 0.45
LOW_DROP = {'Roof Top Scaffolding', 'Outside Glass', 'Gates', 'Back Fence', 'Window Blinds'}   # fuori dalla vista di gioco
LEVEL = None
# pezzi staccati piu' piccoli di tanto (diagonale, m) spariscono: bulloni,
# staffe e tubi sottili che la riduzione non sa togliere e da lontano non si vedono
SMALL = {'high': 0.18, 'low': 0.35}
PART_TRIS = 6            # triangoli che restano in media a un pezzo ridotto
TEX = {'high': 1024, 'low': 512}
NEUTRAL = ('Banner 1', 'Banner 2', 'Banner 3', 'Screen Banner')
SEAT_W = 0.5             # metri per posto lungo la fila
SEAT_H = 0.85            # altezza della striscia dei seggiolini
SEAT_STEP = 2.0          # metri fra due vertici della striscia (le curve restano curve)
FAN_W = 0.56             # metri fra due tifosi sulla stessa fila
FAN_FILL = 0.9
random.seed(27)


def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


def load_structure():
    bpy.ops.import_scene.fbx(filepath=FBX)
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and (o.name not in KEEP or (LEVEL == 'low' and o.name in LOW_DROP)):
            bpy.data.objects.remove(o, do_unlink=True)
    # trasformazioni nei vertici, senza genitori (vuoti dei gruppi)
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        mw = o.matrix_world.copy()
        o.parent = None
        o.data.transform(mw)
        o.matrix_world.identity()
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o, do_unlink=True)
    # terreno fuori dal campo: senza materiale nell'FBX; erba scura (il gioco lo abbassa sotto il suo prato)
    g = bpy.data.objects.get('Ground')
    if g:
        m = bpy.data.materials.new('Ground')
        m.use_nodes = True
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.05, 0.12, 0.04, 1)
        m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.95
        g.data.materials.clear()
        g.data.materials.append(m)


def unify_materials():
    """Materiali doppi dell'FBX ("Concrete 1.001") -> l'originale."""
    names = {m.name for m in bpy.data.materials}
    for o in bpy.data.objects:
        for s in o.material_slots:
            m = s.material
            if m and '.' in m.name and m.name.rsplit('.', 1)[0] in names:
                s.material = bpy.data.materials[m.name.rsplit('.', 1)[0]]


def dissolve(o, small, want):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    # vertici doppi saldati: l'FBX divide le facce e la riduzione non passa i bordi
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.002)
    bm.faces.index_update()
    seen, parts = set(), []
    for f in bm.faces:
        if f.index in seen:
            continue
        part, stack = [], [f]
        seen.add(f.index)
        while stack:
            g = stack.pop()
            part.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen:
                        seen.add(h.index)
                        stack.append(h)
        vs = {v for g in part for v in g.verts}
        lo = Vector((min(v.co.x for v in vs), min(v.co.y for v in vs), min(v.co.z for v in vs)))
        hi = Vector((max(v.co.x for v in vs), max(v.co.y for v in vs), max(v.co.z for v in vs)))
        parts.append(((hi - lo).length, part))
    # ogni pezzo chiuso resta almeno un tetraedro: se i pezzi sono troppi per
    # il budget restano i piu' grandi (ringhiere e tralicci fatti di scatole)
    parts.sort(key=lambda p: -p[0])
    room = max(1, int(want / PART_TRIS))
    gone = [f for i, (d, part) in enumerate(parts) if d < small or i >= room for f in part]
    if gone:
        bmesh.ops.delete(bm, geom=gone, context='FACES')
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), use_dissolve_boundaries=False,
                             verts=bm.verts[:], edges=bm.edges[:], delimit={'MATERIAL', 'UV'})
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(o.data)
    bm.free()


def decimate(level):
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        want = KEEP[o.name] * (1 if level == 'high' else LOW_K)
        dissolve(o, SMALL[level], want)
        n = tris(o)
        if want >= n * 0.98:
            continue
        m = o.modifiers.new('dec', 'DECIMATE')
        m.ratio = want / n
        m.use_collapse_triangulate = True
        dg.update()
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        o.modifiers.clear()
        old = o.data
        o.data = me
        bpy.data.meshes.remove(old)
        print(f'  {o.name}: {n} -> {tris(o)} (voluti {int(want)})')
    print('struttura', sum(tris(o) for o in objs), 'triangoli')


def join_by_material():
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='MATERIAL')
    bpy.ops.object.mode_set(mode='OBJECT')
    for o in [o for o in bpy.data.objects if o.type == 'MESH']:
        if len(o.data.polygons) == 0:
            bpy.data.objects.remove(o, do_unlink=True)
            continue
        m = o.material_slots[0].material if o.material_slots else None
        o.name = o.data.name = m.name if m else 'Stadium'
        # una sola fessura: quelle vuote fanno primitive in piu' nel glTF
        while len(o.material_slots) > 1:
            idx = [i for i, s in enumerate(o.material_slots) if s.material != m]
            if not idx: break
            o.active_material_index = idx[-1]
            bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.material_slot_remove()


def neutral_image():
    im = bpy.data.images.get('kfm_neutro') or bpy.data.images.new('kfm_neutro', 8, 8)
    im.pixels[:] = [0.5, 0.5, 0.5, 1.0] * 64
    im.filepath_raw = os.path.join(TMP, 'kfm_neutro.png')
    im.file_format = 'PNG'
    os.makedirs(os.path.dirname(im.filepath_raw), exist_ok=True)
    im.save()
    return im


def fix_textures(limit):
    """Banner neutri, texture ridotte e salvate (JPEG se opache)."""
    neutral = neutral_image()
    tmp = TMP
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            if n.type != 'TEX_IMAGE' or not n.image:
                continue
            if m.name.startswith(NEUTRAL):
                n.image = neutral
    done = set()
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            im = n.image if n.type == 'TEX_IMAGE' else None
            if not im or im.name in done or im == neutral:
                continue
            done.add(im.name)
            if im.size[0] == 0:
                continue
            w, h = im.size
            k = min(1.0, limit / max(w, h))
            if k < 1:
                im.scale(max(4, int(w * k)), max(4, int(h * k)))
            alpha = im.filepath.lower().endswith('.png')
            base = bpy.path.clean_name(im.name)
            im.filepath_raw = os.path.join(tmp, base + ('.png' if alpha else '.jpg'))
            im.file_format = 'PNG' if alpha else 'JPEG'
            im.save()


def bake_ao(objs):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 24
    sc.cycles.device = 'CPU'
    if not sc.world:
        sc.world = bpy.data.worlds.new('w')
    sc.world.light_settings.distance = 9.0
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        me = o.data
        # per vertice: per angolo il glTF sdoppierebbe i vertici di ogni faccia
        a = me.color_attributes.new('AO', 'BYTE_COLOR', 'POINT')
        me.color_attributes.active_color = a
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    # l'occlusione non scende sotto 0,35: sotto il tetto resta luce diffusa
    for o in objs:
        a = o.data.color_attributes['AO']
        c = np.empty(len(a.data) * 4, dtype=np.float32)
        a.data.foreach_get('color', c)
        c = c.reshape(-1, 4)
        c[:, :3] = 0.35 + 0.65 * c[:, :3]
        c[:, 3] = 1
        a.data.foreach_set('color', c.ravel())


def splines(prefix):
    data = json.load(open(SPLINES, encoding='utf-8'))
    return [s for s in data if s['name'].startswith(prefix)]


def to_pitch(p):
    """Direzione orizzontale verso il punto piu' vicino del campo."""
    cx = max(-52.5, min(52.5, p[0])); cy = max(-34.0, min(34.0, p[1]))
    d = Vector((cx - p[0], cy - p[1], 0))
    return d.normalized() if d.length > 1e-3 else Vector((0, 0, 0))


def resample(pts, step):
    pts = [Vector(p) for p in pts]
    out = [pts[0]]
    acc = 0
    for a, b in zip(pts, pts[1:]):
        acc += (b - a).length
        if acc >= step:
            out.append(b); acc = 0
    if out[-1] != pts[-1]:
        out.append(pts[-1])
    return out


def seat_rows(level):
    """Una striscia verticale per fila, rivolta al campo; u = posti."""
    rows = splines('Seats')
    verts, faces, uvs = [], [], []
    step = SEAT_STEP if level == 'high' else SEAT_STEP * 2
    for s in rows:
        pts = resample(s['points'], step)
        if len(pts) < 2:
            continue
        # verso: la normale della fila deve guardare il campo
        t = (pts[-1] - pts[0]); t.z = 0
        mid = pts[len(pts) // 2]
        n = Vector((-t.y, t.x, 0))
        flip = n.dot(to_pitch(mid)) < 0
        if flip:
            pts = pts[::-1]
        u0 = random.random() * 16
        u = u0
        base = len(verts)
        for i, p in enumerate(pts):
            if i:
                u += (p - pts[i - 1]).length / SEAT_W
            verts += [(p.x, p.y, p.z), (p.x, p.y, p.z + SEAT_H)]
            uvs += [(u / 32, 0), (u / 32, 1)]
        for i in range(len(pts) - 1):
            a = base + 2 * i
            faces.append((a, a + 2, a + 3, a + 1))
    me = bpy.data.meshes.new('Seats')
    me.from_pydata(verts, [], faces)
    uv = me.uv_layers.new(name='UVMap')
    loop_uv = []
    for f in me.polygons:
        for li in f.loop_indices:
            loop_uv.append(uvs[me.loops[li].vertex_index])
    uv.data.foreach_set('uv', np.array(loop_uv, dtype=np.float32).ravel())
    o = bpy.data.objects.new('Seats', me)
    bpy.context.scene.collection.objects.link(o)
    mat = bpy.data.materials.new('Seats')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    img_path = os.path.join(SPRITES, 'seats.png')
    if os.path.exists(img_path):
        im = bpy.data.images.load(img_path)
    else:
        im = seat_strip_fallback()
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = im
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    bsdf.inputs['Roughness'].default_value = 0.6
    me.materials.append(mat)
    print('seggiolini: file', len(rows), 'quad', len(faces))
    return o


def seat_strip_fallback():
    """Fila di 32 posti disegnata a mano, se manca la resa dei seggiolini."""
    W, H = 32 * 32, 54
    px = np.zeros((H, W, 4), dtype=np.float32)
    rnd = random.Random(5)
    for i in range(32):
        x0 = i * 32
        folded = rnd.random() < 0.6
        col = (0.12, 0.2, 0.42)
        top = 50 if folded else 46
        px[6:top, x0 + 4:x0 + 28, :3] = col
        px[6:top, x0 + 4:x0 + 28, 3] = 1
        if not folded:
            px[6:16, x0 + 2:x0 + 30, :3] = [c * 0.8 for c in col]
            px[6:16, x0 + 2:x0 + 30, 3] = 1
    im = bpy.data.images.new('seats_strip', W, H, alpha=True)
    im.pixels[:] = px.ravel()
    im.filepath_raw = os.path.join(TMP, 'seats_strip.png')
    im.file_format = 'PNG'
    im.save()
    return im


def crowd_points():
    """Punti dei tifosi sulle loro spline, in ordine casuale."""
    pts = []
    for s in splines('Fans'):
        p = [Vector(q) for q in s['points']]
        acc = random.random() * FAN_W
        for a, b in zip(p, p[1:]):
            seg = (b - a).length
            while acc < seg:
                if random.random() < FAN_FILL:
                    q = a.lerp(b, acc / seg)
                    pts.append((q.x, q.y, q.z))
                acc += FAN_W * (0.85 + 0.3 * random.random())
            acc -= seg
    random.shuffle(pts)
    # nelle extras del glTF: il GLTFLoader non carica i vertici sciolti
    o = bpy.data.objects.new('Crowd', None)
    bpy.context.scene.collection.objects.link(o)
    o['points'] = ','.join(f'{x:.2f},{y:.2f},{z:.2f}' for x, y, z in pts)
    print('tifosi', len(pts))
    return o


def crowd_atlas_carrier():
    """Un triangolo minuscolo sotto terra che porta l'atlante dei tifosi."""
    path = os.path.join(SPRITES, 'crowd.png')
    if not os.path.exists(path):
        return None
    me = bpy.data.meshes.new('CrowdAtlas')
    me.from_pydata([(0, 0, -5), (0.01, 0, -5), (0, 0.01, -5)], [], [(0, 1, 2)])
    me.uv_layers.new(name='UVMap')
    o = bpy.data.objects.new('CrowdAtlas', me)
    bpy.context.scene.collection.objects.link(o)
    mat = bpy.data.materials.new('CrowdAtlas')
    mat.use_nodes = True
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(path)
    bsdf = mat.node_tree.nodes['Principled BSDF']
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    me.materials.append(mat)
    return o


def preview(name):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'TEXTURE'
    sc.render.resolution_x, sc.render.resolution_y = 1600, 740
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    os.makedirs(PREVIEW, exist_ok=True)
    # visuale di gioco: telecamera a 24 m di altezza e 50 m dal centro, sul lato della tribuna VIP
    for tag, loc, look, lens in (('gioco', (0, -50, 24), (0, 0, 0), 30), ('largo', (-120, -150, 90), (0, 0, 0), 24),
                                 ('fondo', (-40, 20, 12), (60, 0, 8), 22)):
        cam.location = Vector(loc)
        cam.rotation_euler = (Vector(look) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        cam.data.clip_end = 2000
        sc.render.filepath = os.path.join(PREVIEW, f'{name}_{tag}.png')
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)


def build(level):
    global LEVEL
    LEVEL = level
    clean()
    load_structure()
    unify_materials()
    decimate(level)
    join_by_material()
    fix_textures(TEX[level])
    structure = [o for o in bpy.data.objects if o.type == 'MESH']
    if AO:
        bake_ao(structure)
    seat_rows(level)
    crowd_points()
    crowd_atlas_carrier()
    total = sum(tris(o) for o in bpy.data.objects if o.type == 'MESH')
    print(level, 'oggetti', len([o for o in bpy.data.objects if o.type == 'MESH']), 'triangoli', total)
    if PREVIEW:
        preview(level)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f'stadium-{level}.glb')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=False,
                              export_yup=True, export_apply=True, export_texcoords=True,
                              export_normals=True, export_vertex_color='ACTIVE',
                              export_all_vertex_colors=False, export_extras=True,
                              export_image_format='AUTO', export_animations=False,
                              export_cameras=False, export_lights=False)
    print('scritto', path, os.path.getsize(path) // 1024, 'KB')


for lv in LEVELS:
    build(lv)
