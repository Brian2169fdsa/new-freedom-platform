import {z} from "zod";

export const MeRes = z.object({
  email: z.string().email().min(1),
  security: z.object({
    subspace: z.literal("positionofneutrality"),
  }),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type MeRes = z.infer<typeof MeRes>;
