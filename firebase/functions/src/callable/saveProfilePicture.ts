import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {updateUserById} from "../models/data/user";
import {FieldValue} from "firebase-admin/firestore";
import {saveImage} from "../utilities/saveImage";
import {SaveProfilePictureReq} from "../models/request/saveProfilePictureReq";

const config: RequestConfig<typeof SaveProfilePictureReq, ResponseBase> = {
  name: "saveProfilePicture",
  schema: SaveProfilePictureReq,
};

/**
 * Saves the user's profile picture.
 *
 * @param {Object} request - The request object.
 * @param {string} request.data.picture - The base64-encoded profile picture.
 * @throws {Error} If any of the following conditions occur:
 * - If the user is not authenticated.
 * - If the profile picture is missing or invalid.
 * - If there is an internal error during the process.
 * @return {Promise<Object>} A promise that resolves with a success status.
 */
export const saveProfilePicture = callHandler(config, async (
  request,
  ctx
) => {
  // Require auth.
  const userId = ctx.authUserId;

  // Save picture.
  const {picture} = request;
  const filepath = "profilePictures/" + userId;
  const profilePicURL = await saveImage(filepath, picture);

  // Save user.
  await updateUserById(userId, {
    profilePicURL: profilePicURL,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return Success;
});
