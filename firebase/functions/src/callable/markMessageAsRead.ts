import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {callHandler} from "../interfaces/callHandler";
import {MarkMessageAsReadReq} from "../models/request/markMessageAsReadReq";
import {atomicUpdateMessageById} from "../models/data/message";

const config: RequestConfig<typeof MarkMessageAsReadReq, ResponseBase> = {
  name: "markMessageAsRead",
  schema: MarkMessageAsReadReq,
};

/**
 * Marks a message as read by a user.
 *
 * @param {Object} request - The request object.
 * @param {string} request.data.id - The id of the message to mark.
 * @throws {Error} If any of the following conditions occur:
 * - If the user is not authenticated.
 * - If the message ID is missing or invalid.
 * - If there is an internal error during the process.
 * @return {Promise<Object>} A promise that resolves with a success status.
 */
export const markMessageAsRead = callHandler(config, async (request, ctx) => {
  // Require auth.
  const userId = ctx.authUserId;

  // Require message id.
  const {id} = request;

  // Fetch+update message readBy in single transaction.
  await atomicUpdateMessageById(id, (message) => {
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }
  });

  return Success;
});
