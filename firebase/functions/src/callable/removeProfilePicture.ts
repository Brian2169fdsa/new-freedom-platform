import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {EmptyReq} from "../interfaces/emptyReq";
import {IncludeAuthUser} from "../interfaces/context";
import {updateUserById} from "../models/data/user";
import {FieldValue} from "firebase-admin/firestore";
import {deleteFile} from "../utilities/deleteFile";

const config: RequestConfig<typeof EmptyReq, ResponseBase> = {
  name: "removeProfilePicture",
  contextOptions: IncludeAuthUser,
  schema: EmptyReq,
};

/**
 * Removes the user's profile picture and updates user data.
 *
 * This function is responsible for removing the user's profile picture and
 * updating the user's data. It first verifies the user's authentication,
 * checks if the user has a profile picture set, and proceeds to update the
 * user's data by removing the profile picture URL. It also deletes the
 * existing profile picture file from Firebase Storage if it exists.
 *
 * @param {Object} request - The request object.
 * @throws {Error} If any of the following conditions occur:
 * - The user is not authenticated.
 * - An error occurs during the removal of the profile
 *    picture or user data update.
 *
 * @return {Object} An object indicating the success of the operation.
 */
export const removeProfilePicture = callHandler(config, async (
  request,
  ctx
) => {
  // Require auth.
  const userId = ctx.authUserId;
  const user = ctx.authUser;

  // Early out if profile pic not set.
  const picURL = user.profilePicURL;
  if (picURL === null || picURL === undefined || picURL === "") {
    return Success;
  }

  // Save user.
  await updateUserById(userId, {
    profilePicURL: "",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Remove existing profile pic file.
  await deleteFile(picURL as string);
  return Success;
});
