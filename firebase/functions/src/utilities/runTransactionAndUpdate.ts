import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {getReferenceById} from "./getReferenceById";
import {getDocData} from "./getDocData";
import {z} from "zod";
import {getParsedDoc} from "./getParsedDoc";

/**
 * Executes a Firestore transaction to update a document in a specified
 * collection. By using a transaction, the read of the document and the
 * subsequent write of the document happen atomically.
 *
 * See documentation:
 * https://firebase.google.com/docs/firestore/manage-data/transactions
 *
 *    where the document resides.
 *    document data as a parameter and performs the update.
 * @param {T} schema - Zod schema for parsing
 * @param {string} collectionName - Name of the collection
 * @return {Promise<void>} - A Promise that resolves when the
 *    transaction is successfully completed.
 *
 * @throws {Error} - Throws an error if any transaction operation fails.
 */
export const runTransactionAndUpdate =
  function <T extends z.ZodTypeAny>(schema: T, collectionName: string) {
    return async function(
      id: string,
      updateFunction: (doc: z.infer<T>) => void
    ) {
      return await getFirestore().runTransaction(async (transaction) => {
        // Get the document
        const ref = getReferenceById(collectionName)(id);
        const snapshot = await transaction.get(ref);
        const documentData = getDocData(snapshot);
        const doc = getParsedDoc(schema, documentData);

        // Update the document.
        updateFunction(doc);

        // Save to db.
        transaction.update(ref, {
          ...(doc as Record<string, unknown>),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    };
  };
