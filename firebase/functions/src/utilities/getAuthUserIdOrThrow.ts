import {CallableRequest} from "firebase-functions/v2/https";
import {NotAuthenticatedError} from "./errors";

/**
 * Returns the authenticated user's unique ID as
 * a string or throws an error if not authenticated.
 *
 * This function checks if the request user is authenticated based on the
 * presence of a user id (uid) within the request's authentication context.
 * If the user is authenticated, it returns their unique id as a string;
 * otherwise, it throws an Error with a message indicating that the user
 * is not authenticated.
 *
 * @param {Object} request - The request object.
 * @return {string} The unique id of the authenticated user as a string.
 * @throws {Error} If request user is not authenticated, error is thrown.
 */
export const getAuthUserIdOrThrow = function(
  request: CallableRequest<unknown>
): string {
  if (!request.auth) throw NotAuthenticatedError;

  const isAuthValid = request.auth.uid?.length > 0;
  if (!isAuthValid) {
    throw NotAuthenticatedError;
  }

  return request.auth.uid;
};
