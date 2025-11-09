# Rješavanje problema s GLTF/GLB modelima

## Problem 1: GLTF model traži eksterne fajlove

**Greška:**
```
Failed to load buffer "painted_wooden_cabinet.bin"
Failed to load texture "textures/painted_wooden_cabinet_diff_4k.jpg"
```

**Uzrok:**
`modelA.gltf` je GLTF format koji zahtijeva eksterne resurse (bin fajlove i teksture) koje trenutno nemaš.

**Rješenje 1: Dodaj sve potrebne fajlove**

Provjeri `modelA.gltf` fajl (otvori ga u text editoru) i potraži reference na druge fajlove:

```json
{
  "buffers": [
    {
      "uri": "painted_wooden_cabinet.bin"  ← Trebaš ovaj fajl
    }
  ],
  "images": [
    {
      "uri": "textures/painted_wooden_cabinet_diff_4k.jpg"  ← Trebaš ovaj fajl
    }
  ]
}
```

Svi referencirani fajlovi moraju biti u `public/models/` direktoriju:

```
public/models/
├── modelA.gltf
├── painted_wooden_cabinet.bin          ← Dodaj ovaj fajl
└── textures/                            ← Stvori ovaj direktorij
    ├── painted_wooden_cabinet_diff_4k.jpg
    ├── painted_wooden_cabinet_arm_4k.jpg
    └── painted_wooden_cabinet_nor_gl_4k.jpg
```

**Rješenje 2: Konvertuj u GLB format (PREPORUČENO)**

GLB format je bolji jer sve (model, teksture, animacije) je u jednom fajlu.

**Kako konvertovati:**

1. **Koristi Blender:**
   - Otvori model u Blenderu
   - File → Export → glTF 2.0
   - Odaberi "Binary (.glb)" format
   - Spremi kao `modelA.glb`

2. **Koristi online tool:**
   - https://products.aspose.app/3d/conversion/gltf-to-glb
   - Upload `modelA.gltf`
   - Download `modelA.glb`
   - Zamijeni `modelA.gltf` s `modelA.glb`

3. **Ažuriraj putanju u `page.tsx`:**
```typescript
const MODEL_URLS = {
  modelA: '/models/modelA.glb',  // Promijeni iz .gltf u .glb
  modelB: '/models/modelB.glb',
}
```

## Problem 2: modelB.glb je oštećen

**Greška:**
```
Unexpected end of JSON input
```

**Uzrok:**
`modelB.glb` fajl je oštećen ili nije validan GLB format.

**Rješenje:**

1. **Provjeri fajl:**
   - Provjeri da li je fajl kompletan (nije prekinut download)
   - Provjeri veličinu fajla (ako je 0 bytes, fajl je prazan)

2. **Testiraj fajl u online vieweru:**
   - https://gltf-viewer.donmccurdy.com/
   - Upload `modelB.glb`
   - Ako ne radi u vieweru, fajl je oštećen

3. **Preuzmi novi model:**
   - Ako je fajl oštećen, preuzmi ga ponovno
   - Ili koristi drugi model za testiranje

## Problem 3: Privremeno rješenje - koristi jednostavne modele

Dok ne popraviš GLTF/GLB modele, možeš koristiti jednostavne Three.js oblike:

1. **U `src/app/page.tsx`, promijeni:**
```typescript
const USE_SIMPLE_MODELS = true  // Postavi na true
```

2. **Aplikacija će koristiti:**
   - Plavu kocku umjesto `modelA`
   - Crvenu kuglu umjesto `modelB`

3. **Sve funkcionalnosti će raditi:**
   - Drag & drop ✅
   - Rotacija ✅
   - Collision detection ✅
   - Firestore spremanje ✅

## Automatsko fallback rješenje

Ako model ne može učitati, aplikacija će automatski koristiti jednostavni oblik kao fallback:

- `modelA` → Plava kocka (ako GLTF/GLB ne radi)
- `modelB` → Crvena kugla (ako GLB ne radi)

To znači da aplikacija neće crashati ako modeli ne rade - automatski će se prebaciti na jednostavne oblike.

## Preporuke

1. **Koristi GLB format** umjesto GLTF (lakše, sve u jednom fajlu)
2. **Kompresuj modele** prije korištenja (manji fajlovi = brže učitavanje)
3. **Testiraj modele** u online vieweru prije korištenja
4. **Koristi jednostavne modele** za testiranje funkcionalnosti dok ne popraviš GLTF/GLB

## Testiranje

1. Ako koristiš GLTF, provjeri da li postoje svi potrebni fajlovi
2. Ako koristiš GLB, provjeri da li je fajl validan u online vieweru
3. Ako ništa ne radi, koristi `USE_SIMPLE_MODELS = true` za testiranje

