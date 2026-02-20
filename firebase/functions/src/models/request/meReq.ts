import {z} from "zod";

export const MeReq = z.object({
  token: z.string().min(1),
});

export type MeReq = z.infer<typeof MeReq>;
