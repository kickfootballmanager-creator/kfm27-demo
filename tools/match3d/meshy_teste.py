"""Serie di teste con Meshy (blocco F): per ogni voce di
source/meshy/teste.json con una descrizione e senza GLB gia' scaricato,
text-to-3d (anteprima + rifinitura 4K) con un prompt generico: persone
inventate, nessun volto reale, nessun marchio. Gira PARALLEL compiti insieme.

  python tools/match3d/meshy_teste.py [--parallel 4] [--max-credits 600]
"""
import json, os, subprocess, sys, threading

HERE = os.path.dirname(os.path.abspath(__file__))
MESHY = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'src', 'assets', 'match3d', 'source', 'meshy')
PROMPT = ('Realistic 3D head and neck bust of a young adult male soccer player, {desc}, neutral relaxed '
          'expression, mouth closed with lips together, eyes open looking forward, facing front, '
          'no accessories, no earrings, no text, no logos, game character head')
args = sys.argv[1:]
PAR = int(args[args.index('--parallel') + 1]) if '--parallel' in args else 4
MAXC = int(args[args.index('--max-credits') + 1]) if '--max-credits' in args else 600
todo = [e for e in json.load(open(os.path.join(MESHY, 'teste.json'), encoding='utf-8'))
        if e.get('desc') and not os.path.exists(os.path.join(MESHY, e['name'] + '__model_urls_glb.glb'))]
if len(todo) * 30 > MAXC:
    sys.exit(f'{len(todo)} teste = circa {len(todo) * 30} crediti, oltre {MAXC}')
print(len(todo), 'teste da fare, circa', len(todo) * 30, 'crediti', flush=True)
lock = threading.Lock()


def work():
    while True:
        with lock:
            if not todo:
                return
            e = todo.pop(0)
        r = subprocess.run([sys.executable, os.path.join(HERE, 'meshy.py'), 'text3d', e['name'], PROMPT.format(desc=e['desc']),
                            '--texture', '4k', '--polys', '20000'], capture_output=True, text=True)
        tail = [l for l in r.stdout.splitlines() if 'status' in l or 'credits' in l or 'rimasti' in l or 'HTTP' in l]
        print(e['name'], ' | '.join(x.strip() for x in tail[-4:]), flush=True)


threads = [threading.Thread(target=work) for _ in range(PAR)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print('fatto', flush=True)
