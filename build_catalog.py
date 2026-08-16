# -*- coding: utf-8 -*-
"""Build a unified equipment.json from:
   1) Peralatan_Multimedia_Live_Streaming_FINAL.xlsx (existing)
   2) list alat/mic-catalog/data/all.json (dynamic + condenser mics)
   3) Curated PC / Studio / Recording / Software parts (comprehensive, real brands)
All items grouped by category. Output: equipment.json (canonical) + equipment-data.js (window.__deviceDB).
"""
import json, os, re

ROOT = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER"
items = []
_counter = [0]

def norm_type(tok):
    t = str(tok).lower()
    if "hdmi" in t or "displayport" in t or "dp " in t or "dvi" in t or "vga" in t: return "HDMI"
    if "sdi" in t or "3g" in t or "12g" in t or "6g" in t or "timecode" in t: return "SDI"
    if any(k in t for k in ["xlr","audio","mic","jack","3.5","6.3","trs","rca","line","phantom","spdif","aes"]): return "Audio"
    if any(k in t for k in ["lan","ethernet","rj45","po","ip","ndi","rtmp","network","wifi","wireless","bluetooth","rf","2.4","5.8","nirkabel"]): return "Wireless" if ("wifi" in t or "wireless" in t or "bluetooth" in t or "rf" in t or "2.4" in t or "5.8" in t or "nirkabel" in t) else "LAN"
    if any(k in t for k in ["usb","type-c","type c","thunderbolt"]): return "USB"
    if any(k in t for k in ["power","dc","ac","battery","listrik","plug","dcin","v-mount","np-","atx","eps","fan","pwm","phantom"]): return "Power"
    return "Other"

def add(name, brand, cat, ports_in=(), ports_out=(), func='', img='', has_settings=False, emoji='🔧'):
    _counter[0] += 1
    items.append({
        "id": f"eq_{_counter[0]}_{(brand or 'x').lower().replace(' ', '_')[:6]}_{_counter[0]}",
        "no": _counter[0],
        "name": name, "brand": brand, "cat": cat, "img": img, "emoji": emoji,
        "hasSettings": has_settings,
        "inputs": [{"name": p, "type": norm_type(p)} for p in ports_in],
        "outputs": [{"name": p, "type": norm_type(p)} for p in ports_out],
        "func": func, "ports_raw": ", ".join(list(ports_in) + list(ports_out))
    })

# ---------- 1) EXCEL ----------
NON_BRAND = {"Kamera","Lensa","Mikrofon","Microphone","Monitor","Speaker","Headphone","Webcam","Action",
    "Tripod","Stand","Kabel","Adapter","Adaptor","Baterai","Battery","Charger","Lampu","Light","Router",
    "Switch","Hub","Capture","Card","Recorder","Encoder","Software","Komputer","Laptop","Drone","Gimbal",
    "Filter","Case","Bag","Tas","Antena","Antenna","Panel","Controller","Mixer","Console","Switcher",
    "Teleprompter","Green","Backdrop","Memory","Storage","SSD","HDD","SD","Rig","Mount","Kit","Set",
    "Aksesoris","Accessories","Konektor","Connector","Konverter","Converter","Power","Supply","PSU","Dummy",
    "Cable","Extension","Splitter","Booster","Amplifier","Amp","Interface","Box","Frame","Holder","Clamp",
    "Bracket","Mat","Screen","Display","TV","PC","Mac","Workstation","Server","Modem","Repeater","Extender",
    "Dock","Reader","Writer","Pen","Stylus","Remote","Trigger","Motor","Slider","Jib","Crane","Dolly","Track"}
def brand_of(name):
    parts = name.split()
    if not parts: return "Lainnya"
    if parts[0] in NON_BRAND and len(parts) > 1: return parts[1]
    return parts[0]
def splitp(v):
    if not v: return []
    return [x.strip() for x in re.split(r"[/|,;]+", str(v)) if x.strip()]

