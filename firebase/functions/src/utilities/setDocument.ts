import {getReferenceById} from "./getReferenceById";
import {fieldMustBeStringError} from "./errors";

/**
 * Sets the data of a document in a Firestore collection.
 *
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} documentId - The unique id of the document to be set.
 * @param {string} ownerId - The unique id of the document owner.
 * @param {object} data - The data to be set for the document.
 * @return {Promise<void>} A Promise that resolves with success status.
 * @throws {Error} If there is an issue setting the data or if the
 *    input parameters are invalid.
 */
export const setDocument = async (
  collectionName: string,
  documentId: string,
  ownerId: string,
  data: {id: string, ownerId: string}
) => {
  // Require id.
  if (documentId.length === 0) {
    throw fieldMustBeStringError("documentId");
  }

  // Require ownerId.
  if (ownerId.length === 0) {
    throw fieldMustBeStringError("ownerId");
  }

  // Set data.
  data.id = documentId;
  data.ownerId = ownerId;
  const docRef = getReferenceById(collectionName)(documentId);
  return await docRef.set(data);
};
