import {z} from "zod";

export const MarkMessageAsReadReq = z.object({
  id: z.string().min(1),
});

export type MarkMessageAsReadReq = z.infer<typeof MarkMessageAsReadReq>;
