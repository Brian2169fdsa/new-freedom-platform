import {z} from "zod";
import {getReferenceById} from "./getReferenceById";
import {getDocData} from "./getDocData";
import {getParsedDoc} from "./getParsedDoc";

/**
 * Retrieves a document from a Firestore collection by its ID and validates its
 * structure against a provided schema.
 *
 * @template T - The type of the schema used to validate the document.
 * @param {z.ZodTypeAny} schema - The schema used to validate the document
 *  structure.
 * @param {string} collectionName - The name of the Firestore collection.
 * @return {Function} A function that accepts a document ID and returns a
 *  promise resolving to the document data.
 * @throws {Error} Throws an error if the document cannot be parsed according
 *  to the schema.
 */
export const getDocumentById =
  function <T extends z.ZodTypeAny>(schema: T, collectionName: string) {
    return async function(id: string): Promise<z.infer<T>> {
      const docRef = getReferenceById(collectionName)(id);
      const document = await docRef.get();
      const data = getDocData(document);
      return getParsedDoc(schema, data);
    };
  };
