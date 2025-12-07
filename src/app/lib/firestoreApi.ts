// src/lib/firestoreApi.ts
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { TextBoxData } from "../utils/store";

export interface ModelState {
  position: [number, number, number];
  rotation: [number, number, number];
  updatedAt?: Timestamp;
}

export interface TextBoxState {
  id: string;
  position: [number, number, number];
  text: string;
  textColor: string;
  backgroundColor: string;
  backgroundTransparent: boolean;
  fontSize: number;
  createdAt?: Timestamp;
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

// Text Box API functions
export async function saveTextBox(textBox: TextBoxData): Promise<void> {
  const d = doc(db, 'textBoxes', textBox.id);
  await setDoc(d, {
    position: textBox.position,
    text: textBox.text,
    textColor: textBox.textColor,
    backgroundColor: textBox.backgroundColor,
    backgroundTransparent: textBox.backgroundTransparent,
    fontSize: textBox.fontSize,
    createdAt: textBox.createdAt ? Timestamp.fromDate(textBox.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadTextBox(id: string): Promise<TextBoxState | null> {
  const d = doc(db, 'textBoxes', id);
  const snap = await getDoc(d);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id,
      position: data.position || [0, 0, 0],
      text: data.text || '',
      textColor: data.textColor || '#000000',
      backgroundColor: data.backgroundColor || '#ffffff',
      backgroundTransparent: data.backgroundTransparent ?? false,
      fontSize: data.fontSize || 16,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }
  return null;
}

export async function loadAllTextBoxes(): Promise<TextBoxState[]> {
  const textBoxesCollection = collection(db, 'textBoxes');
  const snapshot = await getDocs(textBoxesCollection);
  const textBoxes: TextBoxState[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    textBoxes.push({
      id: doc.id,
      position: data.position || [0, 0, 0],
      text: data.text || '',
      textColor: data.textColor || '#000000',
      backgroundColor: data.backgroundColor || '#ffffff',
      backgroundTransparent: data.backgroundTransparent ?? false,
      fontSize: data.fontSize || 16,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  });
  
  return textBoxes;
}

export async function deleteTextBox(id: string): Promise<void> {
  const d = doc(db, 'textBoxes', id);
  await deleteDoc(d);
}
