import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {ResponseBase, Success} from "../interfaces/responseBase";
import {ReportPostReq} from "../models/request/reportPostReq";
import {
  ModerationReport,
  setModerationReportById,
} from "../models/data/moderationReport";
import {FieldValue} from "firebase-admin/firestore";
import {getModerationReportId} from "../utilities/getModerationReportId";

const config: RequestConfig<typeof ReportPostReq, ResponseBase> = {
  name: "reportPost",
  schema: ReportPostReq,
};

/**
 * Reports a post for moderation.
 *
 * @param {Object} request - The Firebase Cloud Function request object.
 * @param {string} id - The ID of the post to be reported.
 * @param {string} reportType - The type of report indicating
 *    the reason for moderation.
 * @returns {Object} - A success object.
 * @throws {Error} - Throws an error if authentication fails or
 *    required parameters are missing.
 */
export const reportPost = callHandler(config, async (request, ctx) => {
  // Get auth user id.
  const userId = ctx.authUserId;

  // Require post id and report type.
  const {id} = request;
  const {reportType} = request;
  const reportId = getModerationReportId(id, userId);

  // Save new moderation report.
  const moderationReportData: ModerationReport = {
    id: reportId,
    availableAt: FieldValue.serverTimestamp(),
    contentId: id,
    reportType: reportType,
    reportedBy: userId,
    assignedTo: "",
    source: "post",
    status: "pending",
    ownerId: userId,
    action: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await setModerationReportById(reportId, moderationReportData);

  return Success;
});
