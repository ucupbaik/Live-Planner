#!/usr/bin/env python3
# Download real, freely-licensed images from Wikimedia Commons for each equipment item.
# Uses generator=search + pageimages (lighter, avoids 429s), filters by brand relevance,
# with delays, 429 retry, and incremental resume support.
import json, os, re, time, sys
import requests
import openpyxl

XLSX = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER\Peralatan_Multimedia_Live_Streaming_FINAL.xlsx"
OUT = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER\images_real"
MAP = os.path.join(OUT, "mapping.json")
os.makedirs(OUT, exist_ok=True)

S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0 (EventBroadcastPlanner/1.0; ucupbaik)"})

def clean(name):
    n = re.sub(r"\(.*?\)", "", name)
    return n.strip()

def brand_of(name):
    parts = name.split()
    NON = {"Kamera","Lensa","Mikrofon","Monitor","Speaker","Headphone","Webcam","Action",
           "Tripod","Stand","Kabel","Adapter","Baterai","Charger","Lampu","Router","Switch",
           "Hub","Capture","Card","Recorder","Encoder","Software","Komputer","Laptop","Drone",
           "Gimbal","Filter","Case","Bag","Tas","Antena","Panel","Controller","Mixer","Console",
           "Switcher","Teleprompter","Memory","Storage","Rig","Mount","Kit","Set","Aksesoris",
           "Konektor","Konverter","Power","Supply","Dummy","Cable","Extension","Splitter","Box",
           "Frame","Holder","Clamp","Bracket","Mat","Screen","Display","SD","Card","PC","Mac",
           "Workstation","Server","Modem","Repeater","Extender","Dock","Reader","Writer","Pen",
           "Remote","Trigger","Motor","Slider","Jib","Crane","Dolly","Track","Light","Green",
           "Backdrop","Battery","Interface","Amplifier","Amp","Antenna","Accessories","Converter"}
    if not parts:
        return ""
    if parts[0] in NON and len(parts) > 1:
        return parts[1]
    return parts[0]

def find_image(name, brand):
    q = clean(name)
    for attempt in range(4):
        try:
            r = S.get("https://commons.wikimedia.org/w/api.php", params={
                "action": "query", "format": "json",
                "generator": "search", "gsrsearch": q, "gsrnamespace": "6",
                "gsrlimit": "8", "prop": "pageimages", "piprop": "thumbnail",
                "pithumbsize": "320"
            }, timeout=25)
            if r.status_code == 429:
                time.sleep(8 + attempt * 5)
                continue
            if r.status_code != 200:
                time.sleep(3)
                continue
            data = r.json()
            pages = data.get("query", {}).get("pages", {})
            brand_l = brand.lower()
            best = None
            for p in pages.values():
                title = p.get("title", "")
                thumb = (p.get("thumbnail") or {}).get("source")
                if not thumb:
                    continue
                tl = title.lower()
                # relevance: brand appears in title, or exact model words
                score = 0
                if brand_l and brand_l in tl:
                    score += 2
                # model number-ish words from name
                words = re.findall(r"[A-Za-z0-9]+", q.lower())
                for w in words:
                    if len(w) >= 3 and w in tl:
                        score += 1
                if score > 0 and (best is None or score > best[0]):
                    best = (score, thumb)
            if best:
                return best[1]
            return None
        except Exception:
            time.sleep(5)
    return None

def download(url, idx):
    ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
    if ext.lower() == ".svg":
        ext = ".png"
    local = f"real_{idx:04d}{ext}"
    path = os.path.join(OUT, local)
    for attempt in range(3):
        try:
            ir = S.get(url, timeout=30)
            if ir.status_code == 200 and len(ir.content) > 500:
                with open(path, "wb") as f:
                    f.write(ir.content)
                return local
            if ir.status_code == 429:
                time.sleep(8)
                continue
        except Exception:
            time.sleep(3)
    return ""

def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Inventaris Streaming"]
    items = []
    seen = set()
    for row in ws.iter_rows(values_only=True):
        if not row or not row[0] or not str(row[0]).strip().isdigit():
            continue
        name = (row[2] or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        items.append((name, brand_of(name)))

    # resume support
    mapping = {}
    if os.path.exists(MAP):
        mapping = json.load(open(MAP, encoding="utf-8"))
    todo = [(i, n, b) for i, (n, b) in enumerate(items) if n not in mapping]
    print(f"total {len(items)}, already done {len(mapping)}, todo {len(todo)}")

    for i, name, brand in todo:
        url = find_image(name, brand)
        local = ""
        if url:
            local = download(url, i)
        mapping[name] = local
        # save progress incrementally
        json.dump(mapping, open(MAP, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        time.sleep(1.5)  # be polite to avoid 429
        if (len(mapping) % 25) == 0:
            ok = sum(1 for v in mapping.values() if v)
            print(f"progress {len(mapping)}/{len(items)} ok={ok}")

    ok = sum(1 for v in mapping.values() if v)
    print(f"DONE. images downloaded: {ok}/{len(mapping)}")

if __name__ == "__main__":
    main()
