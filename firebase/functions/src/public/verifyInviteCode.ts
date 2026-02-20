import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {requestHandler} from "../interfaces/requestHandler";
import {VerifyInviteCodeReq} from "../models/request/verifyInviteCodeReq";
import {atomicUpdateInviteById} from "../models/data/invite";

/**
 * Verifies and counts the use of an invite code for soon-to-be users.
 *
 * This function serves as an endpoint for verifying and counting the use of an
 * invite code. Authentication is not required as it is intended to be called
 * by users who have not yet authenticated. It checks for the presence of
 * the 'inviteCode' in the request and validates it. If the invite code is
 * valid, it increments the 'useCount' associated with the invite code and
 * updates the invite record in Firestore.
 *
 * @param {Object} req - The request object.
 * @param {string} req.query.inviteCode - The string invite code to verify.
 * @param {Object} res - The response object used to send the result.
 * @throws {Error} If any of the following conditions occur:
 * - The 'inviteCode' is missing or invalid in the request.
 * - An error occurs during the verification process.
 *
 * @return {Object} An object indicating the success of the verification.
 */
const config: RequestConfig<typeof VerifyInviteCodeReq, ResponseBase> = {
  name: "verifyInviteCode",
  schema: VerifyInviteCodeReq,
};

export const verifyInviteCode = requestHandler(config, async (req) => {
  // Require inviteCode.
  const {inviteCode} = req;

  // Update invite use count.
  await atomicUpdateInviteById(inviteCode, (invite) => {
    invite.useCount = invite.useCount + 1;
  });

  return Success;
});
