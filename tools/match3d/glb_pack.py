"""Riscrive un GLB di sole animazioni esportato da Blender in un pacchetto leggero.

- toglie le tracce di scala e di posizione, tranne la posizione dell'anca;
- riduce i fotogrammi di ogni clip insieme per tutte le ossa (un fotogramma
  resta solo se, interpolando fra i vicini, qualche osso sbaglierebbe oltre la
  tolleranza): un solo array dei tempi per clip;
- un osso fermo in tutta la clip diventa una chiave sola;
- rotazioni in interi a 16 bit normalizzati (glTF lo permette): meta' memoria,
  errore sotto un decimillesimo di radiante;
- mette i metadati di ogni clip negli extras del GLB (gltf.userData in three.js).

Gira dentro Blender (numpy). pack(raw, out, metas, hips) -> dizionario di numeri.
"""
import json, struct
import numpy as np

TOL_ROT = 0.005       # rad: errore massimo di un osso del corpo (0,3 gradi, 2 mm a 40 cm)
TOL_FINGER = 0.02     # rad: le dita si vedono appena
TOL_POS = 0.25        # unita' dell'armatura (cm): posizione dell'anca
# array dei metadati che vanno nel buffer binario (Float32) invece che nel JSON
BIN_KEYS = ("root", "feet", "palms")
BIN_GAIT = ("poses",)
FLOAT, SHORT, SCALAR, VEC3, VEC4 = 5126, 5122, "SCALAR", "VEC3", "VEC4"


