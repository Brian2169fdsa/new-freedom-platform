/* v8 ignore start */
import {getAuth} from "firebase-admin/auth";
import {isProd} from "./isProd";

/**
 * Decodes the provided token to retrieve info of authenticated user.
 *
 * @param {string} token The token to be decoded.
 * @return {Promise<DecodedIdToken>} In a non-production environment, returns
 *    an object containing the user uid equivalent to token param. In a
 *    production environment, verifies the provided token using Firebase
 *    Authentication and returns an object containing the user uid.
 * @throws FirebaseAuthException If an error occurs during token
 *    verification in a production environment.
 */
export const getDecodedIdToken = async (token: string) => {
  if (!isProd()) {
    return {uid: token};
  }
  return await getAuth().verifyIdToken(token);
};
