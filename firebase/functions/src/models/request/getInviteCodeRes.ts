/* v8 ignore start */
import {z} from "zod";

export const GetInviteCodeRes = z.string().min(1);

export type GetInviteCodeRes = z.infer<typeof GetInviteCodeRes>;
