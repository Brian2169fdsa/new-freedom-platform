import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {LikePostReq} from "../models/request/likePostReq";
import {atomicUpdatePostById} from "../models/data/post";
import {atomicUpdateUserById} from "../models/data/user";

const config: RequestConfig<typeof LikePostReq, ResponseBase> = {
  name: "likePost",
  schema: LikePostReq,
};

/**
 * Likes a post by adding a user id to a post's likedBy array. Additionally,
 * this function will update the post author user document to increment their
 * likeCount.
 *
 * @param {Object} request - The Firebase Function request object.
 * @param {string} request.data.id - The id of the post to be liked.
 * @throws {Error} Throws an internal error if there is an issue.
 * @return {Promise<Object>} A promise that resolves with a success status.
 */
export const likePost = callHandler(config, async (request, ctx) => {
  // Require post id.
  const {id} = request;

  // Fetch+update post likedBy in single transaction.
  let authorId = "";
  await atomicUpdatePostById(id, (post) => {
    authorId = post.authorId;
    post.likedBy.push(ctx.authUserId);
  });

  // Fetch+update post author likeCount in single transaction.
  await atomicUpdateUserById(authorId, (author) => {
    author.likeCount = author.likeCount + 1;
  });

  return Success;
});
