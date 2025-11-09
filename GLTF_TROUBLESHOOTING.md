# Rješavanje problema s GLTF/GLB modelima

## Problem: Model se ne učitava

### 1. Provjeri da li je `USE_SIMPLE_MODELS = false`

U `src/app/page.tsx`:
```typescript
const USE_SIMPLE_MODELS = false // Mora biti false da bi se učitavali GLTF/GLB modeli
```

### 2. Provjeri putanju modela

U `src/app/page.tsx`, provjeri da li se putanja podudara s imenom fajla:
```typescript
const MODEL_URLS = {
  modelA: '/models/modelA.gltf', // Provjeri da li fajl stvarno postoji
  modelB: '/models/modelB.glb',
}
```

**VAŽNO:** 
- Fajlovi moraju biti u `public/models/` direktoriju
- Putanje počinju s `/` (npr. `/models/modelA.gltf`)
- Next.js automatski servira fajlove iz `public/` direktorija

### 3. GLTF vs GLB format

**GLTF format:**
- `.gltf` fajl je JSON format
- Često zahtijeva eksterne resurse:
  - `.bin` fajlovi (binarni podaci)
  - Teksture (`.jpg`, `.png`, itd.)
- Svi fajlovi moraju biti u istom direktoriju

**GLB format:**
- `.glb` fajl je binarni format
- Sve je u jednom fajlu (model, teksture, animacije)
- Preporučeno za web aplikacije

### 4. Provjeri GLTF fajl strukturu

Ako koristiš `.gltf` fajl, provjeri da li postoje svi potrebni resursi:

```
public/models/
  ├── modelA.gltf          ← glavni fajl
  ├── modelA.bin           ← binarni podaci (ako postoji)
  ├── texture.jpg          ← teksture (ako postoje)
  └── ...
```

**Problem:** Ako `.gltf` fajl referencira eksterne resurse, svi moraju biti prisutni i u istom direktoriju.

### 5. Provjeri konzolu za greške

Otvori browser Developer Tools (F12) → Console i provjeri:
- ❌ 404 greške (fajl nije pronađen)
- ❌ CORS greške
- ❌ Parsing greške (nevaljani format)
- ✅ Poruke o uspješnom učitavanju

### 6. Testiraj model u online vieweru

Provjeri da li je tvoj model validan:
- https://gltf-viewer.donmccurdy.com/
- https://sandbox.babylonjs.com/

Ako model ne radi u vieweru, problem je u modelu, ne u kodu.

## Rješenja

### Rješenje 1: Koristi GLB format umjesto GLTF

GLB je bolji izbor za web aplikacije jer:
- Sve je u jednom fajlu
- Nema problema s eksternim resursima
- Brže se učitava

**Kako konvertirati GLTF u GLB:**
- Koristi Blender: File → Export → glTF 2.0 → Binary (.glb)
- Ili online tool: https://products.aspose.app/3d/conversion/gltf-to-glb

### Rješenje 2: Provjeri da li su svi resursi prisutni

Ako koristiš `.gltf` fajl, provjeri `.gltf` fajl (otvori ga u text editoru) i potraži reference na druge fajlove:

```json
{
  "buffers": [
    {
      "uri": "modelA.bin"  ← Provjeri da li ovaj fajl postoji
    }
  ],
  "images": [
    {
      "uri": "texture.jpg"  ← Provjeri da li ovaj fajl postoji
    }
  ]
}
```

Svi referencirani fajlovi moraju biti u `public/models/` direktoriju.

### Rješenje 3: Provjeri Next.js konfiguraciju

Provjeri `next.config.ts` - možda treba dodati podršku za statičke fajlove:

```typescript
// next.config.ts (obično nije potrebno)
module.exports = {
  // Next.js automatski servira fajlove iz public/
}
```

### Rješenje 4: Provjeri CORS

Ako koristiš eksterne resurse, možda imaš CORS probleme. Za lokalni razvoj, to ne bi trebalo biti problem.

### Rješenje 5: Provjeri veličinu modela

Veliki modeli (> 10MB) mogu uzrokovati probleme:
- Sporo učitavanje
- Memory problemi
- Browser crash

**Rješenje:** Kompresuj model:
- https://gltf.report/
- Ili koristi manji/lakši model za testiranje

## Debugging koraci

1. **Provjeri da li se fajl učitava:**
   - Otvori: http://localhost:3000/models/modelA.gltf
   - Ako vidiš JSON ili grešku, fajl je dostupan
   - Ako vidiš 404, fajl nije u pravom direktoriju

2. **Provjeri konzolu:**
   - Otvori Developer Tools (F12)
   - Provjeri Console za greške
   - Provjeri Network tab za zahtjeve

3. **Provjeri da li se model učitava:**
   - Trebao bi vidjeti poruku: `✅ Model modelA loaded successfully`
   - Ako ne vidiš poruku, model se ne učitava

4. **Provjeri da li se model renderira:**
   - Model bi trebao biti vidljiv u sceni
   - Ako nije vidljiv, možda je:
     - Previše mali/velik
     - Daleko od kamere
     - Nema materijala/svjetla

## Preporuke

1. **Koristi GLB format** umjesto GLTF (lakše, sve u jednom fajlu)
2. **Kompresuj modele** prije korištenja (manji fajlovi = brže učitavanje)
3. **Provjeri modele** u online vieweru prije korištenja
4. **Koristi jednostavne modele** za testiranje funkcionalnosti

## Test sa jednostavnim modelom

Ako želiš testirati funkcionalnost bez GLTF/GLB modela:

1. Postavi `USE_SIMPLE_MODELS = true` u `page.tsx`
2. Aplikacija će koristiti Three.js primitivne oblike
3. Sve funkcionalnosti (drag, rotation, Firestore) će raditi

## Ako ništa ne pomaže

1. Provjeri da li model radi u online vieweru
2. Pokušaj s drugim modelom (npr. preuzmi test model sa Sketchfab)
3. Provjeri da li su sve dependencije instalirane: `npm install`
4. Provjeri da li dev server radi: `npm run dev`
5. Provjeri browser konzolu za detaljne greške

