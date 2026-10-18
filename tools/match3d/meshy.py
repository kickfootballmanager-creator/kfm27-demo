"""Client minimo per l'API di Meshy (blocco F). La chiave si legge solo dalla
variabile d'ambiente MESHY_API_KEY e non si stampa mai. Ogni compito finisce
in src/assets/match3d/source/meshy/registro.json (id, tipo, crediti, file) e i
file scaricati nella stessa cartella (fuori da git).

  python tools/match3d/meshy.py balance
  python tools/match3d/meshy.py rig FILE.glb NOME [--height 1.79]
  python tools/match3d/meshy.py animate RIG_TASK_ID NOME --actions 452,601
  python tools/match3d/meshy.py animate RIG_TASK_ID NOME --motion MOTION_TASK_ID
  python tools/match3d/meshy.py motion NOME "prompt" [--duration 4] [--mode prime]
  python tools/match3d/meshy.py text3d NOME "prompt" [--pose a-pose] [--texture 4k] [--polys 30000]
"""
import base64, json, os, socket, sys, time, urllib.request, urllib.error

socket.setdefaulttimeout(180)   # un download fermo non blocca il resto
SKIP = ('usdz', 'stl', 'obj', 'mtl', '3mf', 'model_urls_fbx', 'texture_image_url', 'video_url')

API = 'https://api.meshy.ai/openapi'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'src', 'assets', 'match3d', 'source', 'meshy')
LOG = os.path.join(OUT, 'registro.json')


def key():
    k = os.environ.get('MESHY_API_KEY')
    if not k:
        sys.exit('MESHY_API_KEY non impostata')
    return k


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method,
                                 headers={'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        sys.exit(f'{method} {path}: HTTP {e.code} {e.read()[:400].decode(errors="replace")}')


def log(entry):
    os.makedirs(OUT, exist_ok=True)
    rows = json.load(open(LOG, encoding='utf-8')) if os.path.exists(LOG) else []
    rows.append(entry)
    json.dump(rows, open(LOG, 'w', encoding='utf-8'), indent=1)


def urls(obj, prefix=''):
    """Tutti gli URL scaricabili nel risultato, con un nome che dice da dove vengono."""
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            out += urls(v, prefix + k + '.')
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out += urls(v, prefix + str(i) + '.')
    elif isinstance(obj, str) and obj.startswith('http') and prefix.rstrip('.').split('.')[-1] not in ('preview_url',):
        out.append((prefix.rstrip('.'), obj))
    return out


def wait(path, kind, name):
    t0 = time.time()
    while True:
        t = call('GET', path)
        st = t.get('status')
        if st in ('SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED'):
            break
        print(f'{kind} {name}: {st} {t.get("progress", 0)}% ({int(time.time() - t0)} s)', flush=True)
        time.sleep(10)
    files = []
    if st == 'SUCCEEDED':
        for label, u in urls(t.get('result', t)):
            if any(k in label.replace('.', '_') for k in SKIP):
                continue
            ext = os.path.splitext(u.split('?')[0])[1] or '.bin'
            if label.endswith(('thumbnail_url',)):
                ext = ext or '.png'
            fn = f'{name}__{label.replace(".", "_")}{ext}'
            try:
                urllib.request.urlretrieve(u, os.path.join(OUT, fn))
                files.append(fn)
            except Exception as e:  # un file mancante non ferma gli altri
                print('non scaricato', label, e)
    entry = {'name': name, 'kind': kind, 'id': t.get('id'), 'status': st, 'credits': t.get('consumed_credits'),
             'error': (t.get('task_error') or {}).get('message'), 'files': files, 'when': time.strftime('%Y-%m-%d %H:%M')}
    log(entry)
    print(json.dumps(entry, indent=1))
    return t


def opt(name, default=None):
    a = sys.argv
    return a[a.index(name) + 1] if name in a else default


def main():
    cmd = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    if cmd == 'balance':
        b = call('GET', '/v1/balance')
        print('crediti', b.get('balance'))
    elif cmd == 'rig':
        path, name = sys.argv[2], sys.argv[3]
        uri = 'data:application/octet-stream;base64,' + base64.b64encode(open(path, 'rb').read()).decode()
        r = call('POST', '/v1/rigging', {'model_url': uri, 'height_meters': float(opt('--height', 1.79))})
        wait('/v1/rigging/' + r['result'], 'rig', name)
    elif cmd == 'animate':
        rig, name = sys.argv[2], sys.argv[3]
        body = {'rig_task_id': rig}
        if opt('--motion'):
            body['motion_task_id'] = opt('--motion')
        else:
            ids = [int(x) for x in opt('--actions').split(',')]
            if len(ids) == 1:
                body['action_id'] = ids[0]
            else:
                body['action_ids'] = ids
        body['post_process'] = {'operation_type': 'change_fps', 'fps': 30}
        r = call('POST', '/v1/animations', body)
        wait('/v1/animations/' + r['result'], 'animate', name)
    elif cmd == 'motion':
        name, prompt = sys.argv[2], sys.argv[3]
        r = call('POST', '/v1/text-to-motion', {'prompt': prompt, 'duration': float(opt('--duration', 4)), 'mode': opt('--mode', 'prime')})
        wait('/v1/text-to-motion/' + r['result'], 'motion', name)
    elif cmd == 'text3d':
        name, prompt = sys.argv[2], sys.argv[3]
        body = {'mode': 'preview', 'prompt': prompt, 'ai_model': opt('--model', 'latest'), 'topology': 'triangle',
                'target_polycount': int(opt('--polys', 30000)), 'should_remesh': True}
        if opt('--pose'):
            body['pose_mode'] = opt('--pose')
        r = call('POST', '/v2/text-to-3d', body)
        pre = wait('/v2/text-to-3d/' + r['result'], 'text3d-preview', name + '_anteprima')
        if pre.get('status') != 'SUCCEEDED':
            return
        r = call('POST', '/v2/text-to-3d', {'mode': 'refine', 'preview_task_id': pre['id'], 'enable_pbr': True,
                                            'texture_resolution': opt('--texture', '4k')})
        wait('/v2/text-to-3d/' + r['result'], 'text3d-refine', name)
    print('crediti rimasti', call('GET', '/v1/balance').get('balance'))


main()
