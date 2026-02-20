import {z} from "zod";

/**
 * RequestMediaElement is an object used in client requests
 * that intend to transmit media (image or video). It consists
 * of data required for persisting media, including a filename
 * (that can help determine if it is an image or a video), data
 * (the full-size image or video, encoded as a base64 string),
 * and thumbnailData (the smaller image related to the
 * original image or video, encoded as a base64 string).
 */
export const RequestMediaElement = z.object({
  filename: z.string().min(1),
  data: z.string().min(1),
  thumbnailData: z.string().min(1),
});

export type RequestMediaElement = z.infer<typeof RequestMediaElement>;

