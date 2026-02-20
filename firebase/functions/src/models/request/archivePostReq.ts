import {z} from "zod";

export const ArchivePostReq = z.object({
  id: z.string().min(1),
});

export type ArchivePostReq = z.infer<typeof ArchivePostReq>;
