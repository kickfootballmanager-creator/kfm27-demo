"""Punte dei piedi nelle clip Mixamo di player.glb, corrette sul GLB esportato.

In 37 clip su 41 la punta scatta (fino a 1,7 rad fra due chiavi a 30 fps) o fa
un giro intero su se stessa e torna dov'era (throw_in, gk_dive, tripped): nel
gioco il dito ruotava fino a 1 rad in 1/60 s. La rotazione della punta nel GLB
e' gia' relativa al piede. Ogni tratto di chiavi piu' veloci di TOE_FAST, piu'
TOE_PAD chiavi per parte, diventa l'interpolazione (slerp) fra le chiavi ai
bordi: il giro sparisce, lo scatto si distribuisce. Prima e ultima chiave non
cambiano (i cicli restano chiusi). Rilanciarlo non cambia piu' niente.

Da build_player_glb.py dopo l'export, oppure da solo:
    python tools/match3d/glb_toes.py src/assets/match3d/player.glb
"""
import json, math, struct, sys

TOE_FAST = 0.35   # rad fra due chiavi a 30 fps (10,5 rad/s)
TOE_PAD = 2       # chiavi prese prima e dopo il tratto veloce


def _angle(a, b):
    d = abs(sum(x * y for x, y in zip(a, b)))
    return 2 * math.acos(min(1.0, d))


def _slerp(a, b, t):
    d = sum(x * y for x, y in zip(a, b))
    if d < 0:
        b, d = [-x for x in b], -d
    if d > 0.9995:
        q = [x + (y - x) * t for x, y in zip(a, b)]
    else:
        th = math.acos(d)
        s = math.sin(th)
        wa, wb = math.sin((1 - t) * th) / s, math.sin(t * th) / s
        q = [wa * x + wb * y for x, y in zip(a, b)]
    n = math.sqrt(sum(x * x for x in q)) or 1.0
    return [x / n for x in q]


def fix_toes_glb(path, log=print):
    with open(path, "rb") as f:
        data = bytearray(f.read())
    jl = struct.unpack_from("<I", data, 12)[0]
    js = json.loads(data[20:20 + jl].decode("utf-8"))
    bin0 = 20 + jl + 8

    def acc(i):
        a = js["accessors"][i]
        v = js["bufferViews"][a["bufferView"]]
        return bin0 + v.get("byteOffset", 0) + a.get("byteOffset", 0), a["count"], a["type"], a["componentType"]

    fixed = 0
    for an in js.get("animations", []):
        for ch in an["channels"]:
            name = js["nodes"][ch["target"]["node"]].get("name", "")
            if ch["target"]["path"] != "rotation" or not name.endswith("ToeBase"):
                continue
            s = an["samplers"][ch["sampler"]]
            o_off, n, typ, ct = acc(s["output"])
            i_off, n_in, _, ct_in = acc(s["input"])
            if typ != "VEC4" or ct != 5126 or ct_in != 5126 or n < 3 or n_in != n:
                continue
            t = [struct.unpack_from("<f", data, i_off + 4 * k)[0] for k in range(n)]
            q = [list(struct.unpack_from("<4f", data, o_off + 16 * k)) for k in range(n)]
            fast = [k for k in range(1, n) if _angle(q[k - 1], q[k]) > TOE_FAST]
            if not fast:
                continue
            # tratti di passi veloci consecutivi, allargati e fusi se si toccano
            spans = []
            for k in fast:
                a, b = max(0, k - 1 - TOE_PAD), min(n - 1, k + TOE_PAD)
                if spans and a <= spans[-1][1]:
                    spans[-1][1] = max(spans[-1][1], b)
                else:
                    spans.append([a, b])
            worst = max(_angle(q[k - 1], q[k]) for k in fast)
            for a, b in spans:
                for k in range(a + 1, b):
                    q[k] = _slerp(q[a], q[b], (t[k] - t[a]) / ((t[b] - t[a]) or 1.0))
            for k in range(n):
                struct.pack_into("<4f", data, o_off + 16 * k, *q[k])
            after = max(_angle(q[k - 1], q[k]) for k in range(1, n))
            log("punta %-24s %-12s %d tratti, passo massimo %.2f -> %.2f rad" % (an.get("name", "?"), name.split(":")[-1], len(spans), worst, after))
            fixed += 1
    with open(path, "wb") as f:
        f.write(data)
    return fixed


if __name__ == "__main__":
    print("tracce corrette:", fix_toes_glb(sys.argv[1]))
