import {z} from "zod";

export const UpdateUserReq = z.object({
  anonymous: z.boolean().default(true),
  allowPhoneContact: z.boolean().default(false),
  displayName: z.string().default(""),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
});

export type UpdateUserReq = z.infer<typeof UpdateUserReq>;
