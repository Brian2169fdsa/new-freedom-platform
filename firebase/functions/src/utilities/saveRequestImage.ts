import {MediaElement} from "../models/data/mediaElement";
import {RequestMediaElement} from "../models/request/requestMediaElement";
import {saveImage} from "./saveImage";

/**
 * Saves RequestMediaElement (image, plus a thumbnail) to Firebase
 * storage and returns MediaElement including the base filename and the
 * URLs of the resulting files.
 *
 * @param {RequestMediaElement} requestMediaElement - The media element to be
 *    saved, including its data and thumbnail data.
 * @param {string} rootDir - The root directory where the media will be
 *    stored in Firebase Storage.
 * @param {string} userId - The unique id of the user to whom the
 *    media belongs.
 * @return {MediaElement} A MediaElement containing metadata for the saved
 *    media, including the filename, original URL, and thumbnail URL.
 */
export const saveRequestImage = async (
  requestMediaElement: RequestMediaElement,
  rootDir: string,
  userId: string): Promise<MediaElement> => {
  // Save incoming request media item's image.
  const filename = requestMediaElement.filename;
  const originalData = requestMediaElement.data;
  const originalFilepath = rootDir + "/" + userId + "/" + filename;
  const originalURL = await saveImage(originalFilepath, originalData);

  // Save incoming thumbnail related to original image.
  const thumbData = requestMediaElement.thumbnailData;
  const thumbFilename = filename.replace(/\.[^.]+$/, "") + "_thumb.jpg";
  const thumbFilepath = rootDir + "/" + userId + "/" + thumbFilename;
  const thumbnailURL = await saveImage(thumbFilepath, thumbData);

  // Set up new media element.
  const mediaElement: MediaElement = {
    filename: filename,
    originalURL: originalURL,
    thumbnailURL: thumbnailURL,
  };

  return mediaElement;
};
