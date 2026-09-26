"""Vestiti del Calciatore (Mixamo Ch38) per player.glb: pesi, orlo, decimazione.

Usato da build_player_glb.py (dentro Blender).
- restrict(): i pesi originali di ogni capo, solo sulle ossa ammesse (maglia:
  bacino, colonna, spalle e braccia, mai le cosce; pantaloncini: bacino e
  cosce, mai il busto; calzettoni: gambe e piedi). Il peso di un osso non
  ammesso passa all'osso ammesso piu' vicino nella catena (o a quello indicato).
- shape_shirt(): maglia leggermente piu' corta e svasata. Lunga, con il
  ginocchio alto il pantaloncino sulla coscia bucava l'orlo davanti; infilata,
  la vita si seghettava dove le due stoffe si incrociano.
- shorts_under_shirt(): dove la maglia copre i pantaloncini, i pantaloncini
  seguono solo il bacino come l'orlo: nessun movimento fra i due strati.
- remove_covered(): via le facce del corpo coperte dai vestiti.
- decimate(): la riduzione non tocca bordi aperti e spigoli (orli, polsini,
  colletto): con la decimazione di prima erano seghettati.
"""
import bmesh
from mathutils.bvhtree import BVHTree

ALLOW = {
    "Ch38_Shirt": ({"Hips", "Spine", "Spine1", "Spine2", "Neck", "LeftShoulder", "LeftArm", "LeftForeArm",
                    "RightShoulder", "RightArm", "RightForeArm"}, {}),
    "Ch38_Shorts": ({"Hips", "LeftUpLeg", "RightUpLeg"}, {}),
    "Ch38_Socks": ({"LeftLeg", "RightLeg", "LeftFoot", "RightFoot"},
                   {"LeftUpLeg": "LeftLeg", "RightUpLeg": "RightLeg"}),
}
HEM_LIFT = 0.034      # m: di quanto sale l'orlo della maglia
HEM_SPAN = 0.2        # m sopra l'orlo su cui si distribuisce (l'orlo, spesso, non si deforma)
HEM_FLARE = 0.008     # m: di quanto si allarga l'orlo
HEM_FLARE_H = 0.06    # m sopra l'orlo su cui sfuma l'allargamento


def short(name):
    return name.split(":")[-1]


def _smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def restrict(ob, arm, allowed, remap):
    """Pesi del capo solo sulle ossa `allowed` (nomi corti), max 4, normalizzati.
    Ritorna il peso totale spostato."""
    parent = {short(b.name): (short(b.parent.name) if b.parent else None) for b in arm.data.bones}
    full = {short(b.name): b.name for b in arm.data.bones}

    def target(n):
        if n in allowed:
            return n
        if n in remap:
            return remap[n]
        p = parent.get(n)
        while p and p not in allowed:
            p = parent.get(p)
        return p
    names = [short(g.name) for g in ob.vertex_groups]
    for n in allowed:
        if full[n] not in ob.vertex_groups:
            ob.vertex_groups.new(name=full[n])
    groups = {short(g.name): g for g in ob.vertex_groups}
    moved = 0.0
    for v in ob.data.vertices:
        acc = {}
        for g in v.groups:
            n = names[g.group]
            t = target(n)
            if t is None or g.weight <= 0:
                continue
            if t != n:
                moved += g.weight
            acc[t] = acc.get(t, 0.0) + g.weight
        top = sorted(acc.items(), key=lambda x: -x[1])[:4]
        s = sum(w for _, w in top) or 1.0
        for gi in [g.group for g in v.groups]:
            ob.vertex_groups[gi].remove([v.index])
        for n, w in top:
            groups[n].add([v.index], w / s, 'REPLACE')
    for g in list(ob.vertex_groups):
        if short(g.name) not in allowed:
            ob.vertex_groups.remove(g)
    return moved


def zmin(ob):
    return min((ob.matrix_world @ v.co).z for v in ob.data.vertices)


