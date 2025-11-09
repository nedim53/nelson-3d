# Nelson 3D - 3D Model Management Application

Web aplikacija za upravljanje 3D modelima koristeći Next.js, React Three Fiber i Firestore.

## Funkcionalnosti

- ✅ Učitavanje dva GLB 3D modela
- ✅ 3D i 2D (top-down) prikaz s toggle kontrolom
- ✅ Drag & drop modela unutar scene
- ✅ Collision detection (sprečavanje preklapanja)
- ✅ Rotacija modela putem intuitivnog sučelja
- ✅ Automatsko spremanje pozicije i rotacije u Firestore
- ✅ Učitavanje zadnjeg stanja iz Firestore pri reload-u

## Preduvjeti

- Node.js LTS (v18+)
- npm ili yarn
- Firebase projekt (besplatan)

## Instalacija

1. Kloniraj repozitorij ili preuzmi kod
2. Instaliraj dependencije:

```bash
npm install
```

3. Kreiraj Firebase projekt:
   - Idite na [Firebase Console](https://console.firebase.google.com/)
   - Kreirajte novi projekt
   - Dodajte Web app
   - Kopirajte Firebase konfiguraciju

4. Kreiraj `.env.local` fajl u **root direktoriju** projekta (ne u `src/app/`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

   **VAŽNO:** Next.js učitava `.env.local` samo iz root direktorija projekta (gdje je `package.json`). Ako si ga stavio u `src/app/`, premjesti ga u root!

5. Postavite Firestore Security Rules:

   Idite u Firebase Console → Firestore Database → Rules i postavite rules iz `FIRESTORE_RULES.md` fajla:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /models/{modelId} {
      allow read: if true;
      
      allow create: if request.resource.data.keys().hasAll(['position', 'rotation']) &&
                     request.resource.data.position is list &&
                     request.resource.data.position.size() == 3 &&
                     request.resource.data.rotation is list &&
                     request.resource.data.rotation.size() == 3 &&
                     request.resource.data.position[0] is number &&
                     request.resource.data.position[1] is number &&
                     request.resource.data.position[2] is number &&
                     request.resource.data.rotation[0] is number &&
                     request.resource.data.rotation[1] is number &&
                     request.resource.data.rotation[2] is number;
      
      allow update: if request.resource.data.keys().hasAll(['position', 'rotation']) &&
                     request.resource.data.position is list &&
                     request.resource.data.position.size() == 3 &&
                     request.resource.data.rotation is list &&
                     request.resource.data.rotation.size() == 3 &&
                     request.resource.data.position[0] is number &&
                     request.resource.data.position[1] is number &&
                     request.resource.data.position[2] is number &&
                     request.resource.data.rotation[0] is number &&
                     request.resource.data.rotation[1] is number &&
                     request.resource.data.rotation[2] is number;
      
      allow delete: if true;
    }
  }
}
```

   **Napomena:** Ove rules validiraju strukturu podataka i osiguravaju da samo ispravni podaci budu spremljeni u bazu.

6. Dodajte GLB modele:

   **Gdje naći modele:**
   - **Sketchfab** (preporučeno): https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount&q=free
   - **Poly Haven**: https://polyhaven.com/models (besplatni, CC0)
   - **TurboSquid**: https://www.turbosquid.com/Search/3D-Models/free
   - **CGTrader**: https://www.cgtrader.com/free-3d-models?file_format=glb
   
   Detaljne upute su u `MODELS_GUIDE.md` fajlu.

   **Postavljanje modela:**
   1. Stvori direktorij `public/models/` u root-u projekta (ako ne postoji)
   2. Preuzmi GLB modele i stavite ih u `public/models/`:
      - `public/models/modelA.glb`
      - `public/models/modelB.glb`
   
   3. Ili promijeni putanje u `src/app/page.tsx`:

```typescript
const MODEL_URLS: Record<string, string> = {
  modelA: '/models/your-model-a.glb',
  modelB: '/models/your-model-b.glb',
}
```

   **Brzi test:** Ako ne možeš pronaći modele, možeš privremeno koristiti Three.js geometrije (vidi `MODELS_GUIDE.md`).

## Pokretanje

Za development:

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

Za production build:

```bash
npm run build
npm start
```

## Korištenje

1. **Prikaz:** Koristite gumb "3D" ili "2D (Top-down)" za prebacivanje između prikaza
2. **Pomicanje modela:** Kliknite na model i koristite žuti gizmo (transform kontrolu) za pomicanje
3. **Rotacija:** Koristite slider kontrole u lijevom gornjem uglu za rotaciju modela
4. **Collision Detection:** Aplikacija automatski sprječava preklapanje modela
5. **Spremanje:** Sve promjene se automatski spremaju u Firestore (debounced na 200ms)

## Struktura projekta

```
nelson-3d/
├── src/
│   └── app/
│       ├── components/
│       │   ├── CanvasWrapper.tsx    # Glavna 3D scena
│       │   ├── ModelItem.tsx        # Komponenta za pojedinačni model
│       │   ├── ControlsUI.tsx       # UI kontrole (toggle, rotacija)
│       │   └── RotationControls.tsx # Kontrole za rotaciju
│       ├── lib/
│       │   ├── firebase.ts          # Firebase inicijalizacija
│       │   └── firestoreApi.ts      # Firestore API funkcije
│       ├── utils/
│       │   ├── store.ts             # Zustand state management
│       │   └── debounce.ts          # Debounce utility
│       └── page.tsx                 # Glavna stranica
├── public/
│   └── models/                      # GLB modeli
└── .env.local                       # Firebase konfiguracija
```

## Tehnologije

- **Next.js 16** - React framework
- **React Three Fiber** - React renderer za Three.js
- **Three.js** - 3D biblioteka
- **@react-three/drei** - Helper komponente za R3F
- **Firebase Firestore** - Baza podataka
- **Zustand** - State management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Napomene

### Sigurnost

- Firestore rules validiraju strukturu podataka (position i rotation moraju biti nizovi od 3 broja)
- Rules dozvoljavaju javni pristup bez autentikacije (kao što zahtijeva zadatak)
- Za produkciju s više korisnika, preporuča se dodati autentikaciju (vidi `FIRESTORE_RULES.md`)

### Collision Detection

- Trenutno se koristi AABB (Axis-Aligned Bounding Box) collision detection
- Za rotirane modele, AABB može biti prevelik
- Za robusnije rješenje, razmotrite OBB (Oriented Bounding Box) ili SAT (Separating Axis Theorem)

### Performance

- Modeli se preloadaju pri učitavanju
- Firestore zapisi su debounced na 200ms za glatko iskustvo
- Bounding box-ovi se ažuriraju svaki frame

### Deployment

- Aplikacija se može deployati na Vercel (preporučeno za Next.js)
- Ne zaboravite postaviti environment varijable u Vercel dashboardu
- Provjerite Firestore rules prije deploymenta

## Rješavanje problema

### Modeli se ne učitavaju

- Provjerite da li su GLB fajlovi u `public/models/` direktoriju
- Provjerite putanje u `page.tsx`
- Provjerite konzolu za greške

### Firestore greške

- Provjerite `.env.local` fajl
- Provjerite Firestore rules u Firebase Console
- Provjerite da li je Firestore omogućen u Firebase projektu

### Collision detection ne radi

- Provjerite da li su modeli inicijalizirani u store-u
- Provjerite konzolu za greške
- Možda je potrebno povećati bounding box offset

## Licenca

MIT

## Autor

Nelson 3D Project
