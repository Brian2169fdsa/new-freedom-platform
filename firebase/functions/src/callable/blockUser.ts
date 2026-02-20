import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {BlockUserReq} from "../models/request/blockUserReq";
import {atomicUpdateUserById} from "../models/data/user";

const config: RequestConfig<typeof BlockUserReq, ResponseBase> = {
  name: "blockUser",
  schema: BlockUserReq,
};

/**
 * Blocks a user by adding a user id to requesting user's blockedUsers array.
 *
 * @param {Object} request - The Firebase Function request object.
 * @param {Object} request.data - The request data object.
 * @param {string} request.data.id - The id of the user to be blocked.
 * @throws {Error} Throws an Error if there is an issue.
 * @return {Promise<Object>} A promise that resolves with success status.
 */
export const blockUser = callHandler(config, async (request, ctx) => {
  // Require user id.
  const {id} = request;

  // Fetch+update user in single transaction.
  await atomicUpdateUserById(ctx.authUserId, (user) => {
    if (user.blockedUsers.indexOf(id) === -1) {
      user.blockedUsers.push(id);
    }
  });

  return Success;
});
