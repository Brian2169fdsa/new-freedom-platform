import {callHandler} from "../interfaces/callHandler";
import {RequestConfig} from "../interfaces/requestConfig";
import {EmptyReq} from "../interfaces/emptyReq";
import {
  GetPendingModerationReportIdRes,
} from "../models/request/getPendingModerationReportIdRes";
import {ResponseMsgBase} from "../interfaces/responseBase";
import {IsAdminUser} from "../interfaces/context";
import {MODERATION_REPORTS_COLLECTION} from "../utilities/constants";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {
  atomicUpdateModerationReportById,
} from "../models/data/moderationReport";
import {validateOrThrow} from "../utilities/validateOrThrow";
import {AlreadyAssignedError} from "../utilities/errors";

const config: RequestConfig<
  typeof EmptyReq, GetPendingModerationReportIdRes | ResponseMsgBase> = {
    name: "getPendingModerationReportId",
    contextOptions: IsAdminUser,
    schema: EmptyReq,
  };

/**
 * Returns String id for a pending moderation report and internally
 * assigns the report to the requesting admin user. This is intended
 * to function as a logical lock so that only one reviewer is assigned
 * to any moderationReport document.
 *
 * If there are no reports pending for moderation, returns success.
 *
 * @param {Object} request - The request object.
 * @throws {Error} If the user is not authenticated or not an admin.
 * @throws {Error} If any unexpected error occurs during the process.
 * @returns {String} A String id of a pending moderation report.
 * @returns {Object} success - If there is nothing to moderate.
 */
export const getPendingModerationReportId = callHandler(
  config,
  async (request, ctx
  ) => {
  // Require auth.
    const authId = ctx.authUserId;

    // Get report from moderation reports collection.
    const querySnapshot = await getFirestore()
      .collection(MODERATION_REPORTS_COLLECTION)
      .where("status", "in", ["pending", "assigned"])
      .where("availableAt", "<=", new Date())
      .limit(1)
      .get();

    // Early out if nothing to moderate.
    if (querySnapshot.empty) {
      return {success: "nothing to moderate"};
    }

    // Get id of the first report from the query.
    const reportId = querySnapshot.docs[0].id;

    // Fetch+update report in single transaction.
    await atomicUpdateModerationReportById(reportId, (report) => {
    // Early out if report got assigned.
      const notAssigned = !report.assignedTo;
      const availableAt = report.availableAt;
      const available = availableAt.toDate().getTime() < new Date().getTime();
      /* Ignore Firebase untestable condition */
      // Protect against edge case where we found a report to moderate, but
      // in the time between finding it and starting this transaction (that
      // locks the report for a read+write), another moderator was assigned.
      /* v8 ignore next */
      validateOrThrow(available || notAssigned, AlreadyAssignedError);

      // Update report as assigned and available again in one hour.
      const anHourFromNow = new Date();
      anHourFromNow.setMinutes(anHourFromNow.getMinutes() + 60);
      report.status = "assigned";
      report.assignedTo = authId;
      report.availableAt = Timestamp.fromDate(anHourFromNow);
    });

    // Return the moderation report id.
    return {
      moderationReportId: reportId,
    };
  });
