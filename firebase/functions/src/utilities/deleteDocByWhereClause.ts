import {getFirestore, WriteResult} from "firebase-admin/firestore";
/**
 * Deletes a document by using a simple where clause from
 * the specified collection.
 *
 * @param {string} collectionName - The name of the collection.
 * @param {string} field - The name of the field to query
 * @param {string} value - The value to look for in the field
 * @throws {Error} If there is an error during the deletion process.
 */
export async function deleteDocByWhereClause(
  collectionName: string,
  field: string,
  value: unknown
) {
  const docs = await getFirestore()
    .collection(collectionName)
    .where(field, "==", value).get();
  const tasks: Promise<WriteResult>[] = [];
  docs.forEach((docs) => {
    tasks.push(docs.ref.delete());
  });
  await Promise.all(tasks);
}
