import {z} from "zod";

export const LikePostReq = z.object({
  id: z.string().min(1),
});

export type LikePostReq = z.infer<typeof LikePostReq>;
