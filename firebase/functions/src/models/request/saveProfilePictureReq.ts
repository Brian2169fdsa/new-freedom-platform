import {z} from "zod";

export const SaveProfilePictureReq = z.object({
  picture: z.string().min(1),
});

export type SaveProfilePictureReq = z.infer<typeof SaveProfilePictureReq>;
