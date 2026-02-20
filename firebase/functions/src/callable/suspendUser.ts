import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {callHandler} from "../interfaces/callHandler";
import {getUserById, updateUserById} from "../models/data/user";
import {setDocument} from "../utilities/setDocument";
import {getAuth} from "firebase-admin/auth";
import {FieldValue} from "firebase-admin/firestore";
import {IsAdminUser} from "../interfaces/context";
import {SuspendUserReq} from "../models/request/suspendUserReq";
import {SUSPENDED_USERS_COLLECTION} from "../utilities/constants";

const config: RequestConfig<
  typeof SuspendUserReq, ResponseBase> = {
    name: "suspendUser",
    contextOptions: IsAdminUser,
    schema: SuspendUserReq,
  };

/**
 * Suspends a user from the system by archiving their user document
 * and adding a new document in the suspended users collection.
 * Additionally, the user's auth will be disabled, and they will
 * no longer be able to log in.
 *
 * @param {Object} request - The request object.
 * @throws {Error} If any of the following conditions occur:
 * - The user making the request is not authenticated.
 * - An error occurs during the user suspension process.
 * @return {Object} An object indicating the success of suspending the user.
 */
export const suspendUser = callHandler(config, async (request) => {
  // Get the user document.
  const {id} = request;
  const user = await getUserById(id);

  // Save user in suspended users collection.
  await setDocument(SUSPENDED_USERS_COLLECTION, id, id, user);

  // Save user as archived.
  await updateUserById(id, {
    archived: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Disable user's auth.
  await getAuth().updateUser(id, {
    disabled: true,
  });

  return Success;
});
