import {docNotParsableError} from "./errors";
import {logger} from "firebase-functions";
import {z} from "zod";
import {isProd} from "./isProd";

/**
 * Parses and validates the structure of Firestore document data
 * against a provided schema.
 *
 * @template T - The type of the schema used to validate the document.
 * @param {T} schema - The schema used to validate the document structure.
 * @param {DocumentData} data - The Firestore document data.
 * @return {z.infer<T>} The parsed document data.
 * @throws {Error} Throws an error if the document data cannot be parsed
 *  according to the schema.
 */
export const getParsedDoc = <T extends z.ZodTypeAny>(
  schema: T,
  data: FirebaseFirestore.DocumentData
): z.infer<T> => {
  // Return document data.
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  /* v8 ignore next 3 */
  if (isProd()) {
    logger.error("Doc not parseable : " + JSON.stringify(parsed.error));
  }
  throw docNotParsableError(parsed.error);
};
