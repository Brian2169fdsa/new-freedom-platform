import {z} from "zod";

/**
 * Asserts that the given data matches the specified schema.
 *
 * @template T - The Zod schema type.
 * @param {T} schema - The Zod schema to validate against.
 * @param {unknown} data - The data to validate.
 * @return {void}
 * @throws {z.ZodError} If the data does not match the schema.
 */
export function assertDataType<T extends z.ZodTypeAny>(
  schema: T, data: unknown
): asserts data is z.infer<T> {
  schema.parse(data);
}
