import {DocumentReference, getFirestore} from "firebase-admin/firestore";

/**
 * Returns a DocumentReference for a specific
 * document within a Firestore collection.
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} id - The unique id of the document within the collection.
 * @return {DocumentReference} A reference to the specified document.
 */
export const getReferenceById = function(collectionName: string) {
  return function(id: string): DocumentReference {
    return getFirestore().collection(collectionName).doc(id);
  };
};
