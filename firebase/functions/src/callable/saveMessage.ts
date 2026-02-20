import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {FieldValue} from "firebase-admin/firestore";
import {MESSAGES_COLLECTION} from "../utilities/constants";
import {SaveMessageReq} from "../models/request/saveMessageReq";
import {Message, setMessageById} from "../models/data/message";
import {processMedia} from "../utilities/processMedia";

const config: RequestConfig<typeof SaveMessageReq, ResponseBase> = {
  name: "saveMessage",
  schema: SaveMessageReq,
};

/**
 * Saves a message in Firestore, including optional media.
 */
export const saveMessage = callHandler(config, async (
  request,
  ctx
) => {
  // Require auth.
  const userId = ctx.authUserId;

  // Incoming data.
  const {id} = request;
  const {groupId} = request;
  const {recipientIds} = request;
  const {text} = request;
  const {dev} = request;

  // Process any media in the request.
  const {media} = request;
  const messageMedia = await processMedia(media, MESSAGES_COLLECTION, userId);

  // Save new message.
  const message: Message = {
    id: id,
    authorId: userId,
    ownerId: userId,
    text: text,
    dev: dev,
    groupId: groupId,
    recipientIds: recipientIds,
    archived: false,
    media: messageMedia,
    readBy: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await setMessageById(id, message);

  return Success;
});
