import {FieldValue} from "firebase-admin/firestore";
import {validateOrThrow} from "../utilities/validateOrThrow";
import {callHandler} from "../interfaces/callHandler";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {InvalidOwnerError} from "../utilities/errors";
import {ArchivePostReq} from "../models/request/archivePostReq";
import {RequestConfig} from "../interfaces/requestConfig";
import {getPostById, updatePostById} from "../models/data/post";

const config: RequestConfig<typeof ArchivePostReq, ResponseBase> = {
  name: "archivePost",
  schema: ArchivePostReq,
};

/**
 * Archives a post (setting archived field to true).
 *
 * @param {Object} config - The request and response schema for this function.
 * @param {Object} request - The request object.
 * @param {string} request.id - The ID of the post to be archived.
 * @param {Object} ctx - The context object.
 * @param {string} ctx.authUserId - The ID of the authenticated user.
 * @returns {Promise<string>} A promise that resolves to a success message.
 * @throws {InvalidOwnerError} If the auth'd user is not the owner of the post.
 */
export const archivePost = callHandler(config, async (request, ctx) => {
  // Require document collection and id.
  const {id} = request;

  // Require auth user is owner of the document.
  const document = await getPostById(id);
  const requestedByOwner = document.ownerId === ctx.authUserId;
  validateOrThrow(requestedByOwner, InvalidOwnerError);

  // Save document.
  await updatePostById(id, {
    archived: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return Success;
});