def read_glb(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    o = 20 + jl
    bl = struct.unpack("<I", b[o:o + 4])[0]
    return j, b[o + 8:o + 8 + bl]


def accessor(j, bin_, i):
    a = j["accessors"][i]
    v = j["bufferViews"][a["bufferView"]]
    n = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[a["type"]]
    off = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    assert a["componentType"] == FLOAT
    return np.frombuffer(bin_, dtype="<f4", count=a["count"] * n, offset=off).reshape(a["count"], n).astype(np.float64)


def quat_angle(a, b):
    d = np.abs(np.sum(a * b, axis=-1))
    return 2 * np.arccos(np.clip(d, -1, 1))


def slerp(a, b, u):
    """a, b: (..., 4); u: (k,) -> (k, ..., 4)"""
    d = np.sum(a * b, axis=-1, keepdims=True)
    b = np.where(d < 0, -b, b)
    d = np.abs(d)
    th = np.arccos(np.clip(d, -1, 1))
    s = np.sin(th)
    small = s < 1e-6
    u = u.reshape((-1,) + (1,) * a.ndim)
    wa = np.where(small, 1 - u, np.sin((1 - u) * th) / np.where(small, 1, s))
    wb = np.where(small, u, np.sin(u * th) / np.where(small, 1, s))
    return wa * a + wb * b


def reduce_frames(times, rots, tols, pos):
    """Indici dei fotogrammi da tenere (Ramer-Douglas-Peucker su tutte le ossa)."""
    n = len(times)
    keep = {0, n - 1}
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2:
            continue
        idx = np.arange(a + 1, b)
        u = (times[idx] - times[a]) / (times[b] - times[a])
        worst, at = 0.0, None
        if rots is not None:
            q = slerp(rots[:, a], rots[:, b], u)          # (k, tracks, 4)
            err = quat_angle(q, np.transpose(rots[:, idx], (1, 0, 2))) / tols[None, :]
            k = np.unravel_index(np.argmax(err), err.shape)
            worst, at = err[k], idx[k[0]]
        if pos is not None:
            p = pos[a] + (pos[b] - pos[a]) * u[:, None]
            e = np.linalg.norm(p - pos[idx], axis=1) / TOL_POS
            k = int(np.argmax(e))
            if e[k] > worst:
                worst, at = e[k], idx[k]
        if worst > 1:
            keep.add(int(at))
            stack.append((a, int(at)))
            stack.append((int(at), b))
    return sorted(keep)


class Writer:
    """Dati in un solo buffer; un bufferView per clip, gli accessor ci puntano
    con un offset (meno JSON da leggere al caricamento)."""
    def __init__(self):
        self.bin = bytearray()
        self.views, self.accs = [], []
        self.view_start = None

    def begin(self):
        while len(self.bin) % 4:
            self.bin.append(0)
        self.view_start = len(self.bin)

    def end(self):
        self.views.append({"buffer": 0, "byteOffset": self.view_start, "byteLength": len(self.bin) - self.view_start})
        for a in self.accs:
            if a.get("bufferView") is None:
                a["bufferView"] = len(self.views) - 1
        self.view_start = None

    def add(self, arr, typ, minmax=False, short=False):
        while (len(self.bin) - self.view_start) % 4:
            self.bin.append(0)
        if short:
            arr = np.ascontiguousarray(np.clip(np.round(arr * 32767), -32767, 32767), dtype="<i2")
        else:
            arr = np.ascontiguousarray(arr, dtype="<f4")
        off = len(self.bin) - self.view_start
        self.bin += arr.tobytes()
        a = {"bufferView": None, "byteOffset": off, "componentType": SHORT if short else FLOAT, "count": arr.shape[0], "type": typ}
        if short:
            a["normalized"] = True
        if minmax:
            a["min"] = [float(arr.min())]
            a["max"] = [float(arr.max())]
        self.accs.append(a)
        return len(self.accs) - 1

    def floats(self, values):
        """Array di metadati nel buffer: {'@': byte offset, 'n': quanti}."""
        arr = np.asarray(values, dtype="<f4")
        while len(self.bin) % 4:
            self.bin.append(0)
        off = len(self.bin)
        self.bin += arr.tobytes()
        return {"@": off, "n": int(arr.size)}


def pack(raw, out, metas, hips):
    j, bin_ = read_glb(raw)
    nodes = j["nodes"]
    name_of = [n.get("name") for n in nodes]
    hips_node = name_of.index(hips)
    w = Writer()
    w.begin()
    zero = w.add(np.zeros(1), SCALAR, True)       # tempo della chiave sola, condiviso
    w.end()
    rest = {}
    for i, n in enumerate(nodes):
        r = n.get("rotation", [0, 0, 0, 1])
        rest[i] = np.array(r, dtype=np.float64)
    anims = []
    stats = {"clips": 0, "framesIn": 0, "framesOut": 0, "tracks": 0, "constTracks": 0, "restTracks": 0, "bytes": 0}
    for a in j.get("animations", []):
        if a["name"] not in metas:
            continue
        rot_ch, pos_ch = [], None
        times = None
        for ch in a["channels"]:
            t = ch["target"]
            s = a["samplers"][ch["sampler"]]
            if times is None:
                times = accessor(j, bin_, s["input"])[:, 0]
            if t["path"] == "rotation":
                rot_ch.append((t["node"], accessor(j, bin_, s["output"])))
            elif t["path"] == "translation" and t["node"] == hips_node:
                pos_ch = accessor(j, bin_, s["output"])
        n = len(times)
        # quaternioni continui (niente salti di segno fra un fotogramma e l'altro)
        R = np.stack([q for _, q in rot_ch])                # (tracks, n, 4)
        for i in range(1, n):
            flip = np.sum(R[:, i] * R[:, i - 1], axis=-1) < 0
            R[flip, i] *= -1
        tol = np.array([TOL_FINGER if "Hand" in name_of[nd] and any(f in name_of[nd] for f in ("Thumb", "Index", "Middle", "Ring", "Pinky")) else TOL_ROT
                        for nd, _ in rot_ch])
        # ossa ferme: una chiave sola; ferme nella posa di riposo: nessuna traccia
        # (senza tracce il mixer di three.js le riporta alla posa originale)
        dev = quat_angle(R, R[:, :1]).max(axis=1)
        const = dev < tol * 0.5
        at_rest = np.array([const[k] and quat_angle(R[k, 0], rest[nd]) < tol[k] * 0.5 for k, (nd, _) in enumerate(rot_ch)])
        moving = ~const
        keep = reduce_frames(times, R[moving] if moving.any() else None, tol[moving], pos_ch)
        tkeep = times[keep]
        w.begin()
        tin = w.add(tkeep, SCALAR, True)
        samplers, channels = [], []
        for k, (nd, q) in enumerate(rot_ch):
            if at_rest[k]:
                stats["restTracks"] += 1
                continue
            if const[k]:
                out_i = w.add(R[k, :1], VEC4, short=True)
                samplers.append({"input": zero, "output": out_i})
                stats["constTracks"] += 1
                stats["bytes"] += 8
            else:
                out_i = w.add(R[k, keep], VEC4, short=True)
                samplers.append({"input": tin, "output": out_i})
                stats["bytes"] += 8 * len(keep)
            channels.append({"sampler": len(samplers) - 1, "target": {"node": nd, "path": "rotation"}})
        if pos_ch is not None:
            out_i = w.add(pos_ch[keep], VEC3)
            samplers.append({"input": tin, "output": out_i})
            channels.append({"sampler": len(samplers) - 1, "target": {"node": hips_node, "path": "translation"}})
            stats["bytes"] += 12 * len(keep)
        stats["bytes"] += 4 * len(keep)
        w.end()
        anims.append({"name": a["name"], "channels": channels, "samplers": samplers})
        stats["clips"] += 1
        stats["framesIn"] += n
        stats["framesOut"] += len(keep)
        stats["tracks"] += len(channels)
    missing = sorted(set(metas) - set(x["name"] for x in anims))
    if missing:
        raise RuntimeError("clip non esportate: %s" % missing[:10])
    # metadati: gli array lunghi nel buffer, il resto nel JSON
    for name, m in metas.items():
        for k in BIN_KEYS:
            if k in m:
                m[k] = w.floats(m[k])
        g = m.get("gait")
        if g:
            for k in BIN_GAIT:
                if k in g:
                    g[k] = w.floats(g[k])
    # solo lo scheletro: nodi, scena, animazioni; i metadati negli extras
    for n in nodes:
        n.pop("mesh", None)
        n.pop("skin", None)
    out_j = {
        "asset": {"version": "2.0", "generator": "kfm27 studio33_build"},
        "scene": 0, "scenes": j["scenes"], "nodes": nodes,
        "animations": anims, "accessors": w.accs, "bufferViews": w.views,
        "buffers": [{"byteLength": len(w.bin)}],
        "extras": {"clips": metas},
    }
    js = json.dumps(out_j, separators=(",", ":")).encode("utf-8")
    while len(js) % 4:
        js += b" "
    body = bytes(w.bin)
    while len(body) % 4:
        body += b"\0"
    total = 12 + 8 + len(js) + 8 + len(body)
    with open(out, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A))
        f.write(js)
        f.write(struct.pack("<II", len(body), 0x004E4942))
        f.write(body)
    stats["animBytes"] = stats.pop("bytes")
    stats["jsonBytes"] = len(js)
    stats["keptShare"] = round(stats["framesOut"] / max(1, stats["framesIn"]), 3)
    return stats
