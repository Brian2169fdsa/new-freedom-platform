import {requestHandler} from "../interfaces/requestHandler";
import {getUserById} from "../models/data/user";
import {MeReq} from "../models/request/meReq";
import {MeRes} from "../models/request/meRes";
import {RequestConfig} from "../interfaces/requestConfig";
import {getDecodedIdToken} from "../utilities/getDecodedIdToken";

/**
 * Endpoint for third-party Single Sign-On (SSO) to retrieve user information.
 *
 * This endpoint is used by third-party Single Sign-On (SSO) services to
 * authenticate and retrieve user information. It requires a valid access
 * token provided via the query parameter and verifies it using Firebase
 * Authentication. If the token is valid, it returns user information,
 * including email, security information, first name, and last name.
 *
 * @param {Object} req - The request object with query parameter "token"
 * @param {Object} res - The response object.
 * @throws {Error} If any of the following conditions occur:
 * - If the required token is missing.
 * - If the token verification with Firebase Authentication fails.
 * @return {Promise<void>} A promise that resolves with a success status.
 */
const config: RequestConfig<typeof MeReq, MeRes> = {
  name: "me",
  schema: MeReq,
};

export const me = requestHandler(config, async (req) => {
  // Require query token.
  const {token} = req;

  // Get decoded id token and verify.
  const decodedToken = await getDecodedIdToken(token);
  const id = decodedToken.uid;
  const user = await getUserById(id);
  return {
    email: user.email,
    security: {subspace: "positionofneutrality"},
    firstName: user.firstName,
    lastName: user.lastName,
  };
});
