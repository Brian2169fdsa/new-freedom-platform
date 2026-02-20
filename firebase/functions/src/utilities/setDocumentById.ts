import {getReferenceById} from "./getReferenceById";
import {DocumentData, WithFieldValue} from "firebase-admin/firestore";

/**
 * Sets the data of a document in a Firestore collection.
 *
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} id - The unique identifier of the document to be updated.
 * @param {object} data - The data to be updated for the document.
 * @return {Promise<void>} A Promise that resolves with success status.
 * @throws {Error} If there is an issue updating the data or if the
 *    input parameters are invalid.
 */
export const setDocumentById =
  function<T extends WithFieldValue<DocumentData>>(collectionName: string) {
    return async function(id: string, data: T) {
      const docRef = getReferenceById(collectionName)(id);
      return await docRef.set(data);
    };
  };
