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
import { demoStore } from '../../demo/store';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  if (DEMO_MODE) {
    return (demoStore.getDoc(collectionName, docId) as T) ?? null;
  }
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
};

export const getDocuments = async <T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  if (DEMO_MODE) {
    return demoStore.getDocs(collectionName) as T[];
  }
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
};

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

export const setDocument = async (
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> => {
  if (DEMO_MODE) {
    demoStore.setDoc(collectionName, docId, { ...data, updatedAt: new Date() });
    return;
  }
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
  if (DEMO_MODE) {
    demoStore.updateDoc(collectionName, docId, { ...data, updatedAt: new Date() });
    return;
  }
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  if (DEMO_MODE) {
    demoStore.deleteDoc(collectionName, docId);
    return;
  }
  await deleteDoc(doc(db, collectionName, docId));
};

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const subscribeToDocument = <T extends DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
) => {
  if (DEMO_MODE) {
    // Deliver initial value
    callback((demoStore.getDoc(collectionName, docId) as T) ?? null);
    // Subscribe for future changes
    return demoStore.subscribeDoc(collectionName, docId, () => {
      callback((demoStore.getDoc(collectionName, docId) as T) ?? null);
    });
  }

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
  if (DEMO_MODE) {
    // Deliver initial value
    callback(demoStore.getDocs(collectionName) as T[]);
    // Subscribe for future changes
    return demoStore.subscribe(collectionName, () => {
      callback(demoStore.getDocs(collectionName) as T[]);
    });
  }

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

// ---------------------------------------------------------------------------
// Create operations
// ---------------------------------------------------------------------------

export const addDocument = async (
  collectionName: string,
  data: DocumentData
): Promise<string> => {
  if (DEMO_MODE) {
    return demoStore.addDoc(collectionName, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
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
  if (DEMO_MODE) {
    demoStore.setDoc(collectionName, docId, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return;
  }
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export { collection, doc, query, where, orderBy, limit, serverTimestamp, addDoc };
