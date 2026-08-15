#!/usr/bin/env python3
# Generate canonical equipment.json from the Excel inventory.
# Parses ports into typed inputs/outputs and extracts brand.
import json, os, re
import openpyxl

XLSX = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER\Peralatan_Multimedia_Live_Streaming_FINAL.xlsx"
OUT = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER\equipment.json"

# Generic nouns that are NOT brands (first word of name)
NON_BRAND = {
    "Kamera", "Lensa", "Mikrofon", "Microphone", "Monitor", "Speaker", "Headphone",
    "Webcam", "Action", "Tripod", "Stand", "Kabel", "Kabel", "Adapter", "Adaptor",
    "Baterai", "Battery", "Charger", "Lampu", "Light", "Router", "Switch", "Hub",
    "Capture", "Card", "Recorder", "Encoder", "Software", "Komputer", "Laptop",
    "Drone", "Gimbal", "Filter", "Case", "Bag", "Tas", "Antena", "Antenna", "Panel",
    "Controller", "Mixer", "Console", "Switcher", "Teleprompter", "Green", "Backdrop",
    "Memory", "Storage", "SSD", "HDD", "SD", "Card", "Rig", "Mount", "Kit", "Set",
    "Aksesoris", "Accessories", "Konektor", "Connector", "Konverter", "Converter",
    "Power", "Supply", "PSU", "Dummy", "Cable", "Extension", "Splitter", "Booster",
    "Amplifier", "Amp", "Interface", "Box", "Frame", "Holder", "Clamp", "Bracket",
    "Mat", "Screen", "Display", "TV", "PC", "Mac", "Workstation", "Server", "Modem",
    "Repeater", "Extender", "Dock", "Hub", "Reader", "Writer", "Pen", "Stylus",
    "Remote", "Trigger", "Motor", "Slider", "Jib", "Crane", "Dolly", "Track",
}

def brand_of(name):
    parts = name.split()
    if not parts:
        return "Lainnya"
    first = parts[0]
    # If first word is a generic noun, try second word as brand
    if first in NON_BRAND and len(parts) > 1:
        return parts[1]
    return first

def map_type(tok):
    t = tok.lower()
    if "hdmi" in t: return "HDMI"
    if "sdi" in t or "3g" in t or "12g" in t or "6g" in t: return "SDI"
    if "xlr" in t or "audio" in t or "mic" in t or "jack" in t or "3.5" in t or "6.3" in t or "trs" in t or "rca" in t or "line" in t: return "Audio"
    if "lan" in t or "ethernet" in t or "rj45" in t or "po" in t and "e" in t or "ip" in t or "ndi" in t or "rtmp" in t or "network" in t: return "LAN"
    if "usb" in t or "type-c" in t or "type c" in t or "thunderbolt" in t: return "USB"
    if "wireless" in t or "wifi" in t or "wi-fi" in t or "bluetooth" in t or "rf" in t or "2.4" in t or "5.8" in t or "nirkabel" in t: return "Wireless"
    if "power" in t or "dc" in t or "ac" in t or "battery" in t or "listrik" in t or "plug" in t or "dcin" in t or "v-mount" in t or "np-" in t: return "Power"
    if "timecode" in t: return "SDI"
    if "mount" in t or "e-mount" in t or "ef-mount" in t or "mft" in t or "four thirds" in t: return "Power"  # lens mount, treat as power-less; fallback
    return None

def parse_ports(s):
    if not s:
        return [], []
    # Split on / , | and also common separators
    toks = re.split(r"[/|,;]+", s)
    inputs, outputs = [], []
    for tok in toks:
        tok = tok.strip()
        if not tok:
            continue
        # Determine direction: tokens with "in"/"out"/"keluar"/"masuk"
        low = tok.lower()
        direction = "both"
        if re.search(r"\b(in|masuk|input)\b", low) or low.endswith(" in") or "input" in low:
            direction = "in"
        elif re.search(r"\b(out|keluar|output)\b", low) or low.endswith(" out") or "output" in low:
            direction = "out"
        # Map type
        t = map_type(tok)
        if t is None:
            # unknown port, skip or generic
            continue
        label = tok
        if direction == "in" or direction == "both":
            inputs.append({"name": label + (" In" if direction == "both" else ""), "type": t})
        if direction == "out" or direction == "both":
            outputs.append({"name": label + (" Out" if direction == "both" else ""), "type": t})
    return inputs, outputs

def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Inventaris Streaming"]
    items = []
    seen = set()
    for row in ws.iter_rows(values_only=True):
        if not row or not row[0] or not str(row[0]).strip().isdigit():
            continue
        no = int(row[0])
        cat = (row[1] or "").strip()
        name = (row[2] or "").strip()
        ports = (row[3] or "").strip()
        func = (row[4] or "").strip()
        if not name:
            continue
        key = (cat, name)
        if key in seen:
            continue
        seen.add(key)
        brand = brand_of(name)
        inputs, outputs = parse_ports(ports)
        item = {
            "id": f"eq_{no}_{re.sub(r'[^a-z0-9]','',brand.lower())}_{len(items)}",
            "no": no,
            "name": name,
            "brand": brand,
            "cat": cat,
            "img": "",  # filled later from images_real/mapping.json
            "emoji": "🔧",
            "hasSettings": False,
            "inputs": inputs,
            "outputs": outputs,
            "func": func,
            "ports_raw": ports
        }
        items.append(item)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)
    print("wrote", len(items), "items to", OUT)

if __name__ == "__main__":
    main()
