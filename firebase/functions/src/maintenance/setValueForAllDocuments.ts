/* v8 ignore start */
import * as serviceAccount from "../tests/newfreedom_service_account_key.json";
import {initializeApp, cert} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {ServiceAccount} from "firebase-admin/lib/app";
initializeApp({
  credential: cert(serviceAccount as unknown as ServiceAccount),
});
getFirestore().settings({ignoreUndefinedProperties: true});

/**
 * Sets a value for all documents in a collection.
 *
 */
const setValueForAllDocuments = async () => {
  const collectionName = "aCollection";
  const querySnapshot = await getFirestore()
    .collection(collectionName)
    .get();
  const batch = getFirestore().batch();
  querySnapshot.forEach((objectSnapshot) => {
    // const ref = objectSnapshot.ref;
    // const document = objectSnapshot.data();
    // document.something = "aValue";
    // batch.update(ref, document);
  });
  await batch.commit();
};

setValueForAllDocuments();
