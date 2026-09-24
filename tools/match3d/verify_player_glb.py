"""Verifica player.glb leggendo il binario glTF. Si esegue dentro Blender solo
per avere mathutils: non apre ne' importa nulla, legge il file e basta.
"""
import struct, json, os, math
from mathutils import Matrix, Quaternion, Vector

PATH = r"C:\Users\UTENTE\Desktop\kfm27\src\assets\match3d\player.glb"

raw = open(PATH, "rb").read()
magic, ver, total = struct.unpack("<4sII", raw[:12])
assert magic == b"glTF"
off, chunks = 12, {}
while off < len(raw):
    clen, ctype = struct.unpack("<I4s", raw[off:off + 8])
    chunks[ctype.strip(b"\x00").decode()] = raw[off + 8: off + 8 + clen]
    off += 8 + clen
g = json.loads(chunks["JSON"])
BIN = chunks.get("BIN", b"")

CT = {5120: ("b", 1), 5121: ("B", 1), 5122: ("h", 2), 5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
nodes, accs, bvs = g["nodes"], g["accessors"], g["bufferViews"]


def read_acc(i):
    a = accs[i]
    fmt, sz = CT[a["componentType"]]
    n = NC[a["type"]]
    bv = bvs[a["bufferView"]]
    base = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = bv.get("byteStride") or sz * n
    return [struct.unpack_from("<" + fmt * n, BIN, base + k * stride) for k in range(a["count"])]


parent = {}
for i, n in enumerate(nodes):
    for c in n.get("children", []):
        parent[c] = i


def local_matrix(i):
    n = nodes[i]
    if "matrix" in n:
        m = n["matrix"]
        return Matrix([[m[c * 4 + r] for c in range(4)] for r in range(4)])
    t = Matrix.Translation(Vector(n.get("translation", [0, 0, 0])))
    q = n.get("rotation", [0, 0, 0, 1])
    r = Quaternion((q[3], q[0], q[1], q[2])).to_matrix().to_4x4()
    s = Matrix.Diagonal(Vector(n.get("scale", [1, 1, 1])).to_4d())
    return t @ r @ s


def world_matrix(i):
    m = local_matrix(i)
    while i in parent:
        i = parent[i]
        m = local_matrix(i) @ m
    return m


print("=" * 86)
print("FILE        %s   %.2f MB" % (os.path.basename(PATH), len(raw) / 1048576))
print("generator   %s" % g["asset"].get("generator"))
print("estensioni  %s" % (g.get("extensionsUsed") or "nessuna"))

# ------------------------------------------------------------ mesh e materiali
print("\nMESH E MATERIALI")
print("  %-12s %-12s %7s  %s" % ("mesh", "materiale", "tris", "colore / texture"))
tris_tot, tex_bytes = 0, 0
seen_tex = set()
for n in nodes:
    if "mesh" not in n:
        continue
    for p in g["meshes"][n["mesh"]]["primitives"]:
        nt = len(read_acc(p["indices"])) // 3
        tris_tot += nt
        mat = g["materials"][p["material"]]
        pbr = mat.get("pbrMetallicRoughness", {})
        if "baseColorTexture" in pbr:
            img = g["images"][g["textures"][pbr["baseColorTexture"]["index"]]["source"]]
            bl = bvs[img["bufferView"]]["byteLength"]
            if img["bufferView"] not in seen_tex:
                seen_tex.add(img["bufferView"]); tex_bytes += bl
            desc = "texture %s %s, %d KB" % (img.get("name"), img.get("mimeType"), bl // 1024)
        else:
            c = pbr.get("baseColorFactor", [1, 1, 1, 1])
            desc = "tinta unita #%02x%02x%02x" % tuple(
                int(round(min(1, v) ** (1 / 2.2) * 255)) for v in c[:3])
        print("  %-12s %-12s %7d  %s" % (n.get("name", "?")[:12], mat.get("name"), nt, desc))
print("  %-12s %-12s %7d" % ("TOTALE", "", tris_tot))

want = {"kit_shirt", "kit_shorts", "kit_socks"}
have = {m.get("name") for m in g["materials"]}
print("\n  maglia/pantaloncini/calzettoni separati: %s   (materiali: %s)"
      % ("SI" if want <= have else "NO, mancano %s" % (want - have), ", ".join(sorted(have))))

# ------------------------------------------------------------------ scheletro
skin = g["skins"][0]
joints = skin["joints"]
root_joint = joints[0]
print("\nSCHELETRO   %d ossa, radice %s" % (len(joints), nodes[root_joint].get("name")))

# altezza: a posa di legatura jointWorld @ IBM = identita', quindi le POSITION
# grezze sono gia' le coordinate mondo del personaggio.
ymin, ymax = 1e9, -1e9
for n in nodes:
    if "mesh" not in n:
        continue
    for p in g["meshes"][n["mesh"]]["primitives"]:
        a = accs[p["attributes"]["POSITION"]]
        ymin, ymax = min(ymin, a["min"][1]), max(ymax, a["max"][1])
print("ALTEZZA     %.3f m  (Y da %.3f a %.3f, posa di legatura)" % (ymax - ymin, ymin, ymax))

# ------------------------------------------------------------------ animazioni
anims = g.get("animations", [])
anim_bytes = sum(bvs[accs[s[k]]["bufferView"]]["byteLength"]
                 for an in anims for s in an["samplers"] for k in ("input", "output"))
print("\nANIMAZIONI  %d clip" % len(anims))
print("  %-15s %6s %7s %7s  %s" % ("clip", "durata", "canali", "chiavi", "radice: orizz. / verticale"))

pw = world_matrix(parent[root_joint]) if root_joint in parent else Matrix.Identity(4)
problems = []
for an in sorted(anims, key=lambda a: a["name"]):
    dur, keys = 0.0, 0
    for s in an["samplers"]:
        t = read_acc(s["input"])
        keys += len(t)
        if t:
            dur = max(dur, t[-1][0])
    desc = "nessun canale sulla radice"
    for ch in an["channels"]:
        if ch["target"].get("node") == root_joint and ch["target"]["path"] == "translation":
            pts = [pw @ Vector(v) for v in read_acc(an["samplers"][ch["sampler"]]["output"])]
            # in glTF Y e' l'alto: orizzontale = XZ
            horiz = max(math.hypot(p.x - q.x, p.z - q.z) for p in pts for q in (pts[0],))
            net = math.hypot(pts[-1].x - pts[0].x, pts[-1].z - pts[0].z)
            up = max(p.y for p in pts) - min(p.y for p in pts)
            state = "IN PLACE" if horiz < 0.02 else "DERIVA %.2f m" % horiz
            desc = "escursione %.3f m, netto %.3f m, su/giu %.2f m   %s" % (horiz, net, up, state)
            if horiz >= 0.02:
                problems.append("%s: si sposta ancora di %.2f m" % (an["name"], horiz))
            if up < 0.005:
                problems.append("%s: radice senza saliscendi" % an["name"])
            break
    print("  %-15s %6.2f %7d %7d  %s" % (an["name"], dur, len(an["channels"]), keys, desc))

print("\nPESO        texture %d KB, animazioni %d KB, resto %d KB"
      % (tex_bytes // 1024, anim_bytes // 1024,
         (len(raw) - tex_bytes - anim_bytes) // 1024))
print("            canali per clip: %d (65 ossa x 3 = 195 senza ottimizzazione)"
      % (len(anims[0]["channels"]) if anims else 0))

print("\nESITO       %s" % ("tutto a posto" if not problems else "PROBLEMI:"))
for p in problems:
    print("            !", p)
