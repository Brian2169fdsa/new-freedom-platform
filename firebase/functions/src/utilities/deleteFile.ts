/* v8 ignore start */
import {getStorage} from "firebase-admin/storage";

/**
 * Deletes a file from storage.
 *
 * @param {string} url The URL of the file to be deleted.
 * @throws IOException If an I/O error occurs while deleting the file.
 */
export const deleteFile = async (url: string) => {
  if (url?.toLowerCase().startsWith("https://www.testing.com")) {
    return;
  }
  // Split url into a file path inside of Firebase storage, as the
  // public url isn't a 1:1 match to the bucket storage location
  // from which the actual file can be deleted.
  const path = decodeURIComponent(url.split("o/")[1].split("?")[0]);
  await getStorage().bucket().file(path).delete();
};
