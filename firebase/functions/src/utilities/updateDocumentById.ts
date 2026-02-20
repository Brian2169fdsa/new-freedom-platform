import {getReferenceById} from "./getReferenceById";

/**
 * Updates the data of a document in a Firestore collection.
 *
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} id - The unique identifier of the document to be updated.
 * @param {object} data - The data to be updated for the document.
 * @return {Promise<void>} A Promise that resolves with success status.
 * @throws {Error} If there is an issue updating the data or if the
 *    input parameters are invalid.
 */
export const updateDocumentById =
  function<T>(collectionName: string) {
    return async function(id: string, data: Partial<T>) {
      const docRef = getReferenceById(collectionName)(id);
      return await docRef.update(data);
    };
  };
