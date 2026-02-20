/**
 * Validates a condition and throws a custom
 * Error if the condition is false.
 *
 * @param {boolean} condition - The condition to be validated.
 * @param {string} error - The error to be used if the
 *    condition is false.
 * @throws {Error} Throws an Error with the given error message.
 *    and the provided error message if the condition is false.
 * @example
 * // Example usage:
 * const isValid = someValidationFunction();
 * validateOrThrow(isValid, "Invalid input. Please check and try again.");
 */
export const validateOrThrow = function(
  condition: boolean, error: Error
): void {
  // Early out if condition valid.
  if (condition) {
    return;
  }

  // Condition is invalid, time to throw.
  throw error;
};
