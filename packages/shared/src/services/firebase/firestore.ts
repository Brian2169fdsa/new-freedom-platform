import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
};

export const getDocuments = async <T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
};

export const setDocument = async (
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> => {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> => {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  await deleteDoc(doc(db, collectionName, docId));
};

export const subscribeToDocument = <T extends DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    doc(db, collectionName, docId),
    (docSnap) => {
      callback(docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null);
    },
    (error) => {
      console.warn(`Firestore subscription error (${collectionName}/${docId}):`, error.message);
      callback(null);
      onError?.(error);
    }
  );
};

export const subscribeToCollection = <T extends DocumentData>(
  collectionName: string,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
) => {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T)));
    },
    (error) => {
      console.warn(`Firestore subscription error (${collectionName}):`, error.message);
      callback([]);
    }
  );
};

export const addDocument = async (
  collectionName: string,
  data: DocumentData
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const createDocument = async (
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> => {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export { collection, doc, query, where, orderBy, limit, serverTimestamp, addDoc };
