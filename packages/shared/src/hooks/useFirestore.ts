import { useState, useEffect, useCallback } from 'react';
import {
  getDocument,
  subscribeToDocument,
  subscribeToCollection,
} from '../services/firebase/firestore';
import type { DocumentData, QueryConstraint } from 'firebase/firestore';
import { demoStore } from '../demo/store';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// ---------------------------------------------------------------------------
// Demo-mode hooks — read from the in-memory DemoStore
// ---------------------------------------------------------------------------

function useDemoDocument<T>(collectionName: string, docId: string | null | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    // Initial read
    setData(demoStore.getDoc(collectionName, docId) as T | null);
    setLoading(false);

    // Subscribe to changes
    const unsubscribe = demoStore.subscribeDoc(collectionName, docId, () => {
      setData(demoStore.getDoc(collectionName, docId) as T | null);
    });

    return unsubscribe;
  }, [collectionName, docId]);

  return { data, loading, error: null };
}

function useDemoCollection<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial read
    setData(demoStore.getDocs(collectionName) as T[]);
    setLoading(false);

    // Subscribe to changes
    const unsubscribe = demoStore.subscribe(collectionName, () => {
      setData(demoStore.getDocs(collectionName) as T[]);
    });

    return unsubscribe;
  }, [collectionName]);

  return { data, loading, error: null };
}

// ---------------------------------------------------------------------------
// Public hooks — route to demo or Firestore
// ---------------------------------------------------------------------------

export function useDocument<T extends DocumentData>(
  collectionName: string,
  docId: string | null | undefined
) {
  // Demo mode uses in-memory store
  if (DEMO_MODE) {
    return useDemoDocument<T>(collectionName, docId);
  }

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToDocument<T>(
      collectionName,
      docId,
      (doc) => {
        setData(doc);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

export function useCollection<T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  // Demo mode uses in-memory store (ignores constraints)
  if (DEMO_MODE) {
    return useDemoCollection<T>(collectionName);
  }

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToCollection<T>(
      collectionName,
      (docs) => {
        setData(docs);
        setLoading(false);
      },
      ...constraints
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
}

export function useDocumentOnce<T extends DocumentData>(
  collectionName: string,
  docId: string | null | undefined
) {
  // Demo mode uses in-memory store
  if (DEMO_MODE) {
    return useDemoDocument<T>(collectionName, docId);
  }

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getDocument<T>(collectionName, docId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [collectionName, docId]);

  return { data, loading, error };
}
