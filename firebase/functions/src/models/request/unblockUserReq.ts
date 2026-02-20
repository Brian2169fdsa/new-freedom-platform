import {z} from "zod";

export const UnblockUserReq = z.object({
  id: z.string().min(1),
});

export type UnblockUserReq = z.infer<typeof UnblockUserReq>;
