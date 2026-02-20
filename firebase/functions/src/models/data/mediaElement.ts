import {z} from "zod";

/**
 * MediaElement is an object used on Firestore documents that
 * captures metadata required for displaying media, including
 * a filename (that can help determine if it is an image or
 * a video), an original URL (the full-size image or video),
 * and a thumbnail URL (the smaller image related to the
 * original image or video).
 */
export const MediaElement = z.object({
  filename: z.string().min(1),
  originalURL: z.string().url().min(1),
  thumbnailURL: z.string().url().min(1),
}).strict();

export type MediaElement = z.infer<typeof MediaElement>;
