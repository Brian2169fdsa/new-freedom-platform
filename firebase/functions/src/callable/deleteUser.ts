import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {EmptyReq} from "../interfaces/emptyReq";
import {callHandler} from "../interfaces/callHandler";
import {getUserById, updateUserById} from "../models/data/user";
import {setDocument} from "../utilities/setDocument";
import {DELETED_USERS_COLLECTION} from "../utilities/constants";
import {getAuth} from "firebase-admin/auth";
import {FieldValue} from "firebase-admin/firestore";

const config: RequestConfig<typeof EmptyReq, ResponseBase> = {
  name: "deleteUser",
  schema: EmptyReq,
};

/**
 * Deletes a user from the system by archiving their user document
 * and adding a new document in the deleted users collection.
 * Additionally, the user's auth will be disabled, and they will
 * no longer be able to log in.
 *
 * @param {Object} request - The request object.
 * @throws {Error} If any of the following conditions occur:
 * - The user is not authenticated.
 * - An error occurs during the user deletion process.
 * @return {Object} An object indicating the success of deleting the user.
 */
export const deleteUser = callHandler(config, async (request, ctx) => {
  // Get the user document.
  const userId = ctx.authUserId;
  const user = await getUserById(userId);

  // Save user in deleted users collection.
  await setDocument(DELETED_USERS_COLLECTION, userId, userId, user);

  // Save user as archived.
  await updateUserById(userId, {
    archived: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Disable user's auth.
  await getAuth().updateUser(userId, {
    disabled: true,
  });

  return Success;
});
