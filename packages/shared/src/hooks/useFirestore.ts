import { useState, useEffect } from 'react';
import {
  getDocument,
  subscribeToDocument,
  subscribeToCollection,
} from '../services/firebase/firestore';
import type { DocumentData, QueryConstraint } from 'firebase/firestore';

export function useDocument<T extends DocumentData>(
  collectionName: string,
  docId: string | null | undefined
) {
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
