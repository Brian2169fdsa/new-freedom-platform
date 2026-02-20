/* v8 ignore start */
import {z} from "zod";

export const GetPendingModerationReportIdRes = z.object({
  moderationReportId: z.string().min(1),
});

export type GetPendingModerationReportIdRes =
  z.infer<typeof GetPendingModerationReportIdRes>;
