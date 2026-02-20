import {z} from "zod";

export const BlockUserReq = z.object({
  id: z.string().min(1),
});

export type BlockUserReq = z.infer<typeof BlockUserReq>;
