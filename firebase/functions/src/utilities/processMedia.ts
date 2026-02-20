import {RequestMediaElement} from "../models/request/requestMediaElement";
import {MediaElement} from "../models/data/mediaElement";
import {saveRequestImage} from "./saveRequestImage";
import {saveRequestVideo} from "./saveRequestVideo";

/**
 * Processes an array of media elements, saving images and
 * videos based on their file extensions, returning an array
 * of MediaElement (the resulting URLs of the media and its
 * associated thumbnail).
 *
 * @param {RequestMediaElement[]} requestMedia - An array of media elements
 *    to be processed.
 * @param {string} userId - The user ID associated with the media processing.
 * @param {string} collection - The collection associated with the media.
 * @return {Promise<MediaElement[]>} - A promise that resolves to an array
 *    of MediaElement representing the processed media.
 * @throws {Error} Throws an error if there is an issue processing the media.
 */
export const processMedia = async (
  requestMedia: RequestMediaElement[],
  userId: string,
  collection: string):
  Promise<MediaElement[]> => {
  const postMedia: MediaElement[] = [];
  // Early out if no request media.
  if (requestMedia == null || requestMedia == undefined) {
    return postMedia;
  }

  // Process each piece of request media.
  for (let mediaIndex = 0; mediaIndex < requestMedia.length; mediaIndex++) {
    let mediaElement: MediaElement;
    if (requestMedia[mediaIndex].filename.endsWith(".jpg")) {
      mediaElement = await saveRequestImage(
        requestMedia[mediaIndex], collection, userId,
      );
    } else {
      mediaElement = await saveRequestVideo(
        requestMedia[mediaIndex], collection, userId,
      );
    }
    postMedia.push(mediaElement);
  }
  return postMedia;
};
