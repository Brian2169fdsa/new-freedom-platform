/* v8 ignore start */
import {getDownloadURL, getStorage} from "firebase-admin/storage";
import {isProd} from "./isProd";

/**
 * Saves a video to storage, if in production environment.
 * If not in production, returns a test-friendly path without saving the video.
 *
 * @param {string} path - The path where the video will be saved.
 * @param {string} dataInBase64 - The video data encoded in base64.
 * @return {Promise<string>} Returns the URL of the saved video or the
 *    original path if not in production.
 */
export const saveVideo = async (path: string, dataInBase64: string) => {
  if (!isProd()) {
    return "http://example.com/video.mp4";
  }
  const fileRef = getStorage().bucket().file(path);
  await fileRef.save(Buffer.from(dataInBase64, "base64"), {
    contentType: "video/mp4",
  });
  return await getDownloadURL(fileRef);
};
