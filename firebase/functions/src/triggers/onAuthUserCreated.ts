/* v8 ignore start */
import {identity} from "firebase-functions/v2";
import {User, setUserById} from "../models/data/user";
import {FieldValue} from "firebase-admin/firestore";

/**
 * Firebase identity beforeUserCreated trigger entry point.
 *
 * @param {AuthBlockingEvent} event - Event containing the user.
 * @return {Promise<void>} A promise that resolves when the user
 *    document is created in the users collection.
 */
export const onAuthUserCreated = identity.beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return;
  const userData: User = {
    id: user.uid,
    ownerId: user.uid,
    allowPhoneContact: false,
    anonymous: true,
    archived: false,
    blockedUsers: [],
    dev: false,
    displayName: "",
    email: user.email ?? "",
    firstName: "",
    lastName: "",
    likeCount: 0,
    phone: "",
    profilePicURL: "",
    role: "member",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await setUserById(user.uid, userData);
});