def shape_shirt(shirt):
    """Orlo alzato di HEM_LIFT (la parte bassa sale in blocco, la differenza si
    distribuisce su HEM_SPAN) e allargato di HEM_FLARE. Ritorna l'altezza dell'orlo."""
    mw = shirt.matrix_world
    inv = mw.inverted()
    nm = mw.to_3x3().inverted().transposed()
    lo = zmin(shirt)
    for v in shirt.data.vertices:
        p = mw @ v.co
        z0 = p.z
        if z0 >= lo + 0.05 + HEM_SPAN:
            continue
        p.z += HEM_LIFT * _smooth((lo + 0.05 + HEM_SPAN - z0) / HEM_SPAN)
        f = _smooth((lo + HEM_FLARE_H - z0) / HEM_FLARE_H)
        if f > 0:
            n = nm @ v.normal
            n.z = 0
            if n.length > 1e-6:
                p += n.normalized() * (HEM_FLARE * f)
        v.co = inv @ p
    return lo + HEM_LIFT


def shorts_under_shirt(shorts, hem_z, band=0.04, gap=0.006):
    """Sopra hem_z - gap i pantaloncini seguono solo il bacino; nella fascia sotto sfumano.
    Ritorna quanti vertici ha cambiato."""
    hips = next(g for g in shorts.vertex_groups if short(g.name) == "Hips")
    top, low = hem_z - gap, hem_z - gap - band
    n = 0
    for v in shorts.data.vertices:
        z = (shorts.matrix_world @ v.co).z
        if z <= low:
            continue
        t = _smooth(1.0 if z >= top else (z - low) / band)
        ws = {g.group: g.weight * (1 - t) for g in v.groups}
        ws[hips.index] = ws.get(hips.index, 0.0) + t
        for gi in [g.group for g in v.groups]:
            shorts.vertex_groups[gi].remove([v.index])
        s = sum(ws.values()) or 1.0
        for gi, w in ws.items():
            if w > 1e-4:
                shorts.vertex_groups[gi].add([v.index], w / s, 'REPLACE')
        n += 1
    return n


def remove_covered(body, covers, reach=0.05):
    """Facce del corpo con tutti i vertici sotto un vestito (entro `reach` m lungo la normale)."""
    trees = []
    for ob in covers:
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bm.transform(ob.matrix_world)
        trees.append(BVHTree.FromBMesh(bm))
        bm.free()
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.normal_update()
    mw = body.matrix_world
    nmat = mw.to_3x3().inverted().transposed()
    covered = []
    for v in bm.verts:
        p = mw @ v.co
        nrm = (nmat @ v.normal).normalized()
        covered.append(any(t.ray_cast(p + nrm * 0.002, nrm, reach)[0] is not None for t in trees))
    dead = [f for f in bm.faces if all(covered[v.index] for v in f.verts)]
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    bm.to_mesh(body.data)
    bm.free()
    return len(dead)


def protected(ob, angle=0.87):
    """Vertici da non decimare: bordi aperti e spigoli oltre `angle` rad."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    keep = set()
    for e in bm.edges:
        if e.is_boundary or (len(e.link_faces) == 2 and e.calc_face_angle(0.0) > angle):
            keep.update(v.index for v in e.verts)
    bm.free()
    return keep


def decimate(bpy, ob, target, protect=True):
    """Decimazione a `target` triangoli; ritorna (prima, dopo, vertici protetti)."""
    before = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    keep = protected(ob) if protect else set()
    g = ob.vertex_groups.new(name="_decimate")
    g.add([v.index for v in ob.data.vertices if v.index not in keep], 1.0, 'REPLACE')
    if keep:
        g.add(list(keep), 0.0, 'REPLACE')
    mod = ob.modifiers.new("decimate", 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = min(1.0, target / float(before))
    mod.use_collapse_triangulate = True
    mod.vertex_group = "_decimate"
    mod.vertex_group_factor = 20.0
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)
    ob.vertex_groups.remove(ob.vertex_groups["_decimate"])
    after = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    return before, after, len(keep)
