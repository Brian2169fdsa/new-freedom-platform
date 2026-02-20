import {z} from "zod";

export const UnlikePostReq = z.object({
  id: z.string().min(1),
});

export type UnlikePostReq = z.infer<typeof UnlikePostReq>;
