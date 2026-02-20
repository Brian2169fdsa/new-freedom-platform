import {z} from "zod";

export const ReportPostReq = z.object({
  id: z.string().min(1),
  reportType: z.string().min(1),
});

export type ReportPostReq = z.infer<typeof ReportPostReq>;
