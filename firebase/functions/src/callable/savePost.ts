import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {FieldValue} from "firebase-admin/firestore";
import {SavePostReq} from "../models/request/savePostReq";
import {IncludeAuthUser} from "../interfaces/context";
import {Post, atomicUpdatePostById, setPostById} from "../models/data/post";
import {POSTS_COLLECTION} from "../utilities/constants";
import {processMedia} from "../utilities/processMedia";

const config: RequestConfig<typeof SavePostReq, ResponseBase> = {
  name: "savePost",
  contextOptions: IncludeAuthUser,
  schema: SavePostReq,
};

/**
 * Saves a post in Firestore, including optional media.
 */
export const savePost = callHandler(config, async (
  request,
  ctx
) => {
  // Require auth.
  const userId = ctx.authUserId;
  const user = ctx.authUser;

  // Incoming data.
  const {id} = request;
  const {source} = request;
  const {title} = request;
  const {text} = request;
  const {messageboardLink} = request;
  const {dev} = request;
  const {replyTo} = request;
  const isReply = (
    replyTo !== null &&
    replyTo !== undefined &&
    replyTo.length > 0
  );
  const authorDisplayName = user.displayName;
  const authorProfilePicURL = user.profilePicURL;

  // Process any media in the request.
  const {media} = request;
  const postMedia = await processMedia(media, POSTS_COLLECTION, userId);

  // Save new post.
  const post: Post = {
    id: id,
    source: source,
    ownerId: userId,
    replyTo: replyTo,
    title: title,
    text: text,
    messageboardLink: messageboardLink,
    dev: dev,
    authorId: userId,
    authorDisplayName: authorDisplayName,
    authorProfilePicURL: authorProfilePicURL,
    media: postMedia,
    archived: false,
    isReply: isReply,
    likedBy: [],
    replies: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await setPostById(id, post);

  // Optionally update post that is being replied to.
  if (isReply) {
    await atomicUpdatePostById(replyTo, (postBeingRepliedTo) => {
      postBeingRepliedTo.replies.push(id);
    });
  }
  return Success;
});
