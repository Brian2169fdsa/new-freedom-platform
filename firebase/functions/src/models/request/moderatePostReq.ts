import {z} from "zod";

export const ModeratePostReq = z.object({
  id: z.string().min(1),
  action: z.enum(["allow", "archive"]),
});

export type ModeratePostReq = z.infer<typeof ModeratePostReq>;
