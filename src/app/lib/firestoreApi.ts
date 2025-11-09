// src/lib/firestoreApi.ts
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface ModelState {
  position: [number, number, number];
  rotation: [number, number, number];
  updatedAt?: Timestamp;
}

export async function saveModelState(id: string, data: { position: number[]; rotation: number[] }): Promise<void> {
  const d = doc(db, 'models', id);
  await setDoc(d, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadModelState(id: string): Promise<ModelState | null> {
  const d = doc(db, 'models', id);
  const snap = await getDoc(d);
  if (snap.exists()) {
    const data = snap.data();
    return {
      position: data.position || [0, 0, 0],
      rotation: data.rotation || [0, 0, 0],
      updatedAt: data.updatedAt
    };
  }
  return null;
}