xlsx = os.path.join(ROOT, "Peralatan_Multimedia_Live_Streaming_FINAL.xlsx")
if os.path.exists(xlsx):
    try:
        import openpyxl
        wb = openpyxl.load_workbook(xlsx, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        # header at row index 3: No, Kategori, Merek & Tipe, Port / Konektor, Fungsi & Konfigurasi Detail
        for r in rows[4:]:
            if not r or not r[2]: continue
            name = str(r[2]).strip()
            cat = str(r[1]).strip() if r[1] else "Lainnya"
            brand = brand_of(name)
            ports = splitp(r[3] if len(r) > 3 else '')
            func = str(r[4]).strip() if len(r) > 4 and r[4] else ''
            add(name, brand, cat, ports, [], func)
    except Exception as e:
        print("Excel load error:", e)

# ---------- 2) MIC CATALOGS ----------
mic_path = os.path.join(ROOT, "list alat", "mic-catalog", "data", "all.json")
if os.path.exists(mic_path):
    mics = json.load(open(mic_path, encoding="utf-8"))
    for brand_obj in mics:
        brand = brand_obj.get("brand", "Lainnya").split(" (")[0].strip()
        for m in brand_obj.get("models", []):
            cat = "Mikrofon " + ("Kondenser" if m.get("category") == "condenser" else "Dinamis")
            port = m.get("port", "XLR")
            # mic: output XLR/USB, input = phantom power for condenser
            outs = [port]
            ins = ["Phantom 48V"] if m.get("category") == "condenser" else []
            add(m.get("model", "?"), brand, cat, ins, outs, m.get("usage", ""), has_settings=False)

# ---------- 3) CURATED PC PARTS ----------
PC = [
  # CPU
  ("CPU", "Intel", [("Core i9-14900K","24-core (8P+16E), 6.0GHz, LGA1700, 125W","LGA1700","—"),
                    ("Core i7-14700K","20-core, 5.6GHz, LGA1700, 125W","LGA1700","—"),
                    ("Core i5-14600K","14-core, 5.3GHz, LGA1700, 125W","LGA1700","—"),
                    ("Core i9-13900K","24-core, 5.8GHz, LGA1700, 125W","LGA1700","—"),
                    ("Core i5-13400F","10-core, 4.6GHz, LGA1700, 65W","LGA1700","—")]),
  ("CPU", "AMD", [("Ryzen 9 7950X","16-core, 5.7GHz, AM5, 170W","AM5","—"),
                   ("Ryzen 9 7900X","12-core, 5.6GHz, AM5, 170W","AM5","—"),
                   ("Ryzen 7 7800X3D","8-core, 5.0GHz, AM5, 120W (gaming)","AM5","—"),
                   ("Ryzen 7 7700X","8-core, 5.4GHz, AM5, 105W","AM5","—"),
                   ("Ryzen 5 7600X","6-core, 5.3GHz, AM5, 105W","AM5","—"),
                   ("Ryzen Threadripper 7970X","32-core, sTR5, 350W","sTR5","—")]),
  # GPU
  ("GPU", "NVIDIA", [("GeForce RTX 4090","24GB GDDR6X, HDMI 2.1, 3x DP 1.4a, 450W","PCIe 4.0","HDMI, DisplayPort"),
                     ("GeForce RTX 4080 Super","16GB GDDR6X, 320W","PCIe 4.0","HDMI, DisplayPort"),
                     ("GeForce RTX 4070 Ti","12GB GDDR6X, 285W","PCIe 4.0","HDMI, DisplayPort"),
                     ("GeForce RTX 4060","8GB GDDR6, 115W","PCIe 4.0","HDMI, DisplayPort"),
                     ("NVIDIA RTX A4000","16GB GDDR6, workstation, 140W","PCIe 4.0","4x DisplayPort"),
                     ("NVIDIA Quadro RTX 4000","8GB GDDR6, 125W","PCIe 3.0","3x DisplayPort, 1x USB-C")]),
  ("GPU", "AMD", [("Radeon RX 7900 XTX","24GB GDDR6, 355W","PCIe 4.0","HDMI, 2x DisplayPort, USB-C"),
                  ("Radeon RX 7800 XT","16GB GDDR6, 263W","PCIe 4.0","HDMI, 2x DisplayPort"),
                  ("Radeon RX 7600","8GB GDDR6, 165W","PCIe 4.0","HDMI, DisplayPort")]),
  ("GPU", "ASUS", [("ROG Strix GeForce RTX 4090 OC","24GB, factory OC, triple-fan","PCIe 4.0","HDMI, DisplayPort")]),
  ("GPU", "MSI", [("Suprim X RTX 4090","24GB, factory OC","PCIe 4.0","HDMI, DisplayPort"),
                  ("Gaming X Trio RTX 4070","12GB","PCIe 4.0","HDMI, DisplayPort")]),
  ("GPU", "Gigabyte", [("AORUS RTX 4090 Master","24GB, LCD edge","PCIe 4.0","HDMI, DisplayPort")]),
  # Motherboard
  ("Motherboard", "ASUS", [("ROG Maximus Z790 Hero","LGA1700, DDR5, PCIe 5.0, WiFi 7","LGA1700","DDR5, PCIe, SATA, USB, LAN, HDMI"),
                           ("TUF Gaming B650-Plus","AM5, DDR5, WiFi","AM5","DDR5, PCIe, SATA, USB, LAN"),
                           ("ProArt X670E-Creator","AM5, creator, 10G LAN","AM5","DDR5, PCIe, 10G LAN, USB4")]),
  ("Motherboard", "MSI", [("MEG Z790 Godlike","LGA1700, E-ATX, DDR5","LGA1700","DDR5, PCIe, 10G LAN, USB"),
                          ("MAG B650 Tomahawk","AM5, DDR5, WiFi 6E","AM5","DDR5, PCIe, SATA, LAN")]),
  ("Motherboard", "Gigabyte", [("Z790 AORUS Master","LGA1700, DDR5, PCIe 5.0","LGA1700","DDR5, PCIe, 2.5G LAN, USB"),
                              ("X670E AORUS Master","AM5, DDR5","AM5","DDR5, PCIe, 10G LAN")]),
  ("Motherboard", "ASRock", [("Z790 Taichi","LGA1700, DDR5, PCIe 5.0","LGA1700","DDR5, PCIe, LAN, USB")]),
  # RAM
  ("RAM", "Corsair", [("Vengeance DDR5 32GB 6000MHz","2x16GB, CL36","DDR5","—"),
                      ("Dominator Titanium 64GB 6600MHz","2x32GB, RGB","DDR5","—")]),
  ("RAM", "G.Skill", [("Trident Z5 RGB 32GB 6400MHz","2x16GB, DDR5","DDR5","—"),
                      ("Flare X5 32GB 6000MHz","2x16GB, AMD EXPO","DDR5","—")]),
  ("RAM", "Kingston", [("Fury Beast DDR5 32GB 5600MHz","2x16GB","DDR5","—")]),
  ("RAM", "Crucial", [("Pro DDR5 32GB 5600MHz","2x16GB","DDR5","—")]),
  # Storage
  ("Storage", "Samsung", [("990 Pro 2TB NVMe","PCIe 4.0, 7450MB/s","M.2 NVMe","—"),
                          ("870 EVO 1TB SATA","SATA III, 560MB/s","SATA","—")]),
  ("Storage", "Western Digital", [("WD Black SN850X 2TB","PCIe 4.0 NVMe","M.2 NVMe","—"),
                                  ("WD Blue 2TB SATA","SATA III","SATA","—")]),
  ("Storage", "Crucial", [("T700 2TB Gen5","PCIe 5.0, 12400MB/s","M.2 NVMe","—")]),
  ("Storage", "Seagate", [("BarraCuda 4TB HDD","SATA, 5400rpm","SATA","—")]),
  # PSU
  ("PSU", "Corsair", [("RM1000x 1000W","80+ Gold, fully modular","—","ATX 24-pin, EPS, PCIe, SATA"),
                      ("HX1500i 1500W","80+ Platinum, iCUE","—","ATX, EPS, PCIe, SATA")]),
  ("PSU", "Seasonic", [("PRIME TX-1000 1000W","80+ Titanium","—","ATX, EPS, PCIe, SATA")]),
  ("PSU", "be quiet!", [("Dark Power 13 1000W","80+ Titanium","—","ATX, EPS, PCIe, SATA")]),
  # Case
  ("Case", "Lian Li", [("O11 Dynamic EVO","Mid-tower, tempered glass","—","USB-C, USB 3.0"),
                       ("Lancool III","Full-tower, mesh","—","USB-C, USB 3.0")]),
  ("Case", "Corsair", [("5000D Airflow","Mid-tower, high airflow","—","USB-C, USB 3.0"),
                       ("7000D Airflow","Full-tower","—","USB-C, USB 3.0")]),
  ("Case", "NZXT", [("H7 Flow","Mid-tower, airflow","—","USB 3.2, USB-C"),
                    ("H9 Flow","Dual-chamber","—","USB 3.2, USB-C")]),
  ("Case", "Fractal Design", [("Meshify 2","Mid/full, mesh","—","USB-C, USB 3.0")]),
  # Cooler
  ("Cooler", "Noctua", [("NH-D15 chromax.black","Dual-tower air, 165mm","—","Fan PWM"),
                        ("NH-U12S","Single-tower air","—","Fan PWM")]),
  ("Cooler", "Corsair", [("iCUE H150i Elite LCD","360mm AIO liquid","—","USB, Fan PWM"),
                         ("iCUE H100i","240mm AIO liquid","—","USB, Fan PWM")]),
  ("Cooler", "NZXT", [("Kraken 360","360mm AIO, LCD","—","USB, Fan PWM"),
                      ("Kraken 240","240mm AIO","—","Fan PWM")]),
  ("Cooler", "Arctic", [("Liquid Freezer III 360","360mm AIO","—","Fan PWM")]),
  ("Cooler", "be quiet!", [("Dark Rock Pro 4","Dual-tower air","—","Fan PWM")]),
]
for cat, brand, models in PC:
    for (name, spec, pin, pout) in models:
        ins = [pin] if pin and pin != "—" else []
        outs = [pout] if pout and pout != "—" else []
        add(name, brand, cat, ins, outs, spec, has_settings=(cat in ("CPU","GPU","Motherboard")))

# ---------- 4) STUDIO / RECORDING / SOFTWARE (curated, real) ----------
STUDIO = [
  ("Studio Lighting", "Aputure", [("LS 600d Pro","600W COB LED, Bowens mount","AC","—"),
                                 ("Light Storm 300d II","300W daylight LED","AC","—"),
                                 ("MC RGB Mini","2.5W pocket RGB","USB-C","—")]),
  ("Studio Lighting", "Godox", [("SL-60W","60W LED video light","AC","—"),
                               ("VL150","150W LED","AC","—")]),
  ("Studio Lighting", "Elgato", [("Key Light Air","1400 lumens, app control","AC","—"),
                                ("Ring Light 12\"","LED ring","AC","—")]),
  ("Green Screen", "Elgato", [("Collapsible Green Screen","chromakey, pull-up","—","—")]),
  ("Green Screen", "Fotodiox", [("Pro Collapsible Chromakey","5x7ft green/blue","—","—")]),
  ("Tripod & Stand", "Manfrotto", [("MVH502AH Fluid Head","video fluid head","—","—"),
                                  ("Aluminum Tripod 190","photo/video tripod","—","—")]),
  ("Tripod & Stand", "Elgato", [("Multi Mount","desk mount arm","—","—")]),
  ("Teleprompter", "Elgato", [("Prompter","10\" display, app-driven","HDMI","USB-C")]),
  ("Acoustic Treatment", "Auralex", [("Studiofoam 2\"","acoustic panel 2x2ft","—","—")]),
  ("Monitor Speaker", "Yamaha", [("HS8","8\" powered studio monitor, 120W","XLR, TRS","—"),
                                ("HS5","5\" powered monitor, 70W","XLR, TRS","—")]),
  ("Monitor Speaker", "KRK", [("Rokit 8 G4","8\" studio monitor","XLR, TRS","—")]),
  ("Audio Interface", "Focusrite", [("Scarlett 2i2 4th Gen","2in/2out, 192kHz, USB-C","XLR, TRS, USB-C","USB-C, TRS"),
                                   ("Scarlett 18i20","18in/20out","XLR, TRS, ADAT","USB-C")]),
  ("Audio Interface", "Universal Audio", [("Volt 276","2in/2out, Vintage preamp","XLR, TRS, USB-C","USB-C")]),
  ("Audio Interface", "Behringer", [("U-Phoria UMC404HD","4in/4out","XLR, TRS, USB","USB")]),
  ("Mixer Audio", "Yamaha", [("MG10XU","10-ch, USB, FX","XLR, TRS, USB","XLR, TRS, USB"),
                            ("TF1","32-ch digital","XLR, TRS","XLR, TRS")]),
  ("Mixer Audio", "Allen & Heath", [("QU-16","16-ch digital mixer","XLR, TRS, USB","XLR, TRS, USB")]),
  ("Mixer Audio", "Behringer", [("X32","32-ch digital, 40-bit DSP","XLR, TRS, AES","XLR, TRS, AES, USB")]),
  ("Capture Card", "Elgato", [("Cam Link 4K","HDMI->USB 4K60","HDMI","USB 3.0"),
                             ("HD60 X","1080p60 capture","HDMI","USB 3.0"),
                             ("4K60 Pro MK.2","internal PCIe capture","HDMI","PCIe")]),
  ("Capture Card", "Blackmagic", [("DeckLink 4K Pro","PCIe capture/playback","SDI, HDMI","SDI, HDMI, PCIe"),
                                 ("ATEM Mini Pro","4-input HDMI switcher+stream","HDMI x4, USB-C","USB-C, HDMI")]),
  ("Video Switcher", "Blackmagic", [("ATEM Television Studio HD8","8-input 3G-SDI/HDMI","SDI, HDMI","SDI, HDMI, Ethernet"),
                                   ("ATEM 1 M/E Constellation","40-input 4K","SDI, HDMI","SDI, HDMI")]),
  ("Video Switcher", "Roland", [("VR-4HD","4-channel AV mixer","HDMI x4","HDMI, USB")]),
  ("PTZ Camera", "PTZOptics", [("30X SDI Gen2","30x zoom, 3G-SDI/HDMI","SDI, HDMI, LAN","SDI, HDMI, LAN, USB")]),
  ("PTZ Camera", "Sony", [("SRG-X120","12x zoom PTZ","HDMI, SDI, USB, LAN","HDMI, SDI, USB, LAN")]),
  ("Webcam", "Logitech", [("Brio 4K","4K UHD webcam","USB-C","USB-C"),
                         ("StreamCam","1080p60","USB-C","USB-C")]),
  ("Webcam", "Elgato", [("Facecam Pro","4K60 webcam","USB-C","USB-C")]),
  ("Stream Deck", "Elgato", [("Stream Deck MK.2","15 LCD keys","USB-C","USB-C"),
                            ("Stream Deck XL","32 keys","USB-C","USB-C")]),
  ("Recorder", "Zoom", [("H6essential","6-track portable recorder","XLR, TRS","SD, USB"),
                       ("F3","32-bit float field recorder","XLR, TRS","SD, USB")]),
  ("Recorder", "Tascam", [("DR-40X","4-track handheld","XLR, TRS","SD, USB")]),
  ("Monitor Display", "LG", [("UltraFine 27UN880","27\" 4K IPS","HDMI, DP, USB-C","—"),
                            ("27GP950","27\" 4K 144Hz","HDMI, DP","—")]),
  ("Monitor Display", "Dell", [("U2723QE","27\" 4K USB-C hub","HDMI, DP, USB-C","—")]),
  ("Headphones", "Audio-Technica", [("ATH-M50x","studio headphones","TRS, mini","—")]),
  ("Headphones", "Sony", [("MDR-7506","studio monitor headphones","TRS","—")]),
  ("Headphones", "Beyerdynamic", [("DT 770 Pro","studio headphones","TRS","—")]),
  ("Software", "vMix", [("vMix Pro","live production software, 4K, multi-cam","—","—")]),
  ("Software", "OBS Studio", [("OBS Studio","open-source streaming/recording","—","—")]),
  ("Software", "Wirecast", [("Wirecast Pro","live streaming production","—","—")]),
  ("Software", "Streamlabs", [("Streamlabs Desktop","streaming suite","—","—")]),
  ("Software", "DaVinci Resolve", [("DaVinci Resolve 18","editing/color/grading","—","—")]),
  ("Software", "Adobe", [("Premiere Pro","video editing","—","—"),
                        ("After Effects","motion graphics","—","—")]),
]
for cat, brand, models in STUDIO:
    for (name, spec, pin, pout) in models:
        ins = [x.strip() for x in pin.split(",")] if pin and pin != "—" else []
        outs = [x.strip() for x in pout.split(",")] if pout and pout != "—" else []
        add(name, brand, cat, ins, outs, spec, has_settings=(cat in ("Software","Audio Interface","Mixer Audio","Video Switcher","Capture Card")))

# ---------- WRITE ----------
with open(os.path.join(ROOT, "equipment.json"), "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=1)

# Build deviceDB grouped by category
db = {}
for it in items:
    cat = it["cat"] or "Lainnya"
    key = "cat_" + re.sub(r'[\s/&]', '_', cat.lower())
    if key not in db: db[key] = {"title": cat, "items": []}
    db[key]["items"].append({
        "id": it["id"], "name": it["name"], "brand": it["brand"], "img": it["img"],
        "emoji": it.get("emoji", "🔧"), "hasSettings": bool(it.get("hasSettings")),
        "inputs": it["inputs"], "outputs": it["outputs"], "func": it.get("func", "")
    })

out = "// Generated unified catalog: Excel + mic catalogs + curated PC/Studio/Recording/Software\n"
out += "window.__deviceDB = " + json.dumps(db, ensure_ascii=False, indent=1) + ";\n"
with open(os.path.join(ROOT, "equipment-data.js"), "w", encoding="utf-8") as f:
    f.write(out)

print("Total items:", len(items))
cats = {}
for it in items: cats[it["cat"]] = cats.get(it["cat"], 0) + 1
print("Categories:", len(cats))
for c, n in sorted(cats.items(), key=lambda x: -x[1]): print(f"  {c}: {n}")
