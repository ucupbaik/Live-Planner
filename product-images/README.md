# Folder Gambar Produk Transparan

Letakkan file gambar **transparan (PNG dengan latar belakang transparan)** di folder ini.
Penamaan mengikuti **nama alat persis** dari Excel (tanpa ekstensi), contoh:

```
Sony Alpha a7S III.png
Sony FX3.png
Blackmagic ATEM Mini Pro.png
```

Aplikasi akan otomatis menarik gambar ini berdasarkan nama alat (`item.name`).
Gambar yang tidak ditemukan akan menggunakan fallback **Font Awesome** sesuai kategori.

## Cara kerja
- Saat build (`gen_equipment_data.py`), skrip memeriksa folder ini dan memasangkan
  gambar ke alat yang namanya cocok (case-insensitive, spasi diabaikan).
- Format yang didukung: `.png` (transparan), `.webp`, `.svg`, `.jpg`.
- Setelah menambah gambar, jalankan kembali generator lalu commit & push.

## Tips
- Gunakan PNG transparan (bukan JPG) agar latar belakang kanvas tetap rapi.
- Resolusi disarankan 300–600 px lebar.
- Nama file HARUS sama dengan kolom nama alat di Excel agar terdeteksi otomatis.
