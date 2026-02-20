/* v8 ignore start */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";

/**
 * Firebase onDocumentUpdated trigger entry point for users collection. Updates
 * bookkeeping for newly-updated user documents, including related posts.
 *
 * It checks if specific user properties, such as display name and profile
 * picture URL, have changed. If changes are detected, it updates related
 * posts that require/reference the user's information.
 */
export const onUserUpdated =
  onDocumentUpdated("users/{docId}", async (event) => {
    // Early out if bookkeeping-required properties aren't changed.
    if (!event.data) return;
    const oldUser = event.data.before.data();
    const user = event.data.after.data();
    const nameChanged = user.displayName !== oldUser.displayName;
    const picChanged = user.profilePicURL !== oldUser.profilePicURL;
    const bookkeepingRequired =
      nameChanged ||
      picChanged;
    if (!bookkeepingRequired) return;

    // Update user's posts.
    const postsQuerySnapshot = await getFirestore()
      .collection("posts")
      .where("authorId", "==", user.id)
      .get();
    const batch = getFirestore().batch();
    postsQuerySnapshot.forEach((postDoc) => {
      const postRef = postDoc.ref;
      const post = postDoc.data();
      post.authorDisplayName = user.displayName;
      post.authorProfilePicURL = user.profilePicURL;
      post.updatedAt = FieldValue.serverTimestamp();
      batch.update(postRef, post);
    });
    await batch.commit();
  });
