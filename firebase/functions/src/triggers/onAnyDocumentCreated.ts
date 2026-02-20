/* v8 ignore start */
import {FieldValue} from "firebase-admin/firestore";
import {onDocumentCreated} from "firebase-functions/v2/firestore";

/**
 * Defines a Firestore trigger to add required fields to
 * newly-created documents in a specific collection.
 *
 * This function sets up a Firestore trigger to automatically add specific
 * fields, such as 'id,' 'createdAt,' and 'updatedAt,' to documents when
 * they are created in the specified collection. These fields help track
 * and manage document metadata.
 *
 * @param {string} collectionId - The id of the Firestore collection where
 *    documents are being created.
 * @param {function} eventHandler - The event handler function to be
 *    executed when a document is created.
 *
 * @return {void} This function sets up the Firestore trigger but does
 *    not return a value.
 */
export const onAnyDocumentCreated =
  onDocumentCreated("{collectionId}/{objectId}",
    (event) => {
      if (!event.data) return;
      return event.data.ref.set({
        id: event.params.objectId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }
  );
