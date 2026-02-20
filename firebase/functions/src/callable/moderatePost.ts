import {ResponseBase, Success} from "../interfaces/responseBase";
import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ModeratePostReq} from "../models/request/moderatePostReq";
import {IsAdminUser} from "../interfaces/context";
import {
  getModerationReportById,
  updateModerationReportById,
} from "../models/data/moderationReport";
import {updatePostById} from "../models/data/post";
import {FieldValue} from "firebase-admin/firestore";

const config: RequestConfig<typeof ModeratePostReq, ResponseBase> = {
  name: "moderatePost",
  contextOptions: IsAdminUser,
  schema: ModeratePostReq,
};

/**
 * Moderates a post. If moderator chooses to "allow" the post,
 * then no action will be taken to the post itself. If moderator
 * chooses to "archive" the post, that will be handled here.
 *
 * In either case, the moderationReport document will be updated
 * to reflect the action of the moderator.
 *
 * @param {Object} request - The Firebase Cloud Function request object.
 * @param {Object} request.data - The data payload of the request.
 * @param {string} request.data.id - The ID of the moderation report.
 * @param {string} request.data.action - The action to be taken on the
 *    post ("allow" or "archive").
 *
 * @returns {Promise<Object>} A promise that resolves to an object indicating
 *    the success of the moderation.
 * @returns {boolean} success - Indicates whether the moderation process
 *    was successful.
 *
 * @throws {Error} If authentication fails or if not an admin.
 * @throws {Error} If the required moderation report ID or action is missing.
 * @throws {Error} If any unexpected error occurs during moderation process.
 */
export const moderatePost = callHandler(config, async (request) => {
  // Require report.
  const report = await getModerationReportById(request.id);

  // If moderation action is to archive, update the post.
  if (request.action === "archive") {
    await updatePostById(report.contentId, {
      archived: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Update moderation report to reflect action of moderator.
  await updateModerationReportById(request.id, {
    status: "completed",
    action: request.action,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return Success;
});
