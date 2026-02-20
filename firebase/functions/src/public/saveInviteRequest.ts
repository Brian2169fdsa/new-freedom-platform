import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {requestHandler} from "../interfaces/requestHandler";
import {SaveInviteRequestReq} from "../models/request/saveInviteRequestReq";
import {v4 as uuidv4} from "uuid";
import {
  InviteRequest,
  setInviteRequestById,
} from "../models/data/inviteRequest";
import {INVITE_REQUESTS_COLLECTION} from "../utilities/constants";

const config: RequestConfig<typeof SaveInviteRequestReq, ResponseBase> = {
  name: "saveInviteRequest",
  schema: SaveInviteRequestReq,
};

/**
 * Saves a new invite request for a given email address.
 *
 * @param {Object} req - The request object.
 * @param {string} req.query.email - The string email of the request.
 * @param {Object} res - The response object used to send the result.
 * @throws {Error} If an error occurs during the process.
 *
 * @return {Object} An object indicating the success of the verification.
 */
export const saveInviteRequest = requestHandler(config, async (req) => {
  // Require email.
  const {email} = req;

  // Early out if email already requested invite.
  const querySnapshot = await getFirestore()
    .collection(INVITE_REQUESTS_COLLECTION)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!querySnapshot.empty) {
    return Success;
  }

  // Generate a new invite request id.
  const {id} = req;
  /* Ignore untestable condition */
  // Tests need to specify resulting requestId so
  // they can find the document in the database.
  // In prod circumstances, this function will
  // just generate a new uuid on the fly.
  /* v8 ignore next */
  const requestId = id ?? uuidv4();

  // Save new invite request.
  const inviteRequest: InviteRequest = {
    id: requestId,
    ownerId: requestId,
    status: "pending",
    email: email,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  setInviteRequestById(requestId, inviteRequest);

  return Success;
});
