import {z} from "zod";

export const SaveInviteRequestReq = z.object({
  id: z.string().optional(),
  email: z.string().email().min(1),
});

export type SaveInviteRequestReq = z.infer<typeof SaveInviteRequestReq>;
