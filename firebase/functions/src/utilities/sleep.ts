/**
 * Pauses execution for a specified duration.
 *
 * The `sleep` function returns a Promise that resolves after the specified
 * number of milliseconds. It can be used to introduce delays in asynchronous
 * functions.
 *
 * @param {number} ms - The number of milliseconds to pause execution.
 * @return {Promise<void>} A promise that resolves with no value after
 *    the specified delay.
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
