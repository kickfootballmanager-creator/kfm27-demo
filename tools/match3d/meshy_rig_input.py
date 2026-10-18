"""Il Calciatore come modello statico per il rigging di Meshy (blocco F).

Meshy vuole un GLB umanoide con texture, viso verso +Z: qui le parti di
player.glb (corpo, capelli, divisa, scarpe) nella posa di riposo, senza
scheletro, con i colori della divisa come materiali semplici.

  blender -b --factory-startup -P tools/match3d/meshy_rig_input.py -- OUT.glb
"""
import bpy, sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'src', 'assets', 'match3d', 'player.glb'))
COLORS = {'kit_shirt': (0.75, 0.1, 0.1, 1), 'kit_shorts': (0.95, 0.95, 0.95, 1),
          'kit_socks': (0.75, 0.1, 0.1, 1), 'boots': (0.08, 0.08, 0.08, 1), 'hair': (0.12, 0.08, 0.05, 1)}
for o in list(bpy.data.objects):
    if o.type == 'MESH' and not o.name.startswith('Ch38'):
        bpy.data.objects.remove(o, do_unlink=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
dg = bpy.context.evaluated_depsgraph_get()
for o in meshes:
    # posa di riposo: via il modificatore dell'armatura, poi la geometria nel mondo
    for m in list(o.modifiers):
        o.modifiers.remove(m)
    mw = o.matrix_world.copy()
    o.parent = None
    o.data.transform(mw)
    o.matrix_world.identity()
    o.vertex_groups.clear()
    for m in o.data.materials:
        if m and m.name in COLORS:
            m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = COLORS[m.name]
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o, do_unlink=True)
lo = min(min((o.matrix_world @ v.co).z for v in o.data.vertices) for o in meshes)
hi = max(max((o.matrix_world @ v.co).z for v in o.data.vertices) for o in meshes)
print('altezza', round(hi - lo, 3))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, export_animations=False, export_skins=False)
print('scritto', out, os.path.getsize(out) // 1024, 'KB')
