import {z} from "zod";

export const SuspendUserReq = z.object({
  id: z.string().min(1),
});

export type SuspendUserReq = z.infer<typeof SuspendUserReq>;
