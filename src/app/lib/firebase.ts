import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Provjeri da li su environment varijable postavljene
// Napomena: Ova provjera se izvršava samo u browseru i može biti netočna ako server nije restartan
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName] || process.env[varName] === 'undefined'
);

if (missingVars.length > 0) {
  // Samo loguj upozorenje, ne zaustavljaj aplikaciju
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Nedostaju Firebase environment varijable:', missingVars);
    console.warn('📝 Upute:');
    console.warn('   1. Provjeri da li .env.local postoji u ROOT direktoriju (gdje je package.json)');
    console.warn('   2. Provjeri da li sve varijable počinju s NEXT_PUBLIC_');
    console.warn('   3. RESTARTAJ dev server (Ctrl+C pa npm run dev)');
    console.warn('   4. Provjeri da li su varijable postavljene ispravno');
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if not already initialized
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('❌ Greška pri inicijalizaciji Firebase:', error);
  throw error;
}

export const db = getFirestore(app);

