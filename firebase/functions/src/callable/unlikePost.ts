import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {UnlikePostReq} from "../models/request/unlikePostReq";
import {atomicUpdateUserById} from "../models/data/user";
import {atomicUpdatePostById} from "../models/data/post";

const config: RequestConfig<typeof UnlikePostReq, ResponseBase> = {
  name: "unlikePost",
  schema: UnlikePostReq,
};

/**
 * Unlikes a post.
 */
export const unlikePost = callHandler(config, async (request, ctx) => {
  // Get data from request.
  const userId = ctx.authUserId;
  const {id} = request;

  // Update post likedBy by removing requesting user.
  let authorId = "";
  await atomicUpdatePostById(id, (post) => {
    authorId = post.authorId;
    post.likedBy = post.likedBy.filter((item) => item !== userId);
  });

  // Update post author likeCount.
  await atomicUpdateUserById(authorId, (author) => {
    author.likeCount = Math.max(author.likeCount - 1, 0);
  });

  return Success;
});
