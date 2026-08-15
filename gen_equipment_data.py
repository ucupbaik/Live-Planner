#!/usr/bin/env python3
# Regenerate equipment-data.js from equipment.json + images_real/mapping.json.
# Exposes window.__deviceDB (so the HTML's `let deviceDB` won't conflict).
import json, os

ROOT = r"c:\Users\yusuf\Downloads\EVENT BROADCAST PLANNER"
items = json.load(open(os.path.join(ROOT, "equipment.json"), encoding="utf-8"))
mapping = {}
mp = os.path.join(ROOT, "images_real", "mapping.json")
if os.path.exists(mp):
    mapping = json.load(open(mp, encoding="utf-8"))

# Transparent product images: match by exact name (case/spacing insensitive).
prod_dir = os.path.join(ROOT, "product-images")
prod_map = {}
if os.path.isdir(prod_dir):
    for fn in os.listdir(prod_dir):
        if fn.lower() == "readme.md":
            continue
        base, ext = os.path.splitext(fn)
        if ext.lower() in (".png", ".webp", ".svg", ".jpg", ".jpeg"):
            prod_map[base.strip().lower()] = "product-images/" + fn

def find_img(name):
    # 1) transparent product image by name, 2) wikimedia real image
    key = (name or "").strip().lower()
    if key in prod_map:
        return prod_map[key]
    w = mapping.get(name, "")
    return ("images_real/" + w) if w else ""

# Build deviceDB grouped by category (each category holds all its items;
# renderCatalog() further groups items by brand inside each category).
db = {}
for it in items:
    cat = it["cat"] or "Lainnya"
    key = "cat_" + cat.lower().replace(" ", "_").replace("/", "_").replace("&", "and")
    if key not in db:
        db[key] = {"title": cat, "items": []}
    db[key]["items"].append({
        "id": it["id"], "name": it["name"], "brand": it["brand"],
        "img": find_img(it["name"]), "emoji": it.get("emoji", "🔧"),
        "hasSettings": bool(it.get("hasSettings")),
        "inputs": it["inputs"], "outputs": it["outputs"], "func": it.get("func", "")
    })

out = "// Generated from Peralatan_Multimedia_Live_Streaming_FINAL.xlsx + Wikimedia Commons + product-images/\n"
out += "window.__deviceDB = " + json.dumps(db, ensure_ascii=False, indent=1) + ";\n"
with open(os.path.join(ROOT, "equipment-data.js"), "w", encoding="utf-8") as f:
    f.write(out)
n_real = sum(1 for v in mapping.values() if v)
n_prod = sum(1 for it in items if find_img(it["name"]).startswith("product-images/"))
print("wrote equipment-data.js with", len(items), "items,", n_real, "wikimedia +", n_prod, "product-images")
