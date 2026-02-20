/* v8 ignore start */
import {getDownloadURL, getStorage} from "firebase-admin/storage";
import {isProd} from "./isProd";

/**
 * Saves an image to storage, if in production environment.
 * If not in production, returns a test-friendly path without saving the image.
 *
 * @param {string} path - The path where the image will be saved.
 * @param {string} dataInBase64 - The image data encoded in base64.
 * @return {Promise<string>} Returns the URL of the saved image or the
 *    original path if not in production.
 */
export const saveImage = async (path: string, dataInBase64: string) => {
  if (!isProd()) {
    return "http://example.com/image.jpg";
  }
  const fileRef = getStorage().bucket().file(path);
  await fileRef.save(Buffer.from(dataInBase64, "base64"), {
    contentType: "image/jpeg",
  });
  return await getDownloadURL(fileRef);
};
