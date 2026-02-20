import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {UnblockUserReq} from "../models/request/unblockUserReq";
import {atomicUpdateUserById} from "../models/data/user";

const config: RequestConfig<typeof UnblockUserReq, ResponseBase> = {
  name: "unblockUser",
  schema: UnblockUserReq,
};

/**
 * Unblocks a user by removing a user id from
 * requesting user's blockedUsers array.
 *
 * @param {Object} request - The Firebase Function request object.
 * @param {Object} request.data - The request data object.
 * @param {string} request.data.id - The id of the user to be unblocked.
 * @throws {Error} Throws an Error if there is an issue.
 * @return {Promise<Object>} A promise that resolves with success status.
 */
export const unblockUser = callHandler(config, async (request, ctx) => {
  // Require user id.
  const {id} = request;

  // Fetch+update user in single transaction.
  await atomicUpdateUserById(ctx.authUserId, (user) => {
    user.blockedUsers = user.blockedUsers.filter((item) => item !== id);
  });

  return Success;
});
