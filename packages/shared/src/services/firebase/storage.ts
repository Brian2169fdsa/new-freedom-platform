import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const uploadFile = async (
  path: string,
  file: File
): Promise<string> => {
  if (DEMO_MODE) return 'https://demo.reprieve.app/uploads/demo-file';
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deleteFile = async (path: string): Promise<void> => {
  if (DEMO_MODE) return;
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

export const getFileURL = async (path: string): Promise<string> => {
  if (DEMO_MODE) return 'https://demo.reprieve.app/uploads/demo-file';
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};
