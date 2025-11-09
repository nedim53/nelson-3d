# Firebase Environment Varijable - Setup Guide

## Problem: Environment varijable se ne učitavaju

Ako vidiš upozorenje "Nedostaju Firebase environment varijable" iako si kreirao `.env.local`, slijedi ove korake:

## Korak 1: Provjeri lokaciju .env.local fajla

`.env.local` fajl **MORA** biti u **ROOT direktoriju** projekta (gdje je `package.json`), **NE** u `src/app/`!

```
nelson-3d/                    ← ROOT direktorij
├── package.json              ← Ovdje je package.json
├── .env.local                ← .env.local MORA biti OVDJE
├── next.config.ts
├── src/
│   └── app/
│       └── ...               ← NE ovdje!
└── public/
```

## Korak 2: Provjeri format .env.local fajla

`.env.local` fajl mora imati točan format:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**VAŽNO:**
- ✅ Sve varijable **MORAJU** počinjati s `NEXT_PUBLIC_`
- ✅ Ne smije biti razmaka oko `=` znaka
- ✅ Ne smije biti navodnika oko vrijednosti (osim ako vrijednost sama sadrži razmake)
- ✅ Ne smije biti komentara na istom redu

## Korak 3: RESTART dev server

**Nakon kreiranja ili promjene `.env.local` fajla, MORAŠ restartati dev server:**

1. Zaustavi server: `Ctrl+C` u terminalu
2. Pokreni ponovno: `npm run dev`

Next.js učitava environment varijable samo pri pokretanju servera!

## Korak 4: Provjeri da li su varijable učitane

Nakon restartanja servera, provjeri u browser konzoli (F12):
- Ako vidiš upozorenje, varijable se još uvijek ne učitavaju
- Ako ne vidiš upozorenje, varijable su učitane

## Korak 5: Debugging

Ako i dalje ne radi, provjeri:

### 1. Provjeri da li fajl postoji

```bash
# U root direktoriju projekta
ls -la .env.local
# Ili na Windows:
dir .env.local
```

### 2. Provjeri sadržaj fajla

```bash
# Provjeri da li fajl nije prazan
cat .env.local
# Ili na Windows:
type .env.local
```

### 3. Provjeri da li su varijable vidljive u kodu

Dodaj privremeno u `src/app/lib/firebase.ts`:

```typescript
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
```

Ako su `undefined`, varijable se ne učitavaju.

## Česti problemi

### Problem 1: Fajl je u krivom direktoriju

**Rješenje:** Premjesti `.env.local` u root direktorij (gdje je `package.json`)

### Problem 2: Varijable nemaju NEXT_PUBLIC_ prefix

**Rješenje:** Dodaj `NEXT_PUBLIC_` prefix svim varijablama

### Problem 3: Server nije restartan

**Rješenje:** Restartaj dev server (`Ctrl+C` pa `npm run dev`)

### Problem 4: Fajl ima pogrešan format

**Rješenje:** Provjeri da nema razmaka oko `=`, navodnika, itd.

### Problem 5: Fajl je u .gitignore

**Rješenje:** To je u redu, `.env.local` treba biti u `.gitignore` zbog sigurnosti

## Testiranje

Nakon što si postavio sve, provjeri:

1. Restartaj server
2. Otvori aplikaciju u browseru
3. Otvori Developer Tools (F12) → Console
4. Provjeri da li vidiš upozorenje o nedostajućim varijablama
5. Ako ne vidiš upozorenje, sve radi! ✅

## Ako ništa ne pomaže

1. Obriši `.env.local` fajl
2. Kreiraj ga ponovno u root direktoriju
3. Kopiraj varijable iz Firebase Console
4. Provjeri format
5. Restartaj server
6. Testiraj ponovno

## Napomena

- `.env.local` fajl je u `.gitignore` i neće biti commitan u Git
- To je dobro za sigurnost - nikad ne commitaj Firebase credentials!
- Za produkciju (Vercel), postavi environment varijable u Vercel dashboardu

