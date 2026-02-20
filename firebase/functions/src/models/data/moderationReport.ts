import {z} from "zod";
import {MODERATION_REPORTS_COLLECTION} from "../../utilities/constants";
import {runTransactionAndUpdate} from "../../utilities/runTransactionAndUpdate";
import {Timestamp, WithFieldValue} from "firebase-admin/firestore";
import {setDocumentById} from "../../utilities/setDocumentById";
import {deleteDocumentById} from "../../utilities/deleteDocById";
import {getDocumentById} from "../../utilities/getDocumentById";
import {updateDocumentById} from "../../utilities/updateDocumentById";

export const ModerationReport = z.object({
  id: z.string().min(1),
  assignedTo: z.string().optional().default(""),
  availableAt: z.instanceof(Timestamp),
  contentId: z.string().min(1),
  reportType: z.string().min(1),
  reportedBy: z.string().min(1),
  source: z.string().min(1),
  status: z.enum(["pending", "assigned", "completed"]).default("pending"),
  ownerId: z.string().min(1),
  action: z.enum(["pending", "allow", "archive"]).default("pending"),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
}).strict();

export type ModerationReport = WithFieldValue<z.infer<typeof ModerationReport>>;

export const atomicUpdateModerationReportById =
  runTransactionAndUpdate(ModerationReport, MODERATION_REPORTS_COLLECTION);
export const setModerationReportById =
  setDocumentById<ModerationReport>(MODERATION_REPORTS_COLLECTION);
export const deleteModerationReportById =
  deleteDocumentById(MODERATION_REPORTS_COLLECTION);
export const getModerationReportById =
  getDocumentById(ModerationReport, MODERATION_REPORTS_COLLECTION);
export const updateModerationReportById =
  updateDocumentById<ModerationReport>(MODERATION_REPORTS_COLLECTION);
