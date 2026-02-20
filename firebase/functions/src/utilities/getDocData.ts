/* v8 ignore start */
import {validateOrThrow} from "./validateOrThrow";
import {documentNotFoundError} from "./errors";

/**
 * Retrieves the data from a Firestore document snapshot
 * and validates its existence.
 *
 * @param {DocumentSnapshot<DocumentData>} snapshot - The Firestore
 *  document snapshot.
 * @return {DocumentData} The data of the document.
 * @throws {Error} Throws an error if the document snapshot does not
 *  exist or if the data is undefined or null.
 */
export const getDocData = function(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): FirebaseFirestore.DocumentData {
  validateOrThrow(snapshot.exists, documentNotFoundError(snapshot.id));

  const data = snapshot.data();
  if (data === undefined || data === null) {
    throw documentNotFoundError(snapshot.id);
  }
  return data;
};
