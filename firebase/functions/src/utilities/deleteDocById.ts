import {getReferenceById} from "./getReferenceById";

/**
 * Deletes a document by its ID from the specified collection.
 *
 * @param {string} collectionName - The name of the collection.
 * @return {Function} An async function that takes the ID of the
 * document to be deleted.
 * @throws {Error} If there is an error during the deletion process.
 */
export function deleteDocumentById(collectionName: string) {
  /**
   * Async function that deletes a document by its ID.
   *
   * @param {string} id - The ID of the document to be deleted.
   * @return {Promise<void>} A promise that resolves when the document
   * is successfully deleted.
   * @throws {Error} If there is an error during the deletion process.
   */
  return async function(id: string) {
    const ref = getReferenceById(collectionName)(id);
    await ref.delete();
  };
}
