#!/usr/bin/env python3
# 1) Copy real images into public/images_real/ so Vercel serves them at /images_real/...
# 2) Generate equipment-master.csv (all items) with img paths pointing to /images_real/...
import json, os, shutil, csv

ROOT = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER"
SRC = os.path.join(ROOT, "images_real")
PUB = os.path.join(ROOT, "public", "images_real")
os.makedirs(PUB, exist_ok=True)

# Copy image files (skip mapping.json)
copied = 0
for fn in os.listdir(SRC):
    if fn.lower() == "mapping.json":
        continue
    shutil.copy2(os.path.join(SRC, fn), os.path.join(PUB, fn))
    copied += 1
print("copied images:", copied)

# Load mapping
mapping = json.load(open(os.path.join(SRC, "mapping.json"), encoding="utf-8"))

items = json.load(open(os.path.join(ROOT, "equipment.json"), encoding="utf-8"))

def ports_to_text(ports):
    if not isinstance(ports, list) or not ports:
        return ""
    return "; ".join(f"{p.get('name','')}|{p.get('type','')}" for p in ports if isinstance(p, dict))

# CSV columns must match api/equipment-admin.js header
header = ["no", "name", "brand", "category", "img", "emoji", "has_settings",
          "inputs", "outputs", "func", "ports_raw"]

out_csv = os.path.join(ROOT, "equipment-master.csv")
with open(out_csv, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    w.writerow(header)
    for it in items:
        name = it.get("name", "")
        img_file = mapping.get(name, "")
        img_path = f"/images_real/{img_file}" if img_file else ""
        w.writerow([
            it.get("no", ""),
            name,
            it.get("brand", ""),
            it.get("cat", ""),
            img_path,
            it.get("emoji", "🔧"),
            "1" if it.get("hasSettings") else "0",
            ports_to_text(it.get("inputs", [])),
            ports_to_text(it.get("outputs", [])),
            it.get("func", ""),
            it.get("ports_raw", ""),
        ])
print("wrote equipment-master.csv with", len(items), "rows")
