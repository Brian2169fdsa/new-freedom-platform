import {RequestConfig} from "../interfaces/requestConfig";
import {EmptyReq} from "../interfaces/emptyReq";
import {callHandler} from "../interfaces/callHandler";
import {GetInviteCodeRes} from "../models/request/getInviteCodeRes";
import {Invite, setInviteById} from "../models/data/invite";
import {FieldValue} from "firebase-admin/firestore";

const config: RequestConfig<typeof EmptyReq, GetInviteCodeRes> = {
  name: "getInviteCode",
  schema: EmptyReq,
};

/**
 * Returns a string invite code.
 *
 * @param {Object} request - The Firebase Function request object.
 * @throws {Error} Throws an internal error if there is an issue.
 * @return {Promise<string>} A promise that resolves with string invite code.
 */
export const getInviteCode = callHandler(config, async (request, ctx) => {
  // Require auth.
  const userId = ctx.authUserId;

  // Generate invite id (code is equal to the id).
  let inviteId = "";
  const inviteLength = 8;
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < inviteLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    inviteId += characters.charAt(randomIndex);
  }

  // Save invite.
  const invite: Invite = {
    id: inviteId,
    inviteCode: inviteId,
    authorId: userId,
    ownerId: userId,
    useCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await setInviteById(inviteId, invite);

  return inviteId;
});
