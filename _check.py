import json, os, re
from collections import Counter
items = json.load(open('equipment.json', encoding='utf-8'))
print('equipment.json items:', len(items))
raw = open('images_real/mapping.json', encoding='utf-8').read()
keys = re.findall(r'"([^"]+)":', raw)
dups = [k for k, c in Counter(keys).items() if c > 1]
print('duplicate keys:', dups)
m = json.loads(raw)
print('mapping entries:', len(m))
print('mapping with image:', sum(1 for v in m.values() if v))
files = [f for f in os.listdir('images_real') if f != 'mapping.json']
print('actual image files:', len(files))
# how many equipment items have a mapping image
have = sum(1 for it in items if m.get(it['name']))
print('equipment items with image:', have)
