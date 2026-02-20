import {z} from "zod";

export const VerifyInviteCodeReq = z.object({
  inviteCode: z.string().min(1),
});

export type VerifyInviteCodeReq = z.infer<typeof VerifyInviteCodeReq>;
