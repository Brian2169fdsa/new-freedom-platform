/**
 * Checks if the current environment is set to production.
 *
 * @return {boolean} Returns true if the environment
 *    is production, otherwise false.
 */
export const isProd = () => {
  /* Ignore untestable environment value */
  /* istanbul ignore if */
  if (process.env.NODE_ENV == "production") {
    return true;
  }
  return false;
};
